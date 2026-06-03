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
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// -------------------------------
// Tipos
// -------------------------------
interface Section {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
}

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

interface SystemMessage {
  id: string;
  placement: string;
  type: "info" | "warning" | "alert" | "promotion";
  content: string;
  content_en?: string;
  isActive: boolean;
}

interface VariantOption {
  name: string;
  name_en?: string;
  price: number;
}

interface Variant {
  id: string;
  title: string;
  title_en?: string;
  options: VariantOption[];
}

interface MenuResponse {
  restaurant: { id: string; name: string };
  sections: Section[];
  categories: Category[];
  meals: Meal[];
  messages: SystemMessage[];
  variants: Variant[];
}

// -------------------------------
// Componente principal
// -------------------------------
export default function TranslationClient() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const restaurantId = session?.user?.restaurantId;

  const [menuData, setMenuData] = useState<MenuResponse | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [savingMealId, setSavingMealId] = useState<string | null>(null);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("sections");

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
  // Guardar una sección
  // -------------------------------
  const saveSingleSection = async (section: Section) => {
    try {
      setSavingSectionId(section.id);
      
      const updatedSections = menuData!.sections.map((s) => 
        s.id === section.id ? { ...s, name_en: section.name_en } : s
      );

      const formData = new FormData();
      formData.append("menuSections", JSON.stringify(updatedSections));

      await axios.put(`/api/settings/update/${restaurantId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.success("Sección actualizada");
      setEditingSectionId(null);
      await refreshMenu();
    } catch (err) {
      toast.error("Error al guardar la sección");
      console.error(err);
    } finally {
      setSavingSectionId(null);
    }
  };

  const handleSectionFieldChange = (id: string, field: keyof Section, value: string) => {
    setMenuData((prev) => {
      if (!prev) return prev;
      const updated = prev.sections.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      );
      return { ...prev, sections: updated };
    });
  };

  // -------------------------------
  // Guardar una categoría
  // -------------------------------
  const saveSingleCategory = async (category: Category) => {
    try {
      setSavingCategoryId(category.id);
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
      toast.success("Categoría actualizada");
      setEditingCategoryId(null);
      await refreshMenu();
    } catch (err) {
      toast.error("Error al guardar la categoría");
      console.error(err);
    } finally {
      setSavingCategoryId(null);
    }
  };

  // -------------------------------
  // Guardar un plato
  // -------------------------------
  const saveSingleMeal = async (meal: Meal) => {
    try {
      setSavingMealId(meal.id);
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
      toast.success("Plato actualizado");
      setEditingMealId(null);
      await refreshMenu();
    } catch (err) {
      toast.error("Error al guardar el plato");
      console.error(err);
    } finally {
      setSavingMealId(null);
    }
  };

  // -------------------------------
  // Guardar un mensaje
  // -------------------------------
  const saveSingleMessage = async (message: SystemMessage) => {
    try {
      setSavingMessageId(message.id);
      const payload = {
        messages: [
          {
            id: message.id,
            content_en: message.content_en ?? "",
          },
        ],
      };
      await axios.post(
        `/api/internationalization/update-menu/${restaurantId}`,
        payload
      );
      toast.success("Mensaje actualizado");
      setEditingMessageId(null);
      await refreshMenu();
    } catch (err) {
      toast.error("Error al guardar el mensaje");
      console.error(err);
    } finally {
      setSavingMessageId(null);
    }
  };

  // -------------------------------
  // Guardar una variante
  // -------------------------------
  const saveSingleVariant = async (variant: Variant) => {
    try {
      setSavingVariantId(variant.id);
      const payload = {
        variants: [
          {
            id: variant.id,
            title_en: variant.title_en ?? "",
            options: variant.options.map(opt => ({
              ...opt,
              name_en: opt.name_en ?? "",
            })),
          },
        ],
      };
      await axios.post(
        `/api/internationalization/update-menu/${restaurantId}`,
        payload
      );
      toast.success("Variante actualizada");
      setEditingVariantId(null);
      await refreshMenu();
    } catch (err) {
      toast.error("Error al guardar la variante");
      console.error(err);
    } finally {
      setSavingVariantId(null);
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

  // -------------------------------
  // Handlers para mensajes
  // -------------------------------
  const handleMessageFieldChange = (
    messageId: string,
    field: keyof SystemMessage,
    value: string
  ) => {
    setMenuData((prev) => {
      if (!prev) return prev;
      const messages = prev.messages.map((msg) =>
        msg.id === messageId ? { ...msg, [field]: value } : msg
      );
      return { ...prev, messages };
    });
  };

  const handleVariantFieldChange = (
    variantId: string,
    field: "title_en",
    value: string
  ) => {
    setMenuData((prev) => {
      if (!prev) return prev;
      const variants = prev.variants.map((v) =>
        v.id === variantId ? { ...v, [field]: value } : v
      );
      return { ...prev, variants };
    });
  };

  const handleVariantOptionFieldChange = (
    variantId: string,
    optionIndex: number,
    value: string
  ) => {
    setMenuData((prev) => {
      if (!prev) return prev;
      const variants = prev.variants.map((v) => {
        if (v.id !== variantId) return v;
        const newOptions = [...v.options];
        newOptions[optionIndex] = { ...newOptions[optionIndex], name_en: value };
        return { ...v, options: newOptions };
      });
      return { ...prev, variants };
    });
  };

  // Verificar si hay alguna edición activa
  const isAnyEditActive =
    editingSectionId !== null ||
    editingMealId !== null ||
    editingCategoryId !== null ||
    editingMessageId !== null ||
    editingVariantId !== null;

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
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <Badge variant="outline" className="px-3 py-1 shrink-0">
            <Languages className="w-3.5 h-3.5 mr-2" />
            {menuData.categories.length} Categorías
          </Badge>
          <Badge variant="outline" className="px-3 py-1 shrink-0">
            <Utensils className="w-3.5 h-3.5 mr-2" />
            {menuData.meals.length} Platos
          </Badge>
          <Badge variant="outline" className="px-3 py-1 shrink-0">
            <MessageSquare className="w-3.5 h-3.5 mr-2" />
            {menuData.messages?.length || 0} Mensajes
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap w-full max-w-lg mb-8 h-auto">
          <TabsTrigger value="sections" className="flex-1 flex items-center justify-center gap-2 py-2">
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Secciones</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 flex items-center justify-center gap-2 py-2">
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex-1 flex items-center justify-center gap-2 py-2">
            <Utensils className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Platos</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex-1 flex items-center justify-center gap-2 py-2">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Mensajes</span>
          </TabsTrigger>
          <TabsTrigger value="variants" className="flex-1 flex items-center justify-center gap-2 py-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Variantes</span>
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA DE SECCIONES */}
        <TabsContent value="sections" className="space-y-6">
          {menuData.sections.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">No hay secciones registradas.</p>
            </div>
          ) : (
            menuData.sections.map((sec) => {
              const isEditingThis = editingSectionId === sec.id;
              return (
                <Card
                  key={sec.id}
                  className={`transition-all duration-200 ${
                    isEditingThis ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                  }`}
                >
                  <CardHeader className="pb-4 border-b bg-muted/30">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2 break-words min-w-0">
                        <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{sec.name}</span>
                      </CardTitle>
                      {!isEditingThis ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSectionId(sec.id)}
                          disabled={isAnyEditActive}
                          className="self-end sm:self-auto"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      ) : (
                        <div className="flex gap-2 self-end sm:self-auto">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              setEditingSectionId(null);
                              await refreshMenu();
                            }}
                            disabled={savingSectionId === sec.id}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveSingleSection(sec)}
                            disabled={savingSectionId === sec.id}
                          >
                            {savingSectionId === sec.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            {savingSectionId === sec.id ? "Guardando..." : "Guardar"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Español */}
                      <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-dashed">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs bg-background">
                            ES
                          </Badge>
                          <span className="text-sm font-medium text-muted-foreground">Original</span>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Nombre
                          </label>
                          <div className="text-sm bg-background p-2 px-3 rounded-md border min-h-[40px] flex items-center shadow-sm">
                            {sec.name}
                          </div>
                        </div>
                      </div>

                      {/* Inglés */}
                      <div
                        className={`space-y-4 p-4 rounded-xl border transition-all duration-300 ${
                          isEditingThis
                            ? "bg-background border-primary/40 shadow-sm ring-4 ring-primary/10"
                            : "bg-muted/10 border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                            EN
                          </Badge>
                          <span className="text-sm font-medium text-muted-foreground">Traducción</span>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Nombre (EN)
                          </label>
                          <Input
                            value={sec.name_en || ""}
                            onChange={(e) => handleSectionFieldChange(sec.id, "name_en", e.target.value)}
                            placeholder="Section Name"
                            disabled={!isEditingThis}
                            className={
                              !isEditingThis
                                ? "border-transparent bg-transparent px-0 h-auto font-medium shadow-none opacity-90"
                                : "bg-muted/30 border-input focus-visible:ring-primary shadow-sm"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 break-words min-w-0">
                      <LayoutGrid className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </CardTitle>
                    {!isEditingThis ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCategoryId(cat.id)}
                        disabled={isAnyEditActive}
                        className="self-end sm:self-auto"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2 self-end sm:self-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            setEditingCategoryId(null);
                            await refreshMenu();
                          }}
                          disabled={savingCategoryId === cat.id}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveSingleCategory(cat)}
                          disabled={savingCategoryId === cat.id}
                        >
                          {savingCategoryId === cat.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {savingCategoryId === cat.id
                            ? "Guardando..."
                            : "Guardar"}
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
                      className={`space-y-4 p-4 rounded-xl border transition-all duration-300 ${
                        isEditingThis
                          ? "bg-background border-primary/40 shadow-sm ring-4 ring-primary/10"
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
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                              ? "border-transparent bg-transparent px-0 h-auto font-medium shadow-none opacity-90"
                              : "bg-muted/30 border-input focus-visible:ring-primary shadow-sm"
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                              ? "border-transparent bg-transparent px-0 min-h-0 shadow-none text-muted-foreground opacity-90"
                              : "bg-muted/30 border-input focus-visible:ring-primary shadow-sm min-h-[100px]"
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
                              <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3 w-full">
                                <div className="flex-1 min-w-0 w-full">
                                  <h3 className="font-semibold text-lg break-words">
                                    {meal.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1 break-words">
                                    {meal.description || "Sin descripción"}
                                  </p>
                                </div>
                                {!isEditingThis && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingMealId(meal.id)}
                                    disabled={isAnyEditActive}
                                    className="shrink-0 self-end sm:self-auto"
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
                              className={`space-y-4 p-4 rounded-xl border transition-all duration-300 ${
                                isEditingThis
                                  ? "bg-background border-primary/40 shadow-sm ring-4 ring-primary/10"
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
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
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
                                        ? "border-transparent bg-transparent px-0 h-auto font-medium shadow-none opacity-90"
                                        : "bg-muted/30 border-input focus-visible:ring-primary shadow-sm"
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                                        ? "border-transparent bg-transparent px-0 min-h-0 shadow-none text-muted-foreground opacity-90"
                                        : "bg-muted/30 border-input focus-visible:ring-primary shadow-sm"
                                    }`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                                        ? "border-transparent bg-transparent px-0 min-h-0 shadow-none text-muted-foreground opacity-90"
                                        : "bg-muted/30 border-input focus-visible:ring-primary shadow-sm"
                                    }`}
                                  />
                                </div>
                              </div>

                              {isEditingThis && (
                                <div className="flex justify-end gap-2 pt-4">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      setEditingMealId(null);
                                      await refreshMenu();
                                    }}
                                    disabled={savingMealId === meal.id}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => saveSingleMeal(meal)}
                                    disabled={savingMealId === meal.id}
                                  >
                                    {savingMealId === meal.id ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4 mr-2" />
                                    )}
                                    {savingMealId === meal.id
                                      ? "Guardando..."
                                      : "Guardar"}
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

        {/* PESTAÑA DE MENSAJES */}
        <TabsContent value="messages" className="space-y-6">
          {menuData.messages && menuData.messages.length > 0 ? (
            menuData.messages.map((msg) => {
              const isEditingThis = editingMessageId === msg.id;
              return (
                <Card
                  key={msg.id}
                  className={`transition-all duration-200 ${
                    isEditingThis
                      ? "ring-2 ring-primary shadow-lg"
                      : "hover:shadow-md"
                  }`}
                >
                  <CardHeader className="pb-4 border-b bg-muted/30">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        {msg.placement}
                        <Badge
                          variant={
                            msg.type === "warning"
                              ? "destructive"
                              : msg.type === "alert"
                              ? "destructive"
                              : msg.type === "promotion"
                              ? "default"
                              : "secondary"
                          }
                          className="ml-2 text-xs"
                        >
                          {msg.type}
                        </Badge>
                      </CardTitle>
                      {!isEditingThis ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMessageId(msg.id)}
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
                              setEditingMessageId(null);
                              await refreshMenu();
                            }}
                            disabled={savingMessageId === msg.id}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveSingleMessage(msg)}
                            disabled={savingMessageId === msg.id}
                          >
                            {savingMessageId === msg.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            {savingMessageId === msg.id
                              ? "Guardando..."
                              : "Guardar"}
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
                            Contenido
                          </label>
                          <p className="font-medium text-foreground whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
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
                            Contenido (EN)
                          </label>
                          <Textarea
                            value={msg.content_en || ""}
                            onChange={(e) =>
                              handleMessageFieldChange(
                                msg.id,
                                "content_en",
                                e.target.value
                              )
                            }
                            placeholder="Message content in English"
                            disabled={!isEditingThis}
                            rows={4}
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
            })
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                No hay mensajes configurados
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Los mensajes del sistema se pueden crear desde la configuración
                del restaurante.
              </p>
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA DE VARIANTES */}
        <TabsContent value="variants" className="space-y-6">
          {menuData.variants?.length > 0 ? (
            menuData.variants.map((variant) => {
              const isEditing = editingVariantId === variant.id;
              const isSaving = savingVariantId === variant.id;
              return (
                <Card
                  key={variant.id}
                  className={`overflow-hidden transition-all duration-300 ${
                    isEditing
                      ? "ring-2 ring-primary shadow-lg scale-[1.01]"
                      : "hover:border-primary/50"
                  }`}
                >
                  <CardHeader className="bg-muted/30 py-4 px-6 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Variante: {variant.title}
                    </CardTitle>
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingVariantId(variant.id)}
                        disabled={isAnyEditActive}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingVariantId(null)}
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveSingleVariant(variant)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Guardar
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
                      {/* Original (Español) */}
                      <div className="p-6 space-y-4 bg-muted/10">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                          <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                            ES
                          </span>
                          Texto Original
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Título
                            </span>
                            <p className="mt-1 font-medium">{variant.title}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Opciones
                            </span>
                            <ul className="mt-1 space-y-1">
                              {variant.options.map((opt, i) => (
                                <li key={i} className="text-sm">
                                  - {opt.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Traducción (Inglés) */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
                          <span className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-600">
                            EN
                          </span>
                          Traducción
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Título (EN)
                            </span>
                            {isEditing ? (
                              <Input
                                value={variant.title_en || ""}
                                onChange={(e) =>
                                  handleVariantFieldChange(
                                    variant.id,
                                    "title_en",
                                    e.target.value
                                  )
                                }
                                placeholder="Ej. Size"
                                className="mt-1 bg-blue-50/50 focus-visible:ring-blue-500 border-blue-200"
                              />
                            ) : (
                              <p className="mt-1 font-medium text-blue-900">
                                {variant.title_en || (
                                  <span className="text-muted-foreground italic">
                                    Sin traducción
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Opciones (EN)
                            </span>
                            <div className="mt-1 space-y-2">
                              {variant.options.map((opt, i) => (
                                <div key={i} className="flex flex-col">
                                  <span className="text-xs text-muted-foreground">De: {opt.name}</span>
                                  {isEditing ? (
                                    <Input
                                      value={opt.name_en || ""}
                                      onChange={(e) =>
                                        handleVariantOptionFieldChange(
                                          variant.id,
                                          i,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Traducir opción..."
                                      className="h-8 mt-1 bg-blue-50/50 focus-visible:ring-blue-500 border-blue-200"
                                    />
                                  ) : (
                                    <p className="text-sm text-blue-900">
                                      {opt.name_en || (
                                        <span className="text-muted-foreground italic">
                                          Sin traducción
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No hay variantes creadas</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Agrega variantes desde la configuración del menú para poder traducirlas.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Barra flotante de acciones */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="bg-background/80 backdrop-blur-lg border shadow-lg rounded-full p-1.5 sm:p-2 flex items-center justify-center gap-2 sm:gap-4 max-w-full pointer-events-auto">
          <Button
            onClick={() => translateMutation.mutate()}
            disabled={
              !restaurantId || translateMutation.isPending || isAnyEditActive
            }
            className="rounded-full shadow-sm text-xs sm:text-sm px-4 sm:px-6 h-10 sm:h-12"
          >
            {translateMutation.isPending ? (
              <Sparkles className="w-4 h-4 mr-2 animate-spin shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {translateMutation.isPending
                ? "Traduciendo..."
                : "Traducir Todo Automáticamente"}
            </span>
            <span className="sm:hidden">
              {translateMutation.isPending ? "Traduciendo..." : "Traducir Todo"}
            </span>
          </Button>

          {isAnyEditActive && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={async () => {
                setEditingMealId(null);
                setEditingCategoryId(null);
                setEditingMessageId(null);
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
