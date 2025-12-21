"use client";

import { useEffect, useState } from "react";
import Axios from "axios";
import { Reorder, useDragControls } from "motion/react";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Save,
  GripVertical,
  X,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useFab } from "@/providers/ActionProvider";
import { CategoryFormDialog } from "@/components/category-form-dialog";

interface Category {
  _id: string;
  name: string;
  code: number | string;
  slug: string;
  description?: string;
  restaurantId: string;
  isActive?: boolean;
  order?: number;
}

// Sub-component for individual category items to handle DragControls properly
const CategoryItem = ({
  cat,
  editingId,
  editForm,
  setEditingId,
  setEditForm,
  handleSaveEdit,
  handleDelete,
  handleEdit,
  handleToggle,
}: {
  cat: Category;
  editingId: string | null;
  editForm: Partial<Category>;
  setEditingId: (id: string | null) => void;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Category>>>;
  handleSaveEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleEdit: (cat: Category) => void;
  handleToggle: (id: string, currentStatus: boolean) => void;
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={cat}
      id={cat._id}
      dragListener={false}
      dragControls={dragControls}
      className={`bg-card border rounded-lg shadow-sm relative transition-opacity ${
        !cat.isActive ? "opacity-60" : ""
      }`}
    >
      <div className="p-4 flex items-start gap-4">
        {/* Drag Handle */}
        <div
          className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-1">
          {editingId === cat._id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Código</Label>
                  <Input
                    value={editForm.code?.toString() || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        code: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Identificador URL</Label>
                <Input
                  value={editForm.slug || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      slug: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descripción</Label>
                <Textarea
                  value={editForm.description || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button size="sm" onClick={() => handleSaveEdit(cat._id)}>
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {cat.name}
                    {!cat.isActive && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Oculto
                      </Badge>
                    )}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {cat.code}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      /{cat.slug}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-2">
                    <Label
                      htmlFor={`switch-${cat._id}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      {cat.isActive ? "Visible" : "Oculto"}
                    </Label>
                    <Switch
                      id={`switch-${cat._id}`}
                      checked={cat.isActive ?? true}
                      onCheckedChange={() =>
                        handleToggle(cat._id, cat.isActive ?? true)
                      }
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(cat)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(cat._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {cat.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {cat.description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
};

export default function CategoryUI({ restaurantId }: { restaurantId: string }) {
  const { setActions } = useFab();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    slug: "",
    description: "",
    order: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await Axios.get("/api/categories/get", {
        params: { restaurantId },
      });
      // Ensure sorted by order
      const sorted = res.data.sort(
        (a: Category, b: Category) => (a.order || 0) - (b.order || 0)
      );
      setCategories(sorted);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchCategories();
  }, [restaurantId]);

  // Register FAB Actions
  useEffect(() => {
    setActions([
      {
        label: "Nueva Categoría",
        icon: Plus,
        onClick: () => setIsDialogOpen(true),
      },
      {
        label: "Guardar Orden",
        icon: Save,
        onClick: saveOrder,
        disabled: isSavingOrder || categories.length === 0,
        loading: isSavingOrder,
      },
    ]);

    // Cleanup on unmount
    return () => setActions([]);
  }, [categories, isSavingOrder, setActions]);

  // Create category logic (reused by both forms)
  const createCategory = async (data: typeof form) => {
    if (!data.name || !data.code || !data.slug) {
      toast.warning("Por favor completa los campos obligatorios");
      return;
    }

    setIsCreating(true);
    try {
      await Axios.post("/api/categories/create", {
        ...data,
        code: data.code,
        restaurantId,
        order: categories.length + 1,
      });
      toast.success("Categoría creada exitosamente");
      fetchCategories();
      setIsDialogOpen(false); // Close dialog if open
      // Reset inline form
      setForm({
        name: "",
        code: "",
        slug: "",
        description: "",
        order: 0,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al crear la categoría");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle inline create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCategory(form);
  };

  // Toggle Visibility
  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c._id === id ? { ...c, isActive: !currentStatus } : c))
    );

    try {
      await Axios.put("/api/categories/update", {
        id,
        isActive: !currentStatus,
        restaurantId,
      });
      toast.success(
        !currentStatus ? "Categoría visible" : "Categoría ocultada"
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar estado");
      // Revert on error
      setCategories((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: currentStatus } : c))
      );
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;

    const toastId = toast.loading("Eliminando categoría...");
    try {
      await Axios.delete("/api/categories/delete", {
        data: { id, restaurantId },
      });
      toast.dismiss(toastId);
      toast.success("Categoría eliminada");
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (error: any) {
      console.error(error);
      toast.dismiss(toastId);
      if (error.response && error.response.status === 409) {
        toast.error("No se puede eliminar", {
          description:
            error.response.data.details ||
            "La categoría tiene productos asociados.",
          duration: 5000,
        });
      } else {
        toast.error("Error al eliminar la categoría");
      }
    }
  };

  // Edit category
  const handleEdit = (cat: Category) => {
    setEditingId(cat._id);
    setEditForm({
      name: cat.name,
      code: cat.code,
      slug: cat.slug,
      description: cat.description,
      order: cat.order,
    });
  };

  // Save edit
  const handleSaveEdit = async (id: string) => {
    const toastId = toast.loading("Guardando cambios...");
    try {
      await Axios.put("/api/categories/update", {
        id,
        ...editForm,
        restaurantId,
      });
      setEditingId(null);
      setEditForm({});
      toast.dismiss(toastId);
      toast.success("Categoría actualizada");
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Error al actualizar la categoría");
    }
  };

  // Handle Reorder
  const handleReorder = (newOrder: Category[]) => {
    setCategories(newOrder);
  };

  // Save Order to Backend
  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const payload = {
        categories: categories.map((c) => ({ id: c._id })),
        restaurantId,
      };

      await Axios.put("/api/categories/reorder", payload);

      toast.success("Orden actualizado");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el orden");
    } finally {
      setIsSavingOrder(false);
    }
  };

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

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-primary" />
            Gestión de Categorías
          </h1>
          <p className="text-muted-foreground mt-1">
            Crea, edita y organiza las categorías de tu menú.
          </p>
        </div>
        {/* Desktop Save Button - Hidden on Mobile since it's in FAB */}
        <Button
          onClick={saveOrder}
          disabled={isSavingOrder || categories.length === 0}
          variant="outline"
          className="hidden md:flex"
        >
          {isSavingOrder ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Orden
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Creación - Hidden on Mobile */}
        <Card className="h-fit lg:sticky lg:top-8 hidden lg:block">
          <CardHeader>
            <CardTitle className="text-lg">Nueva Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej. Entradas"
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const slug = generateSlug(val);
                    const code = val.substring(0, 3).toUpperCase();

                    setForm((f) => ({
                      ...f,
                      name: val,
                      slug: f.slug || slug, // Only auto-fill if empty or we can track "touched" state. For simplicity, let's just update if it looks like it was auto-generated or empty.
                      // Actually, a better UX is to always update slug unless user manually edited it.
                      // But without extra state, let's just update it.
                      // The user can edit it afterwards.
                      code: f.code || code,
                    }));
                    // Better approach:
                    // If the current slug matches the generated slug of the OLD name, then update it.
                    // But here we don't have the old name easily.
                    // Let's just update it for now as it's a creation form.
                    if (!form.slug || form.slug === generateSlug(form.name)) {
                      setForm((prev) => ({ ...prev, slug }));
                    }
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    placeholder="ENT"
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Identificador URL</Label>
                  <Input
                    id="slug"
                    placeholder="entradas"
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Breve descripción de la categoría..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Crear Categoría
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Categorías */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">
                No hay categorías registradas.
              </p>
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={categories}
              onReorder={handleReorder}
              className="space-y-3"
            >
              {categories.map((cat) => (
                <CategoryItem
                  key={cat._id}
                  cat={cat}
                  editingId={editingId}
                  editForm={editForm}
                  setEditingId={setEditingId}
                  setEditForm={setEditForm}
                  handleSaveEdit={handleSaveEdit}
                  handleDelete={handleDelete}
                  handleEdit={handleEdit}
                  handleToggle={handleToggle}
                />
              ))}
            </Reorder.Group>
          )}
        </div>
      </div>
      {/* Mobile Dialog for Creation */}
      <CategoryFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={createCategory}
        loading={isCreating}
      />
    </div>
  );
}
