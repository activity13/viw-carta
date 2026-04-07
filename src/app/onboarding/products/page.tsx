"use client";

import React, { useState, useEffect, Suspense } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Utensils,
  Plus,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
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

// Loading component for Suspense fallback
function OnboardingProductsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md bg-card border-border rounded-none">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-mono uppercase tracking-widest text-xs">Sincronizando productos...</p>
        </CardContent>
      </Card>
    </div>
  );
}

//Componente princiapl encargado de todo el contenido del onboarding de productos
function OnboardingProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantId = searchParams.get("restaurantId");

  const [isLoading, setIsLoading] = useState(true);
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      toast.error("No se pudieron cargar los datos", {
        description: "Verifica tu conexión e inténtalo nuevamente",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
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
      toast.error("Nombre requerido", {
        description: "El producto debe tener un nombre",
        duration: 3000,
      });
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
      console.error("Error al actualizar producto:", error);
      toast.error("Error al actualizar");
    }
  };

  const addMeal = async () => {
    if (!newMeal.name.trim()) {
      toast.error("Nombre requerido");
      return;
    }

    if (!newMeal.categoryId) {
      toast.error("Categoría requerida");
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

      toast.success("Producto agregado");
    } catch (error) {
      console.error("Error al agregar producto:", error);
      toast.error("Error al agregar");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteMeal = async (mealId: string) => {
    const meal = meals.find((m) => m._id === mealId);
    if (!meal) return;

    setMealToDelete({ id: mealId, name: meal.name });
    setShowDeleteDialog(true);
  };

  const confirmDeleteMeal = async () => {
    if (!mealToDelete) return;

    try {
      setIsDeleting(true);
      await axios.delete(`/api/master/delete?id=${mealToDelete.id}`);
      setMeals(meals.filter((meal) => meal._id !== mealToDelete.id));
      toast.success("Producto eliminado");
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      toast.error("Error al eliminar");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setMealToDelete(null);
    }
  };

  const finishOnboarding = () => {
    const customProductsCount = meals.filter((m) => !m.isTemplate).length;
    toast.success("Configuración completada");
    setTimeout(() => {
      router.push("/backoffice");
    }, 1000);
  };

  const goBack = () => {
    router.push(`/onboarding/categories?restaurantId=${restaurantId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card border-border rounded-none">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground font-mono uppercase tracking-widest text-xs">Cargando productos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-destructive/20 bg-card rounded-none">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-mono uppercase tracking-widest text-xs mb-4">{error}</p>
            <Button variant="outline" onClick={goBack} className="border-primary text-primary hover:bg-primary/10 rounded-none font-mono text-xs uppercase">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 font-roboto tracking-widest">
            2/2: CATÁLOGO DE PRODUCTOS
          </h1>
          <p className="text-muted-foreground font-mono uppercase text-xs tracking-wider">
            Personaliza los items precargados o inserta nuevos registros.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-border rounded-none h-1 mb-8 overflow-hidden">
          <div
            className="bg-primary h-1 transition-all duration-500"
            style={{ width: "100%" }}
          ></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products by Category */}
          <div className="lg:col-span-2 space-y-4">
            {categories.map((category) => {
              const categoryMeals = getMealsByCategory(category._id);
              return (
                <Card key={category._id} className="bg-card border-border rounded-none shadow-none">
                  <CardHeader className="border-b border-border py-3">
                    <CardTitle className="flex items-center gap-2 text-xs font-roboto uppercase tracking-widest text-primary/80">
                      {category.name}
                      <span className="text-[10px] font-mono text-muted-foreground">[{categoryMeals.length}]</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4">
                    {categoryMeals.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground font-mono text-[10px] uppercase tracking-widest border border-dashed border-border">
                        Categoría sin registros.
                      </div>
                    ) : (
                      categoryMeals.map((meal) => (
                        <div
                          key={meal._id}
                          className="border border-border p-3 bg-background rounded-none hover:border-primary/30 transition-colors"
                        >
                          {editingId === meal._id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-mono text-muted-foreground uppercase">Nombre</Label>
                                  <Input
                                    value={editingMeal.name || ""}
                                    onChange={(e) =>
                                      setEditingMeal({
                                        ...editingMeal,
                                        name: e.target.value,
                                      })
                                    }
                                    className="bg-card border-border h-8 font-mono text-sm rounded-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] font-mono text-muted-foreground uppercase">Precio (S/.)</Label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-3 w-3 text-primary" />
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
                                      className="pl-7 bg-card border-border h-8 font-mono text-sm rounded-none"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-mono text-muted-foreground uppercase">Descripción</Label>
                                <Textarea
                                  value={editingMeal.description || ""}
                                  onChange={(e) =>
                                    setEditingMeal({
                                      ...editingMeal,
                                      description: e.target.value,
                                    })
                                  }
                                  className="bg-card border-border font-mono text-sm rounded-none min-h-[60px]"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(meal._id)}
                                  className="bg-primary text-primary-foreground h-8 font-mono text-[10px] uppercase rounded-none"
                                >
                                  Actualizar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEdit}
                                  className="h-8 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground rounded-none"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-mono text-sm uppercase truncate">{meal.name}</h4>
                                  {meal.isTemplate && (
                                    <span className="text-[8px] font-mono border border-primary/20 text-primary/60 px-1 uppercase">Template</span>
                                  )}
                                </div>
                                {meal.description && (
                                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5 line-clamp-2">
                                    {meal.description}
                                  </p>
                                )}
                                <div className="text-xs font-mono text-primary mt-2">
                                  S/. {meal.basePrice.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(meal)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-none"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteMeal(meal._id)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-none"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
          <div className="space-y-4">
            <Card className="bg-card border-border rounded-none shadow-none">
              <CardHeader className="border-b border-border py-3">
                <CardTitle className="flex items-center gap-2 text-xs font-roboto uppercase tracking-widest">
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Entrada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Categoría</Label>
                  <Select
                    value={newMeal.categoryId}
                    onValueChange={(value) =>
                      setNewMeal({ ...newMeal, categoryId: value })
                    }
                  >
                    <SelectTrigger className="bg-background border-border rounded-none h-9 font-mono text-xs">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-none">
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id} className="font-mono text-xs uppercase">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Nombre</Label>
                  <Input
                    value={newMeal.name}
                    onChange={(e) =>
                      setNewMeal({ ...newMeal, name: e.target.value })
                    }
                    placeholder="Ej: PIZZA MARGHERITA"
                    className="bg-background border-border focus:border-primary/60 rounded-none h-9 font-mono text-sm uppercase"
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Descripción</Label>
                  <Textarea
                    value={newMeal.description}
                    onChange={(e) =>
                      setNewMeal({ ...newMeal, description: e.target.value })
                    }
                    placeholder="Detalles del producto..."
                    className="bg-background border-border focus:border-primary/60 rounded-none font-mono text-xs resize-none min-h-[80px]"
                    disabled={isCreating}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Precio (S/.)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-3.5 w-3.5 text-primary" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newMeal.basePrice}
                      onChange={(e) =>
                        setNewMeal({ ...newMeal, basePrice: e.target.value })
                      }
                      placeholder="0.00"
                      className="pl-9 bg-background border-border focus:border-primary/60 rounded-none h-9 font-mono text-sm"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <Button
                  onClick={addMeal}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-mono text-xs uppercase tracking-widest"
                  disabled={
                    isCreating || !newMeal.name.trim() || !newMeal.categoryId
                  }
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      INSERTANDO...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-2" />
                      AGREGAR PRODUCTO
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Finish Section */}
            <Card className="bg-primary/5 border-primary/20 rounded-none shadow-none">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-[10px] font-roboto uppercase tracking-widest text-primary">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terminal Lista
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={finishOnboarding}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-mono text-xs uppercase tracking-widest py-6"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  FINALIZAR SETUP
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 border-t border-border pt-6">
          <Button onClick={goBack} variant="outline" size="sm" className="rounded-none font-mono text-xs uppercase border-border hover:bg-primary/5 hover:text-primary hover:border-primary/50">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            CATEGORÍAS
          </Button>
        </div>
      </div>

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-border rounded-none sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-roboto uppercase tracking-widest text-sm">
              <AlertTriangle className="w-4 h-4" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="pt-4 font-mono text-xs text-muted-foreground uppercase">
              ¿Eliminar <span className="text-foreground underline decoration-primary/40">{mealToDelete?.name}</span>?
              <br />
              <span className="mt-2 block">Acción irreversible en el registro maestro.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setMealToDelete(null);
              }}
              disabled={isDeleting}
              className="flex-1 rounded-none font-mono text-[10px] uppercase border-border"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMeal}
              disabled={isDeleting}
              className="flex-1 rounded-none font-mono text-[10px] uppercase"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Página principal que envuelve el contenido con Suspense
export default function OnboardingProducts() {
  return (
    <Suspense fallback={<OnboardingProductsLoading />}>
      <OnboardingProductsContent />
    </Suspense>
  );
}
