"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  GripVertical,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
  name_en: string;
  code: string;
  slug: string;
  description?: string;
  order: number;
}

// Loading component for Suspense fallback
function OnboardingCategoriesLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md bg-card border-border">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-mono uppercase tracking-widest">Cargando categorías...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component content that uses useSearchParams
function OnboardingCategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantId = searchParams.get("restaurantId");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId) {
      loadCategories();
    } else {
      setError("ID de restaurante no proporcionado");
      setIsLoading(false);
    }
  }, [restaurantId]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const [categoriesRes] = await Promise.all([
        axios.get(`/api/categories?restaurantId=${restaurantId}`),
        axios.get(`/api/settings/${restaurantId}`),
      ]);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      setError("Error al cargar las categorías");
      toast.error("No se pudieron cargar las categorías");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para generar código automáticamente
  const generateCode = (name: string, order: number) => {
    const prefix = name.slice(0, 3).toUpperCase();
    return `${prefix}${order.toString().padStart(2, "0")}`;
  };

  // Función para generar slug automáticamente
  const generateSlug = (
    name: string,
    existingCategories: Category[] = categories
  ) => {
    const baseSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Verificar unicidad dentro del restaurante
    let finalSlug = baseSlug;
    let counter = 1;

    while (existingCategories.some((cat) => cat.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return finalSlug;
  };

  // Actualizar code y slug cuando cambia el nombre
  const handleNameChange = (value: string) => {
    setNewCategoryName(value);
    if (value.trim()) {
      const nextOrder = categories.length + 1;
      setNewCategoryCode(generateCode(value.trim(), nextOrder));
      setNewCategorySlug(generateSlug(value.trim()));
    } else {
      setNewCategoryCode("");
      setNewCategorySlug("");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // Si no cambió la posición, no hacer nada
    if (result.source.index === result.destination.index) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar el orden
    const updatedCategories = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setCategories(updatedCategories);

    // Guardar automáticamente
    try {
      setIsSaving(true);
      await axios.put("/api/categories/reorder", {
        restaurantId,
        categories: updatedCategories.map((cat) => ({
          id: cat._id,
          order: cat.order,
        })),
      });
      toast.success("Orden guardado automáticamente");
    } catch (error) {
      console.error("Error al guardar el orden:", error);
      toast.error("Error al guardar el orden");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category._id);
    setEditingName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (categoryId: string) => {
    if (!editingName.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    try {
      const category = categories.find((c) => c._id === categoryId);
      if (!category) return;

      await axios.put("/api/categories", {
        id: categoryId,
        updates: {
          name: editingName.trim(),
          name_en: editingName.trim(), // Simplificado por ahora
          code: category.code, // Mantener el código existente
          slug: generateSlug(editingName.trim()), // Regenerar slug
        },
      });

      setCategories(
        categories.map((cat) =>
          cat._id === categoryId
            ? {
                ...cat,
                name: editingName.trim(),
                name_en: editingName.trim(),
                slug: generateSlug(editingName.trim()),
              }
            : cat
        )
      );

      setEditingId(null);
      setEditingName("");
      toast.success("Categoría actualizada");
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
      toast.error("Error al actualizar categoría");
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Ingresa un nombre para la categoría");
      return;
    }

    if (!newCategoryCode.trim() || !newCategorySlug.trim()) {
      toast.error("Código y slug son obligatorios");
      return;
    }

    try {
      setIsCreating(true);
      const response = await axios.post("/api/categories", {
        name: newCategoryName.trim(),
        name_en: newCategoryName.trim(),
        code: newCategoryCode.trim(),
        slug: newCategorySlug.trim(),
        description: newCategoryDescription.trim(),
        restaurantId,
        order: categories.length + 1,
      });

      setCategories([...categories, response.data]);
      // Limpiar formulario
      setNewCategoryName("");
      setNewCategoryCode("");
      setNewCategorySlug("");
      setNewCategoryDescription("");
      toast.success("Categoría agregada");
    } catch (error) {
      console.error("Error al agregar categoría:", error);
      toast.error("Error al agregar categoría");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;

    try {
      await axios.delete(`/api/categories?id=${categoryId}`);
      setCategories(categories.filter((cat) => cat._id !== categoryId));
      toast.success("Categoría eliminada");
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      toast.error("Error al eliminar categoría");
    }
  };

  const goToProducts = () => {
    router.push(`/onboarding/products?restaurantId=${restaurantId}`);
  };

  const goBack = () => {
    router.push(`/onboarding/welcome?restaurantId=${restaurantId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground font-mono uppercase tracking-widest">Cargando categorías...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-destructive/20 bg-card">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-mono uppercase tracking-widest">{error}</p>
            <Button variant="outline" onClick={goBack} className="mt-4 border-primary text-primary hover:bg-primary/10 rounded-none font-mono">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 font-roboto tracking-widest">
            1/2: ESTRUCTURA DE CATEGORÍAS
          </h1>
          <p className="text-muted-foreground font-mono uppercase text-xs tracking-wider">
            Define los pilares de tu carta. Arrastra para reordenar.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-border rounded-none h-1 mb-8 overflow-hidden">
          <div
            className="bg-primary h-1 transition-all duration-500"
            style={{ width: "50%" }}
          ></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories List */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border rounded-none shadow-none">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-roboto uppercase tracking-widest">
                  <FolderOpen className="w-4 h-4" />
                  Listado Maestro
                  {isSaving && (
                    <span className="flex items-center gap-2 text-[10px] font-mono text-primary animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      SYNCING...
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="categories">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {categories.map((category, index) => (
                          <Draggable
                            key={category._id}
                            draggableId={category._id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-3 bg-background border border-border rounded-none transition-colors ${
                                  snapshot.isDragging
                                    ? "border-primary/50 shadow-[0_0_15px_rgba(0,212,146,0.1)]"
                                    : "hover:border-primary/30"
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>

                                <div className="font-mono text-[10px] text-primary/60 w-4">
                                  {(index + 1).toString().padStart(2, "0")}
                                </div>

                                {editingId === category._id ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input
                                      value={editingName}
                                      onChange={(e) =>
                                        setEditingName(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          saveEdit(category._id);
                                        if (e.key === "Escape") cancelEdit();
                                      }}
                                      className="flex-1 bg-card border-primary/50 text-sm font-mono h-8 rounded-none"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-primary hover:bg-primary/10 h-8 w-8 p-0"
                                      onClick={() => saveEdit(category._id)}
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                      onClick={cancelEdit}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <span className="font-mono text-sm block truncate uppercase tracking-tight">
                                          {category.name}
                                        </span>
                                        <div className="flex gap-2 mt-1">
                                          <span className="text-[9px] font-mono text-muted-foreground bg-muted/30 px-1 border border-border uppercase">
                                            {category.code}
                                          </span>
                                          <span className="text-[9px] font-mono text-primary/50 uppercase italic">
                                            /{category.slug}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex gap-1 shrink-0">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEdit(category)}
                                          className="text-muted-foreground hover:text-primary hover:bg-primary/5 h-7 w-7 p-0"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            deleteCategory(category._id)
                                          }
                                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-7 w-7 p-0"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {categories.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground font-mono text-xs uppercase tracking-widest border border-dashed border-border">
                    Terminal vacía. Agrega una categoría para iniciar.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Category */}
          <div className="space-y-6">
            <Card className="bg-card border-border rounded-none shadow-none">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-xs font-roboto uppercase tracking-widest">
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Inserción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="categoryName" className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Nombre</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: ENTRADAS"
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                    className="bg-background border-border hover:border-primary/40 focus:border-primary/60 rounded-none h-9 font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="categoryCode" className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Código</Label>
                    <Input
                      id="categoryCode"
                      value={newCategoryCode}
                      onChange={(e) => setNewCategoryCode(e.target.value)}
                      placeholder="ENT01"
                      className="bg-background border-border focus:border-primary/60 rounded-none h-9 font-mono text-xs uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="categorySlug" className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Slug</Label>
                    <Input
                      id="categorySlug"
                      value={newCategorySlug}
                      onChange={(e) => setNewCategorySlug(e.target.value)}
                      placeholder="entradas"
                      className="bg-background border-border focus:border-primary/60 rounded-none h-9 font-mono text-xs lowercase"
                    />
                  </div>
                </div>

                <Button
                  onClick={addCategory}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-mono text-xs uppercase tracking-widest mt-2"
                  disabled={
                    isCreating ||
                    !newCategoryName.trim() ||
                    !newCategoryCode.trim() ||
                    !newCategorySlug.trim()
                  }
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      PROCESANDO...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-2" />
                      AGREGAR REGISTRO
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 border-t border-border pt-8">
          <Button onClick={goBack} variant="outline" size="sm" className="rounded-none font-mono text-xs uppercase border-border hover:bg-primary/5 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            REGRESAR
          </Button>

          <Button
            onClick={goToProducts}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-mono text-xs uppercase tracking-widest px-8 shadow-[0_0_20px_rgba(0,212,146,0.1)]"
          >
            CONTINUAR: PRODUCTOS
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function OnboardingCategories() {
  return (
    <Suspense fallback={<OnboardingCategoriesLoading />}>
      <OnboardingCategoriesContent />
    </Suspense>
  );
}
