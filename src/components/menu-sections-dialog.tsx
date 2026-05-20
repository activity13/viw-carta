"use client";

import { useState, useEffect } from "react";
import Axios from "axios";
import { Loader2, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reorder, useDragControls } from "motion/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MenuSection {
  _id?: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}

interface MenuSectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  onSectionsUpdated: (sections: MenuSection[]) => void;
}

const SectionItem = ({
  section,
  handleDelete,
  handleNameChange,
}: {
  section: MenuSection;
  handleDelete: (slug: string) => void;
  handleNameChange: (slug: string, newName: string) => void;
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={section}
      id={section.slug}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-3 bg-card border rounded-lg p-3 shadow-sm mb-2"
    >
      <div
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 items-center">
        <div>
          <Input
            value={section.name}
            onChange={(e) => handleNameChange(section.slug, e.target.value)}
            placeholder="Nombre de la sección"
            className="h-8"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-1.5 rounded truncate">
          /{section.slug}
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
        onClick={() => handleDelete(section.slug)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </Reorder.Item>
  );
};

export function MenuSectionsDialog({
  open,
  onOpenChange,
  restaurantId,
  onSectionsUpdated,
}: MenuSectionsDialogProps) {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New section form
  const [newName, setNewName] = useState("");

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
    if (open && restaurantId) {
      fetchSections();
    }
  }, [open, restaurantId]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await Axios.get(`/api/settings/${restaurantId}`);
      if (res.data?.menuSections) {
        // Sort by order
        const sorted = [...res.data.menuSections].sort((a, b) => (a.order || 0) - (b.order || 0));
        setSections(sorted);
        onSectionsUpdated(sorted);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar secciones");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    if (!newName.trim()) return;
    const slug = generateSlug(newName);

    if (sections.some(s => s.slug === slug)) {
      toast.error("Ya existe una sección con este identificador");
      return;
    }

    const newSection: MenuSection = {
      name: newName,
      slug,
      order: sections.length + 1,
      isActive: true,
    };

    setSections([...sections, newSection]);
    setNewName("");
  };

  const handleDeleteSection = (slug: string) => {
    setSections(sections.filter(s => s.slug !== slug));
  };

  const handleNameChange = (slug: string, updatedName: string) => {
    setSections(sections.map(s => {
      if (s.slug === slug) {
        return { ...s, name: updatedName };
      }
      return s;
    }));
  };

  const handleReorder = (newOrder: MenuSection[]) => {
    // Update order values internally
    const reordered = newOrder.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(reordered);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("menuSections", JSON.stringify(sections));

      const res = await Axios.put(`/api/settings/update/${restaurantId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.business?.menuSections) {
        toast.success("Secciones actualizadas");
        onSectionsUpdated(res.data.business.menuSections);
        onOpenChange(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar secciones");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestionar Secciones del Menú</DialogTitle>
          <DialogDescription>
            Crea, renombra y ordena las secciones principales de tu menú (Ej: Carta, Bebidas, Promos).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Add new */}
              <div className="flex items-end gap-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Nueva Sección</Label>
                  <Input
                    placeholder="Ej: Bebidas & Cocteles"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
                  />
                </div>
                <Button onClick={handleAddSection} type="button" disabled={!newName.trim()}>
                  <Plus className="w-4 h-4 mr-2" /> Añadir
                </Button>
              </div>

              {/* List */}
              <div className="max-h-[300px] overflow-y-auto pr-2">
                {sections.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No hay secciones definidas.
                  </p>
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
                        handleNameChange={handleNameChange}
                      />
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
