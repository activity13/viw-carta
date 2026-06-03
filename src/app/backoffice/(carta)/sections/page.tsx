"use client";

import { useEffect, useState, useRef } from "react";
import Axios from "axios";
import { useSession } from "next-auth/react";
import { Reorder, useDragControls } from "motion/react";
import { LayoutGrid, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";
import { Card, CardContent } from "@/components/ui/card";

interface MenuSection {
  _id?: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  name_en?: string;
}

const SectionItem = ({
  section,
  handleDelete,
  handleFieldChange,
}: {
  section: MenuSection;
  handleDelete: (slug: string) => void;
  handleFieldChange: (slug: string, field: keyof MenuSection, value: string) => void;
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={section}
      id={section.slug}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-4 bg-card border rounded-xl p-4 shadow-sm mb-3 transition-shadow hover:shadow-md bg-background"
    >
      <div
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary touch-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px]">ES</span>
            Nombre (ES)
          </Label>
          <Input
            value={section.name}
            onChange={(e) => handleFieldChange(section.slug, "name", e.target.value)}
            placeholder="Ej: Bebidas"
            className="h-10 bg-muted/20"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center text-blue-600 text-[10px]">EN</span>
            Nombre (EN)
          </Label>
          <Input
            value={section.name_en || ""}
            onChange={(e) => handleFieldChange(section.slug, "name_en", e.target.value)}
            placeholder="Ej: Drinks"
            className="h-10 bg-blue-50/50 focus-visible:ring-blue-500 border-blue-200"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Slug / ID
          </Label>
          <div className="h-10 px-3 flex items-center text-xs text-muted-foreground font-mono bg-muted/50 rounded-md border w-full truncate">
            /{section.slug}
          </div>
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 mt-6 sm:mt-0"
        onClick={() => handleDelete(section.slug)}
      >
        <Trash2 className="w-5 h-5" />
      </Button>
    </Reorder.Item>
  );
};

export default function SectionsPage() {
  const { data: session, status } = useSession();
  const restaurantId = session?.user?.restaurantId;
  const { can } = usePermissions();
  const isAdmin = can("edit_menu"); // Sections fall under categories permission

  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firstLoadRef = useRef(true);

  const generateSlug = (text: string): string => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  };

  useEffect(() => {
    if (restaurantId && status === "authenticated") {
      fetchSections();
    }
  }, [restaurantId, status]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await Axios.get(`/api/settings/${restaurantId}`);
      if (res.data?.menuSections) {
        const sorted = [...res.data.menuSections].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );
        setSections(sorted);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar secciones");
    } finally {
      setLoading(false);
      // Allow auto-save after initial fetch
      setTimeout(() => {
        firstLoadRef.current = false;
      }, 500);
    }
  };

  const autoSaveSections = (newSections: MenuSection[]) => {
    if (firstLoadRef.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    toast.loading("Guardando cambios...", { id: "save-sections" });
    setIsSaving(true);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const formData = new FormData();
        formData.append("menuSections", JSON.stringify(newSections));

        const res = await Axios.put(
          `/api/settings/update/${restaurantId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (res.data?.business?.menuSections) {
          toast.success("Secciones actualizadas", { id: "save-sections" });
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al guardar secciones", { id: "save-sections" });
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  };

  const handleAddSection = () => {
    if (!newName.trim()) return;
    const slug = generateSlug(newName);

    if (sections.some((s) => s.slug === slug)) {
      toast.error("Ya existe una sección con este identificador");
      return;
    }

    const newSection: MenuSection = {
      name: newName,
      slug,
      order: sections.length + 1,
      isActive: true,
    };

    const updated = [...sections, newSection];
    setSections(updated);
    setNewName("");
    autoSaveSections(updated);
  };

  const handleDeleteSection = (slug: string) => {
    const updated = sections.filter((s) => s.slug !== slug);
    setSections(updated);
    autoSaveSections(updated);
  };

  const handleFieldChange = (slug: string, field: keyof MenuSection, value: string) => {
    const updated = sections.map((s) => {
      if (s.slug === slug) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setSections(updated);
    autoSaveSections(updated);
  };

  const handleReorder = (newOrder: MenuSection[]) => {
    const reordered = newOrder.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(reordered);
    autoSaveSections(reordered);
  };

  if (status === "loading") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AccessDeniedCard message="No tienes los permisos necesarios para gestionar las secciones. Esta área es exclusiva para administradores." />
    );
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-primary" />
            Gestión de Secciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Organiza los grandes bloques de tu carta (Ej. Comidas, Bebidas,
            Postres). Arrastra para reordenar.
          </p>
        </div>
      </div>

      {/* Creación */}
      <Card className="bg-muted/10 border-dashed">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 space-y-2 w-full">
              <Label className="text-sm font-semibold">Nueva Sección</Label>
              <Input
                placeholder="Ej: Bebidas & Cocteles"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
                className="h-12 bg-background text-lg"
              />
            </div>
            <Button
              onClick={handleAddSection}
              disabled={!newName.trim()}
              size="lg"
              className="w-full sm:w-auto h-12 px-8"
            >
              <Plus className="w-5 h-5 mr-2" /> Crear Sección
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="pt-4">
        {sections.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/5">
            <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No hay secciones creadas
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Agrega tu primera sección arriba para empezar a organizar tu menú.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={sections}
            onReorder={handleReorder}
            className="space-y-1"
          >
            {sections.map((sec) => (
              <SectionItem
                key={sec.slug}
                section={sec}
                handleDelete={handleDeleteSection}
                handleFieldChange={handleFieldChange}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
