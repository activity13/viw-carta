"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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

export default function OnboardingCategories() {
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
      const response = await axios.get(
        `/api/categories?restaurantId=${restaurantId}`
      );
      setCategories(response.data);
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
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar el orden
    const updatedCategories = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setCategories(updatedCategories);
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
      toast.error("Error al eliminar categoría");
    }
  };

  const saveOrder = async () => {
    try {
      setIsSaving(true);

      // Enviar nuevo orden al servidor
      await axios.put("/api/categories/reorder", {
        restaurantId,
        categories: categories.map((cat) => ({
          id: cat._id,
          order: cat.order,
        })),
      });

      toast.success("Orden guardado exitosamente");
    } catch (error) {
      toast.error("Error al guardar el orden");
    } finally {
      setIsSaving(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Cargando categorías...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="p-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={goBack} className="mt-4">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-indigo-700/10 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Paso 1/2: Organiza tus Categorías
          </h1>
          <p className="text-card-foreground/80">
            Arrastra para reordenar, edita los nombres o agrega nuevas
            categorías
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: "50%" }}
          ></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Tus Categorías
                </CardTitle>
                <CardDescription>
                  Arrastra y suelta para cambiar el orden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="categories">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
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
                                className={`flex items-center gap-3 p-4 bg-green-950 rounded-lg border transition-shadow ${
                                  snapshot.isDragging
                                    ? "shadow-lg"
                                    : "shadow-sm"
                                }`}
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>

                                <Badge
                                  variant="outline"
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                >
                                  {index + 1}
                                </Badge>

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
                                      className="flex-1"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => saveEdit(category._id)}
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEdit}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="font-semibold text-lg">
                                          {category.name}
                                        </span>
                                        <div className="flex gap-3 mt-1">
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            <span className="font-mono">
                                              {category.code}
                                            </span>
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            <span className="font-mono">
                                              {category.slug}
                                            </span>
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEdit(category)}
                                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            deleteCategory(category._id)
                                          }
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
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
                  <div className="text-center py-8 text-gray-500">
                    No hay categorías aún. ¡Agrega tu primera categoría!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Category */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="w-5 h-5" />
                  Nueva Categoría
                </CardTitle>
                <CardDescription>
                  Los campos código y slug se generan automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Nombre de la categoría *</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Entradas"
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryCode">Código *</Label>
                    <Input
                      id="categoryCode"
                      value={newCategoryCode}
                      onChange={(e) => setNewCategoryCode(e.target.value)}
                      placeholder="ENT01"
                      className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorySlug">Slug (URL) *</Label>
                    <Input
                      id="categorySlug"
                      value={newCategorySlug}
                      onChange={(e) => setNewCategorySlug(e.target.value)}
                      placeholder="entradas"
                      className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">
                    Descripción (opcional)
                  </Label>
                  <Input
                    id="categoryDescription"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Descripción breve de la categoría"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                  />
                </div>

                <Button
                  onClick={addCategory}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={
                    isCreating ||
                    !newCategoryName.trim() ||
                    !newCategoryCode.trim() ||
                    !newCategorySlug.trim()
                  }
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Categoría
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={saveOrder}
                  disabled={isSaving}
                  className="w-full"
                  variant="outline"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Orden
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12">
          <Button onClick={goBack} variant="outline" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>

          <Button
            onClick={goToProducts}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Siguiente: Productos
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
