"use client";

import React, { useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Globe,
  Languages,
  Save,
  X,
  Edit2,
  Sparkles,
  Utensils,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// -------------------------------
// Tipos
// -------------------------------
interface Category {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
}

interface Meal {
  id: string;
  categoryId: string | null;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  ingredients?: string[];
  ingredients_en?: string[];
  tags?: string[];
}

interface MenuResponse {
  restaurant: { id: string; name: string };
  categories: Category[];
  meals: Meal[];
}

// -------------------------------
// Componente principal
// -------------------------------
export default function TranslationPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const restaurantId = session?.user?.restaurantId;

  const [menuData, setMenuData] = useState<MenuResponse | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<string>("categories");

  // -------------------------------
  // Query: Obtener menú
  // -------------------------------
  const { isLoading, isError } = useQuery({
    queryKey: ["menu", restaurantId],

    queryFn: async () => {
      const res = await axios.get(
        `/api/internationalization/get/${restaurantId}`
      );
      setMenuData(res.data);
      return res.data as MenuResponse;
    },
    enabled: !!restaurantId,
  });

  // Refrescar menú desde API
  const refreshMenu = async () => {
    const res = await axios.get(
      `/api/internationalization/get/${restaurantId}`
    );
    setMenuData(res.data);
    await queryClient.invalidateQueries({ queryKey: ["menu", restaurantId] });
  };

  // -------------------------------
  // Mutación: Traducción automática
  // -------------------------------
  const translateMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `/api/internationalization/translate-menu/${restaurantId}`,
        {
          to: "en",
          from: "es",
          save: true,
        }
      );
      return res.data;
    },
    onMutate: () => toast.loading("Traduciendo automáticamente..."),
    onSuccess: async () => {
      toast.dismiss();
      toast.success("Traducción completada con éxito");
      await refreshMenu();
      await queryClient.invalidateQueries({ queryKey: ["menu", restaurantId] });
    },
    onError: (err) => {
      toast.dismiss();
      toast.error("Error al traducir automáticamente");
      console.error(err);
    },
  });

  // -------------------------------
  // Guardar una categoría
  // -------------------------------
  const saveSingleCategory = async (category: Category) => {
    try {
      toast.loading("Guardando categoría...");
      const payload = {
        categories: [
          {
            id: category.id,
            name_en: category.name_en ?? "",
            description_en: category.description_en ?? "",
          },
        ],
      };
      await axios.post(
        `/api/internationalization/update-menu/${restaurantId}`,
        payload
      );
      toast.dismiss();
      toast.success("Categoría actualizada");
      setEditingCategoryId(null);
      await refreshMenu();
    } catch (err) {
      toast.dismiss();
      toast.error("Error al guardar la categoría");
      console.error(err);
    }
  };

  // -------------------------------
  // Guardar un plato
  // -------------------------------
  const saveSingleMeal = async (meal: Meal) => {
    try {
      toast.loading("Guardando plato...");
      const payload = {
        meals: [
          {
            id: meal.id,
            name_en: meal.name_en ?? "",
            description_en: meal.description_en ?? "",
            ingredients_en: meal.ingredients_en ?? [],
          },
        ],
      };
      await axios.post(
        `/api/internationalization/update-menu/${restaurantId}`,
        payload
      );
      toast.dismiss();
      toast.success("Plato actualizado");
      setEditingMealId(null);
      await refreshMenu();
    } catch (err) {
      toast.dismiss();
      toast.error("Error al guardar el plato");
      console.error(err);
    }
  };

  // -------------------------------
  // Handlers para categorías
  // -------------------------------
  const handleCategoryFieldChange = (
    categoryId: string,
    field: keyof Category,
    value: string
  ) => {
    setMenuData((prev) => {
      if (!prev) return prev;
      const categories = prev.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      );
      return { ...prev, categories };
    });
  };

  // -------------------------------
  // Handlers para platos
  // -------------------------------
  const handleMealFieldChange = (
    mealId: string,
    field: keyof Meal,
    value: string
  ) => {
    setMenuData((prev) => {
      if (!prev) return prev;
      const meals = prev.meals.map((meal) =>
        meal.id === mealId ? { ...meal, [field]: value } : meal
      );
      return { ...prev, meals };
    });
  };

  const handleMealIngredientsChange = (mealId: string, raw: string) => {
    const parsed = raw
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    setMenuData((prev) => {
      if (!prev) return prev;
      const meals = prev.meals.map((meal) =>
        meal.id === mealId ? { ...meal, ingredients_en: parsed } : meal
      );
      return { ...prev, meals };
    });
  };

  // Verificar si hay alguna edición activa
  const isAnyEditActive = editingMealId !== null || editingCategoryId !== null;

  // -------------------------------
  // Render
  // -------------------------------
  if (isLoading || !menuData) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-7xl space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3 rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  } else if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-destructive">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h3 className="text-lg font-semibold">Error al cargar el menú</h3>
        <p className="text-muted-foreground">
          Por favor, intenta recargar la página.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            Traducción del Menú
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las traducciones de tu carta para llegar a más clientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Languages className="w-3.5 h-3.5 mr-2" />
            {menuData.categories.length} Categorías
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Utensils className="w-3.5 h-3.5 mr-2" />
            {menuData.meals.length} Platos
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Platos
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA DE CATEGORÍAS */}
        <TabsContent value="categories" className="space-y-6">
          {menuData.categories.map((cat) => {
            const isEditingThis = editingCategoryId === cat.id;
            return (
              <Card
                key={cat.id}
                className={`transition-all duration-200 ${
                  isEditingThis
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
              >
                <CardHeader className="pb-4 border-b bg-muted/30">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                      {cat.name}
                    </CardTitle>
                    {!isEditingThis ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCategoryId(cat.id)}
                        disabled={isAnyEditActive}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            setEditingCategoryId(null);
                            await refreshMenu();
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveSingleCategory(cat)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Español */}
                    <div className="space-y-4 p-4 rounded-lg bg-muted/20 border border-dashed">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          ES
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">
                          Original
                        </span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase">
                          Nombre
                        </label>
                        <p className="font-medium text-foreground">
                          {cat.name}
                        </p>
                      </div>
                      {cat.description && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase">
                            Descripción
                          </label>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {cat.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Inglés */}
                    <div
                      className={`space-y-4 p-4 rounded-lg border transition-colors ${
                        isEditingThis
                          ? "bg-background border-primary/20"
                          : "bg-muted/10 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                          EN
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">
                          Traducción
                        </span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase">
                          Nombre (EN)
                        </label>
                        <Input
                          value={cat.name_en || ""}
                          onChange={(e) =>
                            handleCategoryFieldChange(
                              cat.id,
                              "name_en",
                              e.target.value
                            )
                          }
                          placeholder="Category Name"
                          disabled={!isEditingThis}
                          className={
                            !isEditingThis
                              ? "border-transparent bg-transparent px-0 h-auto font-medium shadow-none"
                              : ""
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase">
                          Descripción (EN)
                        </label>
                        <Textarea
                          value={cat.description_en || ""}
                          onChange={(e) =>
                            handleCategoryFieldChange(
                              cat.id,
                              "description_en",
                              e.target.value
                            )
                          }
                          placeholder="Category Description"
                          disabled={!isEditingThis}
                          rows={3}
                          className={`resize-none ${
                            !isEditingThis
                              ? "border-transparent bg-transparent px-0 min-h-0 shadow-none text-muted-foreground"
                              : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {menuData.categories.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <LayoutGrid className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                No hay categorías disponibles
              </h3>
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA DE PLATOS */}
        <TabsContent value="meals" className="space-y-8">
          {menuData.categories.map((cat) => {
            const mealsInCategory = menuData.meals.filter(
              (meal) => meal.categoryId === cat.id
            );

            if (mealsInCategory.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <LayoutGrid className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">{cat.name}</h2>
                  <Badge variant="secondary" className="ml-2">
                    {mealsInCategory.length}
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {mealsInCategory.map((meal) => {
                    const isEditingThis = editingMealId === meal.id;
                    return (
                      <Card
                        key={meal.id}
                        className={`transition-all duration-200 ${
                          isEditingThis
                            ? "ring-2 ring-primary shadow-lg"
                            : "hover:shadow-md"
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Español */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {meal.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {meal.description || "Sin descripción"}
                                  </p>
                                </div>
                                {!isEditingThis && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingMealId(meal.id)}
                                    disabled={isAnyEditActive}
                                    className="shrink-0"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

                              {meal.ingredients &&
                                meal.ingredients.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {meal.ingredients.map((ing, i) => (
                                      <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-xs font-normal"
                                      >
                                        {ing}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                            </div>

                            {/* Inglés */}
                            <div
                              className={`space-y-4 ${
                                isEditingThis
                                  ? "pl-0 md:pl-8 md:border-l"
                                  : "pl-0 md:pl-8 md:border-l border-dashed"
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Nombre (EN)
                                  </label>
                                  <Input
                                    value={meal.name_en || ""}
                                    onChange={(e) =>
                                      handleMealFieldChange(
                                        meal.id,
                                        "name_en",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Meal Name"
                                    disabled={!isEditingThis}
                                    className={
                                      !isEditingThis
                                        ? "border-transparent bg-transparent px-0 h-auto font-medium shadow-none"
                                        : ""
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-muted-foreground uppercase">
                                    Descripción (EN)
                                  </label>
                                  <Textarea
                                    value={meal.description_en || ""}
                                    onChange={(e) =>
                                      handleMealFieldChange(
                                        meal.id,
                                        "description_en",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Description"
                                    disabled={!isEditingThis}
                                    rows={2}
                                    className={`resize-none ${
                                      !isEditingThis
                                        ? "border-transparent bg-transparent px-0 min-h-0 shadow-none text-muted-foreground"
                                        : ""
                                    }`}
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-muted-foreground uppercase">
                                    Ingredientes (EN)
                                  </label>
                                  <Textarea
                                    value={(meal.ingredients_en || []).join(
                                      ", "
                                    )}
                                    onChange={(e) =>
                                      handleMealIngredientsChange(
                                        meal.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Ingredients (comma separated)"
                                    disabled={!isEditingThis}
                                    rows={2}
                                    className={`resize-none ${
                                      !isEditingThis
                                        ? "border-transparent bg-transparent px-0 min-h-0 shadow-none text-muted-foreground"
                                        : ""
                                    }`}
                                  />
                                </div>
                              </div>

                              {isEditingThis && (
                                <div className="flex justify-end gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      setEditingMealId(null);
                                      await refreshMenu();
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => saveSingleMeal(meal)}
                                  >
                                    Guardar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {menuData.meals.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No hay platos disponibles</h3>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Barra flotante de acciones */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="bg-background/80 backdrop-blur-lg border shadow-lg rounded-full p-2 flex items-center justify-between gap-4 pr-4">
          <Button
            onClick={() => translateMutation.mutate()}
            disabled={
              !restaurantId || translateMutation.isPending || isAnyEditActive
            }
            className="rounded-full shadow-sm"
            size="lg"
          >
            {translateMutation.isPending ? (
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {translateMutation.isPending
              ? "Traduciendo..."
              : "Traducir Todo Automáticamente"}
          </Button>

          {isAnyEditActive && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={async () => {
                setEditingMealId(null);
                setEditingCategoryId(null);
              }}
              title="Cancelar edición"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
