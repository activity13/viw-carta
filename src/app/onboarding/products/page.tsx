"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Utensils,
  Plus,
  Edit,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  _id: string;
  name: string;
  order: number;
}

interface Meal {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  isTemplate: boolean;
}

interface NewMeal {
  name: string;
  description: string;
  basePrice: string;
  categoryId: string;
}

export default function OnboardingProducts() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantId = searchParams.get("restaurantId");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<Partial<Meal>>({});
  const [newMeal, setNewMeal] = useState<NewMeal>({
    name: "",
    description: "",
    basePrice: "",
    categoryId: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId) {
      loadData();
    } else {
      setError("ID de restaurante no proporcionado");
      setIsLoading(false);
    }
  }, [restaurantId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesRes, mealsRes] = await Promise.all([
        axios.get(`/api/categories?restaurantId=${restaurantId}`),
        axios.get(`/api/master/get?restaurantId=${restaurantId}`),
      ]);

      setCategories(
        categoriesRes.data.sort((a: Category, b: Category) => a.order - b.order)
      );
      setMeals(mealsRes.data);

      // Pre-seleccionar primera categoría para nuevo producto
      if (categoriesRes.data.length > 0) {
        setNewMeal((prev) => ({
          ...prev,
          categoryId: categoriesRes.data[0]._id,
        }));
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setError("Error al cargar los datos");
      toast.error("No se pudieron cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return (
      categories.find((cat) => cat._id === categoryId)?.name || "Sin categoría"
    );
  };

  const getMealsByCategory = (categoryId: string) => {
    return meals.filter((meal) => meal.categoryId === categoryId);
  };

  const startEdit = (meal: Meal) => {
    setEditingId(meal._id);
    setEditingMeal({
      name: meal.name,
      description: meal.description,
      basePrice: meal.basePrice,
      categoryId: meal.categoryId,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingMeal({});
  };

  const saveEdit = async (mealId: string) => {
    if (!editingMeal.name?.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    try {
      await axios.post("/api/master/update", {
        params: { id: mealId },
        formData: {
          name: editingMeal.name?.trim(),
          description: editingMeal.description?.trim() || "",
          basePrice: Number(editingMeal.basePrice) || 0,
          categoryId: editingMeal.categoryId,
        },
      });

      setMeals(
        meals.map((meal) =>
          meal._id === mealId
            ? {
                ...meal,
                name: editingMeal.name?.trim() || "",
                description: editingMeal.description?.trim() || "",
                basePrice: Number(editingMeal.basePrice) || 0,
                categoryId: editingMeal.categoryId || meal.categoryId,
              }
            : meal
        )
      );

      cancelEdit();
      toast.success("Producto actualizado");
    } catch (error) {
      toast.error("Error al actualizar producto");
    }
  };

  const addMeal = async () => {
    if (!newMeal.name.trim()) {
      toast.error("Ingresa un nombre para el producto");
      return;
    }

    if (!newMeal.categoryId) {
      toast.error("Selecciona una categoría");
      return;
    }

    try {
      setIsCreating(true);
      const response = await axios.post("/api/master/create", {
        restaurantId,
        formData: {
          name: newMeal.name.trim(),
          description: newMeal.description.trim(),
          basePrice: Number(newMeal.basePrice) || 0,
          categoryId: newMeal.categoryId,
        },
      });

      // Asegurar que la respuesta incluye todos los datos necesarios
      const newMealData = {
        _id: response.data._id || response.data.id,
        name: newMeal.name.trim(),
        description: newMeal.description.trim(),
        basePrice: Number(newMeal.basePrice) || 0,
        categoryId: newMeal.categoryId,
        isTemplate: false,
        ...response.data,
      };

      setMeals((prevMeals) => [...prevMeals, newMealData]);

      // Limpiar formulario
      setNewMeal({
        name: "",
        description: "",
        basePrice: "",
        categoryId: newMeal.categoryId, // Mantener categoría seleccionada
      });

      toast.success("Producto agregado exitosamente");
    } catch (error) {
      console.error("Error al agregar producto:", error);
      toast.error("Error al agregar producto");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      await axios.delete(`/api/master/delete?id=${mealId}`);
      setMeals(meals.filter((meal) => meal._id !== mealId));
      toast.success("Producto eliminado");
    } catch (error) {
      toast.error("Error al eliminar producto");
    }
  };

  const finishOnboarding = () => {
    toast.success("¡Onboarding completado! Redirigiendo al panel...");
    setTimeout(() => {
      router.push("/backoffice/login");
    }, 1500);
  };

  const goBack = () => {
    router.push(`/onboarding/categories?restaurantId=${restaurantId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-muted-foreground">Cargando productos...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-700/90 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Paso 2/2: Agrega tus Productos
          </h1>
          <p className="text-gray-600">
            Personaliza los productos ejemplo o agrega tus propios platos
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-purple-600 h-2 rounded-full"
            style={{ width: "100%" }}
          ></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products by Category */}
          <div className="lg:col-span-2 space-y-6">
            {categories.map((category) => {
              const categoryMeals = getMealsByCategory(category._id);
              return (
                <Card key={category._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {category.name}
                      <Badge variant="secondary">
                        {categoryMeals.length} productos
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categoryMeals.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No hay productos en esta categoría aún
                      </div>
                    ) : (
                      categoryMeals.map((meal) => (
                        <div
                          key={meal._id}
                          className="border rounded-lg p-4 bg-white/50"
                        >
                          {editingId === meal._id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Nombre</Label>
                                  <Input
                                    value={editingMeal.name || ""}
                                    onChange={(e) =>
                                      setEditingMeal({
                                        ...editingMeal,
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder="Nombre del producto"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    Precio (S./)
                                  </Label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editingMeal.basePrice || ""}
                                      onChange={(e) =>
                                        setEditingMeal({
                                          ...editingMeal,
                                          basePrice: Number(e.target.value),
                                        })
                                      }
                                      placeholder="0.00"
                                      className="pl-9"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Descripción</Label>
                                <Textarea
                                  value={editingMeal.description || ""}
                                  onChange={(e) =>
                                    setEditingMeal({
                                      ...editingMeal,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Describe tu producto..."
                                  rows={2}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(meal._id)}
                                >
                                  <Save className="w-4 h-4 mr-1" />
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-medium">{meal.name}</h4>
                                  {meal.isTemplate && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Template
                                    </Badge>
                                  )}
                                </div>
                                {meal.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {meal.description}
                                  </p>
                                )}
                                <p className="text-sm font-semibold text-purple-600 mt-2">
                                  S/. {meal.basePrice.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(meal)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteMeal(meal._id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add Product Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="w-5 h-5" />
                  Nuevo Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={newMeal.categoryId}
                    onValueChange={(value) =>
                      setNewMeal({ ...newMeal, categoryId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nombre del producto *</Label>
                  <Input
                    value={newMeal.name}
                    onChange={(e) =>
                      setNewMeal({ ...newMeal, name: e.target.value })
                    }
                    placeholder="Ej: Pizza Margherita"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={newMeal.description}
                    onChange={(e) =>
                      setNewMeal({ ...newMeal, description: e.target.value })
                    }
                    placeholder="Describe tu producto..."
                    rows={3}
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm resize-none"
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Precio (S/.) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMeal.basePrice}
                      onChange={(e) =>
                        setNewMeal({ ...newMeal, basePrice: e.target.value })
                      }
                      placeholder="0.00"
                      className="pl-9 bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <Button
                  onClick={addMeal}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={
                    isCreating || !newMeal.name.trim() || !newMeal.categoryId
                  }
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Finish Section */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  ¡Casi listo!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Ya puedes empezar a usar tu menú digital
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={finishOnboarding}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finalizar Setup
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12">
          <Button onClick={goBack} variant="outline" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Categorías
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              ¡Has agregado {meals.filter((m) => !m.isTemplate).length}{" "}
              productos personalizados!
            </p>
            <Button
              onClick={finishOnboarding}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Completar Onboarding
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
