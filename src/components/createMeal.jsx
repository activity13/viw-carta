"use client";

import React, { useState, useEffect } from "react";
import Axios, { AxiosError } from "axios";

import { Plus, X, Upload, Save, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { revalidateMenu } from "./utils/revalidateMenu";
import { useSession } from "next-auth/react";
import { UploadButton } from "@/utils/uploadthing";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";

const CreateMealForm = ({
  restaurantId,
  fetchMeals,
  mealId,
  isOpen,
  onClose,
}) => {


  const [formData, setFormData] = useState({
    // Información básica
    restaurantId: "",
    categoryId: "",
    name: "",
    code: "",
    name_en: "",
    description: "",
    description_en: "",
    shortDescription: "",
    shortDescription_en: "",

    // Precios
    basePrice: "",
    comparePrice: "",

    // Imágenes
    images: [],

    // Ingredientes y alérgenos
    ingredients: [""],
    allergens: [],
    dietaryTags: [],

    // Variantes (simplificado)
    variants: [],

    // Disponibilidad
    availability: {
      isAvailable: true,
      availableQuantity: "",
      schedule: {
        monday: { isAvailable: true, timeSlots: [] },
        tuesday: { isAvailable: true, timeSlots: [] },
        wednesday: { isAvailable: true, timeSlots: [] },
        thursday: { isAvailable: true, timeSlots: [] },
        friday: { isAvailable: true, timeSlots: [] },
        saturday: { isAvailable: true, timeSlots: [] },
        sunday: { isAvailable: true, timeSlots: [] },
      }
    },

    // Tiempo de preparación
    preparationTime: {
      min: "",
      max: "",
    },

    // Configuración de visualización
    display: {
      order: "",
      isFeatured: false,
      showInMenu: true,
    },

    // Estado
    status: "active",

    // SEO
    searchTags: [""],
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [editMode, setEditMode] = useState(false);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);

  const initialFormData = {
    // Información básica
    restaurantId: "",
    categoryId: "",
    name: "",
    code: "",
    name_en: "",
    description: "",
    description_en: "",
    shortDescription: "",
    shortDescription_en: "",

    // Precios
    basePrice: "",
    comparePrice: "",

    // Imágenes
    images: [],

    // Ingredientes y alérgenos
    ingredients: [""],
    allergens: [],
    dietaryTags: [],

    // Variantes (simplificado)
    variants: [],

    // Disponibilidad
    availability: {
      isAvailable: true,
      availableQuantity: "",
      schedule: {
        monday: { isAvailable: true, timeSlots: [] },
        tuesday: { isAvailable: true, timeSlots: [] },
        wednesday: { isAvailable: true, timeSlots: [] },
        thursday: { isAvailable: true, timeSlots: [] },
        friday: { isAvailable: true, timeSlots: [] },
        saturday: { isAvailable: true, timeSlots: [] },
        sunday: { isAvailable: true, timeSlots: [] },
      }
    },

    // Tiempo de preparación
    preparationTime: {
      min: "",
      max: "",
    },

    // Configuración de visualización
    display: {
      order: "",
      isFeatured: false,
      showInMenu: true,
    },

    // Estado
    status: "active",

    // SEO
    searchTags: [""],
  };

  // Opciones para los selects
  const allergenOptions = [
    "gluten",
    "lactosa",
    "nueces",
    "maní",
    "huevos",
    "soya",
    "fish",
    "mariscos",
    "ajonjolí",
  ];

  const dietaryTagOptions = [
    "vegetariano",
    "vegano",
    "gluten-free",
    "dairy-free",
    "keto",
    "bajos-carbs",
    "alta-proteina",
    "organico",
    "picante",
    "mild",
    "recomendación-chef",
  ];

  const statusOptions = [
    { value: "active", label: "Activo" },
    { value: "inactive", label: "Inactivo" },
    { value: "draft", label: "Borrador" },
    { value: "archived", label: "Archivado" },
  ];

  const { data: session } = useSession();
  const slug = session?.user?.slug;

  // --- Variant Templates Query ---
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["variant-templates", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const res = await fetch(
        `/api/variants/templates?restaurantId=${restaurantId.toString()}`,
      );
      console.log("🚀 ~ createMeal.jsx:197 ~ CreateMealForm ~ res:", res);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const addVariantFromTemplate = (templateId) => {
    const template = templates.find((t) => t._id === templateId);
    if (!template) return;

    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: template.title,
          type: template.type,
          isRequired: template.isRequired,
          replacesBasePrice: template.replacesBasePrice,
          options: template.options.map((opt) => ({
            name: opt.name,
            price: opt.price || "",
            priceModifier: opt.priceModifier || 0,
            isAvailable: true,
          })),
        },
      ],
    }));
  };

  // Reset form when opening in create mode
  useEffect(() => {
    if (isOpen && !mealId) {
      setFormData(initialFormData);
      setEditMode(false);
    }
  }, [isOpen, mealId]);

  // Handlers
  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAvailabilityToggle = (checked) => {
    setFormData((prev) => {
      const schedule = prev.availability.schedule || {
        monday: { isAvailable: true, timeSlots: [] },
        tuesday: { isAvailable: true, timeSlots: [] },
        wednesday: { isAvailable: true, timeSlots: [] },
        thursday: { isAvailable: true, timeSlots: [] },
        friday: { isAvailable: true, timeSlots: [] },
        saturday: { isAvailable: true, timeSlots: [] },
        sunday: { isAvailable: true, timeSlots: [] },
      };

      const newSchedule = { ...schedule };

      // Update all days to match the main toggle
      Object.keys(newSchedule).forEach((day) => {
        const currentDay = newSchedule[day] || { isAvailable: true, timeSlots: [] };
        newSchedule[day] = {
          ...currentDay,
          isAvailable: checked,
          // The user specifically requested to NOT add a default time slot
          timeSlots: currentDay.timeSlots || []
        };
      });

      return {
        ...prev,
        availability: {
          ...prev.availability,
          isAvailable: checked,
          schedule: newSchedule,
        },
      };
    });
  };

  const handleScheduleDayToggle = (day, checked) => {
    setFormData((prev) => {
      const schedule = prev.availability.schedule || {
        monday: { isAvailable: true, timeSlots: [] },
        tuesday: { isAvailable: true, timeSlots: [] },
        wednesday: { isAvailable: true, timeSlots: [] },
        thursday: { isAvailable: true, timeSlots: [] },
        friday: { isAvailable: true, timeSlots: [] },
        saturday: { isAvailable: true, timeSlots: [] },
        sunday: { isAvailable: true, timeSlots: [] },
      };

      const currentDay = schedule[day] || { isAvailable: true, timeSlots: [] };

      const newSchedule = {
        ...schedule,
        [day]: {
          ...currentDay,
          isAvailable: checked,
          timeSlots: currentDay.timeSlots || []
        }
      };

      const anyDayChecked = Object.values(newSchedule).some(d => d.isAvailable);

      return {
        ...prev,
        availability: {
          ...prev.availability,
          isAvailable: anyDayChecked ? true : prev.availability.isAvailable,
          schedule: newSchedule
        }
      };
    });
  };

  const handleScheduleTimeChange = (day, index, field, value) => {
    setFormData((prev) => {
      const schedule = prev.availability.schedule;
      const currentDay = schedule[day];
      const newTimeSlots = [...(currentDay.timeSlots || [])];

      newTimeSlots[index] = {
        ...newTimeSlots[index],
        [field]: value
      };

      return {
        ...prev,
        availability: {
          ...prev.availability,
          schedule: {
            ...schedule,
            [day]: {
              ...currentDay,
              timeSlots: newTimeSlots
            }
          }
        }
      };
    });
  };

  const addScheduleTimeSlot = (day) => {
    setFormData((prev) => {
      const schedule = prev.availability.schedule;
      const currentDay = schedule[day];
      return {
        ...prev,
        availability: {
          ...prev.availability,
          schedule: {
            ...schedule,
            [day]: {
              ...currentDay,
              timeSlots: [...(currentDay.timeSlots || []), { start: "12:00", end: "23:00" }]
            }
          }
        }
      };
    });
  };

  const removeScheduleTimeSlot = (day, index) => {
    setFormData((prev) => {
      const schedule = prev.availability.schedule;
      const currentDay = schedule[day];
      return {
        ...prev,
        availability: {
          ...prev.availability,
          schedule: {
            ...schedule,
            [day]: {
              ...currentDay,
              timeSlots: (currentDay.timeSlots || []).filter((_, i) => i !== index)
            }
          }
        }
      };
    });
  };

  const handleArrayAdd = (field, value = "") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value],
    }));
  };

  const handleArrayRemove = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleArrayUpdate = (field, index, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleMultiSelect = (field, option) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(option)
        ? prev[field].filter((item) => item !== option)
        : [...prev[field], option],
    }));
  };

  // --- Manejo de Variantes ---
  const addVariantGroup = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: "",
          type: "single",
          isRequired: false,
          replacesBasePrice: false,
          options: [],
        },
      ],
    }));
  };

  const removeVariantGroup = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariantGroup = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((group, i) =>
        i === index ? { ...group, [field]: value } : group,
      ),
    }));
  };

  const addVariantOption = (groupIndex) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((group, i) =>
        i === groupIndex
          ? {
            ...group,
            options: [
              ...group.options,
              { name: "", priceModifier: 0, price: "", isAvailable: true },
            ],
          }
          : group,
      ),
    }));
  };

  const removeVariantOption = (groupIndex, optionIndex) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((group, i) =>
        i === groupIndex
          ? {
            ...group,
            options: group.options.filter((_, j) => j !== optionIndex),
          }
          : group,
      ),
    }));
  };

  const updateVariantOption = (groupIndex, optionIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((group, i) =>
        i === groupIndex
          ? {
            ...group,
            options: group.options.map((opt, j) =>
              j === optionIndex ? { ...opt, [field]: value } : opt,
            ),
          }
          : group,
      ),
    }));
  };

  const fetchEditProduct = async (id) => {
    try {
      setId(id);
      const response = await Axios.get(`/api/master/edit`, {
        params: { id },
      });
      setFormData({
        ...initialFormData,
        ...response.data,
        categoryId: response.data.categoryId?.toString() || "",
        name: response.data.name || "",
        code: response.data.code || "",
        name_en: response.data.name_en || "",
        description: response.data.description || "",
        description_en: response.data.description_en || "",
        shortDescription: response.data.shortDescription || "",
        shortDescription_en: response.data.shortDescription_en || "",
        basePrice: response.data.basePrice ?? "",
        comparePrice: response.data.comparePrice ?? "",
        ingredients: response.data.ingredients || [""],
        allergens: response.data.allergens || [],
        dietaryTags: response.data.dietaryTags || [],
        searchTags: response.data.searchTags || [""],
        variants: response.data.variants || [], // Ensuring variants are loaded
        availability: {
          ...initialFormData.availability,
          ...(response.data.availability || {}),
          availableQuantity:
            response.data.availability?.availableQuantity ?? "",
        },
        preparationTime: {
          ...initialFormData.preparationTime,
          ...(response.data.preparationTime || {}),
          min: response.data.preparationTime?.min ?? "",
          max: response.data.preparationTime?.max ?? "",
        },
        display: {
          ...initialFormData.display,
          ...(response.data.display || {}),
          order: response.data.display?.order ?? "",
        },
      });
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editMode) {
        // Aquí iría la lógica para editar un plato existente
        const actionResponse = await Axios.post(`/api/master/update`, {
          params: {
            id: id,
          },
          formData,
        });
        revalidateMenu(slug);
        console.log("Response from backend:", actionResponse.data);
        fetchMeals();
        setFormData(initialFormData);
        setEditMode(false);
        onClose();
      } else {
        // Aquí iría la lógica para crear un nuevo plato
        const actionResponse = await Axios.post("/api/master/create", {
          formData,
          restaurantId,
        });
        revalidateMenu(slug);
        console.log("Response from backend:", actionResponse.data);
        fetchMeals();
        setFormData(initialFormData);
        onClose();
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response) {
          // The request was made and the server responded with a status code
          setError(error.response.data.error || "Error desconocido");
        } else if (error.request) {
          // The request was made but no response was received
          setError("No se recibió respuesta del servidor");
        } else {
          // Something happened in setting up the request that triggered an Error
          setError("Error al configurar la solicitud");
        }
      }
    } finally {
      setLoading(false);
    }
    // Aquí enviarías los datos al backend
  };

  const tabs = [
    { id: "basic", label: "Información Básica" },
    { id: "variants", label: "Variantes" },
    { id: "ingredients", label: "Ingredientes" },
    { id: "translation", label: "🌐 Traducción" },
    { id: "availability", label: "Disponibilidad" },
    { id: "display", label: "Configuración" },
  ];
  useEffect(() => {
    if (!restaurantId) return;
    const fetchCategories = async () => {
      try {
        const res = await Axios.get("/api/categories/get", {
          params: { restaurantId },
        });
        setCategories(res.data || []);
      } catch (error) {
        setCategories([]);
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [restaurantId]);

  useEffect(() => {
    if (mealId === undefined) {
      return;
    }

    if (mealId && mealId.length === 24) {
      setEditMode(true);
      fetchEditProduct(mealId);
    }
  }, [mealId]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[85vw] md:max-w-3xl lg:max-w-4xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {editMode ? formData.name : "Crear Nuevo Plato"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Completa el formulario para agregar un nuevo plato al menú.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1 pb-20 relative">
          <div className="flex flex-col h-full">
            {/* Fix 1: Sticky Tabs with Horizontal Scroll */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 mb-6 -mx-1 px-1">
              <nav className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-6 pb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 whitespace-nowrap border-b-2 font-medium text-sm transition-all duration-300 relative ${activeTab === tab.id
                        ? "border-emerald-500 text-emerald-500"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              {/* Información Básica */}
              {activeTab === "basic" && (
                <div className="space-y-6 bg-[#111111] text-gray-100 p-6 -mx-4 sm:-mx-6 -mt-6 rounded-b-lg shadow-inner min-h-[60vh]">

                  {/* Categoria */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Categoría
                      </label>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Obligatorio</span>
                    </div>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => handleInputChange("categoryId", value)}
                      required
                    >
                      <SelectTrigger className="w-full p-3 bg-[#1A1A1A] text-white border border-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none h-12">
                        <SelectValue placeholder="Seleccionar Categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-800 text-white">
                        <SelectGroup>
                          <SelectLabel className="text-gray-400">Categorías</SelectLabel>
                          {categories?.length === 0 && (
                            <SelectItem value="no-categories" disabled className="text-gray-500">
                              No hay categorías disponibles
                            </SelectItem>
                          )}
                          {categories.map((cat) => (
                            <SelectItem
                              key={cat._id}
                              value={cat._id.toString()}
                              className="focus:bg-gray-800 focus:text-white cursor-pointer"
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Código Interno / SKU */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Código Interno / SKU / Barras
                    </label>
                    <input
                      type="text"
                      value={formData.code || ""}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                      className="w-full p-3 bg-[#1A1A1A] text-white border border-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-gray-600 outline-none h-12"
                      placeholder="P-00123"
                    />
                  </div>

                  {/* Nombre del Plato */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Nombre del Plato
                      </label>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Obligatorio</span>
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      maxLength={100}
                      className="w-full p-3 bg-[#1A1A1A] text-white border border-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-gray-600 outline-none h-12"
                      placeholder="Ej: Risotto de Hongos Silvestres"
                      required
                    />
                  </div>

                  {/* Descripción Corta */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Descripción Corta (para móviles)
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                      maxLength={100}
                      className="w-full p-3 bg-[#1A1A1A] text-white border border-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-gray-600 outline-none h-12"
                      placeholder="Breve descripción de una línea..."
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="w-full p-3 bg-[#1A1A1A] text-white border border-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-gray-600 outline-none resize-none"
                      placeholder="Describe los ingredientes, preparación y notas de sabor..."
                    />
                  </div>

                  {/* Gestión de Precios */}
                  <div className="pt-4 border-t border-gray-800/60">
                    <h3 className="text-sm font-semibold text-emerald-500 tracking-wide mb-4">Gestión de Precios</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-3 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            Precio Base
                          </label>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Obligatorio</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-emerald-500 font-bold mr-2">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.basePrice}
                            onChange={(e) => handleInputChange("basePrice", e.target.value)}
                            className="w-full bg-transparent text-white font-bold text-lg border-none focus:ring-0 p-0 outline-none placeholder:text-gray-600"
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-3 flex flex-col justify-center">
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                          Precio Comparativo
                        </label>
                        <div className="flex items-center">
                          <span className="text-gray-500 font-bold mr-2">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.comparePrice}
                            onChange={(e) => handleInputChange("comparePrice", e.target.value)}
                            className="w-full bg-transparent text-white font-bold text-lg border-none focus:ring-0 p-0 outline-none placeholder:text-gray-600"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Area */}
                  <div className="pt-4 border-t border-gray-800/60 pb-4">
                    <h3 className="text-sm font-semibold text-emerald-500 tracking-wide mb-4">Imagen del Plato</h3>
                    {formData.images && formData.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {formData.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-gray-800 bg-[#1A1A1A]"
                          >
                            <img
                              src={img.url}
                              alt={`Imagen ${idx + 1}`}
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await Axios.post("/api/uploadthing/delete", { url: img.url });
                                  const newImages = [...formData.images];
                                  newImages.splice(idx, 1);
                                  setFormData((prev) => ({ ...prev, images: newImages }));
                                } catch (error) {
                                  console.error("Error deleting image:", error);
                                }
                              }}
                              className="absolute top-2 right-2 bg-red-500/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-700 hover:border-emerald-500/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center bg-[#1A1A1A]/50 relative overflow-hidden group min-h-[160px]">
                        <div className="relative z-10 flex flex-col items-center">
                          <UploadButton
                            endpoint="mealImage"
                            onClientUploadComplete={(res) => {
                              if (res && res[0]) {
                                const newImage = {
                                  url: res[0].url,
                                  alt: formData.name || "Imagen del plato",
                                  isPrimary: true,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  images: [newImage],
                                }));
                              }
                            }}
                            onUploadError={(error) => {
                              alert(`ERROR! ${error.message}`);
                            }}
                            appearance={{
                              button: "bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all rounded-full px-6 py-2 font-medium text-sm",
                              allowedContent: "text-gray-500 text-xs mt-3 uppercase tracking-wider",
                            }}
                            content={{
                              button({ ready }) {
                                if (ready) return "Subir Imagen (Opcional)";
                                return "Cargando...";
                              },
                              allowedContent({ ready, fileTypes, isUploading }) {
                                if (!ready) return "Verificando...";
                                if (isUploading) return "Subiendo...";
                                return `Máx 2MB. ${fileTypes.join(", ")}`;
                              },
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "variants" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-gray-700">
                      Grupos de Variantes
                    </h3>
                    <div className="flex gap-2 items-center">
                      <Select
                        onValueChange={addVariantFromTemplate}
                        disabled={isLoadingTemplates}
                      >
                        <SelectTrigger className="w-[180px] h-9 text-xs border-emerald-200">
                          <SelectValue
                            placeholder={
                              isLoadingTemplates
                                ? "Cargando..."
                                : "Importar plantilla"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Plantillas Guardadas</SelectLabel>
                            {templates?.map((t) => (
                              <SelectItem key={t._id} value={t._id}>
                                {t.title}
                              </SelectItem>
                            ))}
                            {!isLoadingTemplates && templates?.length === 0 && (
                              <div className="p-2 text-xs text-center text-gray-500">
                                Sin plantillas creadas
                              </div>
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        onClick={addVariantGroup}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <Plus className="h-4 w-4" /> Personalizada
                      </Button>
                    </div>
                  </div>

                  {formData.variants.length === 0 && (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm mb-2">
                        No hay variantes configuradas para este plato.
                      </p>
                      <div className="flex justify-center gap-2">
                        <span className="text-xs text-gray-400">
                          Usa una plantilla o crea una vacía.
                        </span>
                      </div>
                    </div>
                  )}

                  {formData.variants.map((group, groupIndex) => (
                    <div
                      key={groupIndex}
                      className="border border-gray-200 rounded-lg p-4 bg-green-950 shadow-sm space-y-4"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-4">
                          {/* Cabecera del Grupo */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Nombre del Grupo
                              </label>
                              <input
                                type="text"
                                value={group.name}
                                onChange={(e) =>
                                  updateVariantGroup(
                                    groupIndex,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ej: Elige el tamaño"
                                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            <div className="flex flex-col justify-end">
                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={group.isRequired}
                                    onChange={(e) =>
                                      updateVariantGroup(
                                        groupIndex,
                                        "isRequired",
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  Obligatorio
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={group.type === "multiple"}
                                    onChange={(e) =>
                                      updateVariantGroup(
                                        groupIndex,
                                        "type",
                                        e.target.checked
                                          ? "multiple"
                                          : "single",
                                      )
                                    }
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  Múltiples opciones
                                </label>
                                <label
                                  className="flex items-center gap-2 cursor-pointer select-none"
                                  title="Si se activa, el precio de la opción seleccionada reemplazará el precio base del plato"
                                >
                                  <input
                                    type="checkbox"
                                    checked={group.replacesBasePrice}
                                    onChange={(e) =>
                                      updateVariantGroup(
                                        groupIndex,
                                        "replacesBasePrice",
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="font-medium text-emerald-700">
                                    Reemplaza Precio Base
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Lista de Opciones */}
                          <div className="bg-green-950 p-3 rounded-md border border-gray-100">
                            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
                              <div className="col-span-6">Nombre de Opción</div>
                              <div className="col-span-4">
                                {group.replacesBasePrice
                                  ? "Precio Final (S/.)"
                                  : "Adicional (+/- S/.)"}
                              </div>
                              <div className="col-span-2 text-center">
                                Borrar
                              </div>
                            </div>

                            <div className="space-y-2">
                              {group.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="grid grid-cols-12 gap-2 items-center"
                                >
                                  <div className="col-span-6">
                                    <input
                                      type="text"
                                      value={option.name}
                                      onChange={(e) =>
                                        updateVariantOption(
                                          groupIndex,
                                          optIndex,
                                          "name",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Ej: Grande, Sin cebolla"
                                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                  </div>
                                  <div className="col-span-4">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={
                                        group.replacesBasePrice
                                          ? option.price
                                          : option.priceModifier
                                      }
                                      onChange={(e) =>
                                        updateVariantOption(
                                          groupIndex,
                                          optIndex,
                                          group.replacesBasePrice
                                            ? "price"
                                            : "priceModifier",
                                          e.target.value === ""
                                            ? ""
                                            : Number(e.target.value),
                                        )
                                      }
                                      placeholder="0.00"
                                      className={`w-full p-2 text-sm border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${group.replacesBasePrice
                                          ? "border-emerald-300 bg-emerald-950 text-white"
                                          : "border-gray-300"
                                        }`}
                                    />
                                  </div>
                                  <div className="col-span-2 flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeVariantOption(
                                          groupIndex,
                                          optIndex,
                                        )
                                      }
                                      className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <Button
                              type="button"
                              onClick={() => addVariantOption(groupIndex)}
                              variant="ghost"
                              size="sm"
                              className="w-full mt-3 text-xs text-gray-900 hover:text-emerald-600 border border-dashed border-gray-300 hover:border-emerald-300 bg-green-800"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Agregar Opción
                            </Button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantGroup(groupIndex)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Eliminar grupo completo"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          {/* Ingredientes */}
          {activeTab === "ingredients" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Ingredientes
                </label>
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) =>
                        handleArrayUpdate(
                          "ingredients",
                          index,
                          e.target.value,
                        )
                      }
                      className="flex-1 p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Ej: Pescado fresco"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleArrayRemove("ingredients", index)
                      }
                      className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleArrayAdd("ingredients")}
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Ingrediente
                </button>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Alérgenos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allergenOptions.map((allergen) => (
                    <label
                      key={allergen}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={formData.allergens.includes(allergen)}
                        onChange={() =>
                          handleMultiSelect("allergens", allergen)
                        }
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs sm:text-sm text-gray-700 capitalize">
                        {allergen}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Etiquetas Dietéticas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dietaryTagOptions.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={formData.dietaryTags.includes(tag)}
                        onChange={() =>
                          handleMultiSelect("dietaryTags", tag)
                        }
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs sm:text-sm text-gray-700 capitalize">
                        {tag.replace("-", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Traducción (Inglés) */}
          {activeTab === "translation" && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700">
                  🌐 Agrega las traducciones en inglés para que tu menú sea
                  bilingüe.
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Nombre en Inglés
                </label>
                <input
                  type="text"
                  value={formData.name_en || ""}
                  onChange={(e) =>
                    handleInputChange("name_en", e.target.value)
                  }
                  maxLength={100}
                  className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ej: Mixed Ceviche"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.name_en || "").length}/100 caracteres
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Descripción en Inglés
                </label>
                <textarea
                  value={formData.description_en || ""}
                  onChange={(e) =>
                    handleInputChange("description_en", e.target.value)
                  }
                  maxLength={500}
                  rows={4}
                  className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Detailed description of the dish in English..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.description_en || "").length}/500 caracteres
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Descripción Corta en Inglés (para móviles)
                </label>
                <input
                  type="text"
                  value={formData.shortDescription_en || ""}
                  onChange={(e) =>
                    handleInputChange("shortDescription_en", e.target.value)
                  }
                  maxLength={100}
                  className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.shortDescription_en || "").length}/100
                  caracteres
                </p>
              </div>
            </div>
          )}
          {/* Disponibilidad */}
          {activeTab === "availability" && (
            <div className="space-y-8 bg-[#111111] text-gray-100 p-6 -mx-4 sm:-mx-6 -mt-6 rounded-b-lg shadow-inner min-h-[60vh]">
              {/* General Availability Toggle */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                <div className="flex flex-col space-y-1">
                  <span className="text-base font-semibold text-white tracking-wide">Plato disponible</span>
                  <span className="text-sm text-gray-400">Plato disponible para pedidos</span>
                </div>
                <Switch
                  checked={formData.availability.isAvailable}
                  onCheckedChange={(checked) => handleAvailabilityToggle(checked)}
                  className="data-[state=checked]:bg-emerald-500 w-11 h-6"
                />
              </div>

              {/* Available Quantity */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-white tracking-wide">
                    Cantidad disponible <span className="text-gray-500 font-normal">(Opcional)</span>
                  </label>
                  <Info className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.availability.availableQuantity}
                  onChange={(e) => handleInputChange("availability.availableQuantity", e.target.value)}
                  className="w-full p-3 bg-[#1A1A1A] text-white border border-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-gray-600 outline-none"
                  placeholder="Ej: 50"
                />
              </div>

              {/* Weekly Schedule */}
              <div className="pt-4 space-y-4">
                <h3 className="text-lg font-semibold text-white tracking-wide mb-2">Programación Semanal</h3>

                <div className="flex flex-col space-y-1">
                  {[
                    { key: "monday", label: "Lunes" },
                    { key: "tuesday", label: "Martes" },
                    { key: "wednesday", label: "Miércoles" },
                    { key: "thursday", label: "Jueves" },
                    { key: "friday", label: "Viernes" },
                    { key: "saturday", label: "Sábados" },
                    { key: "sunday", label: "Domingos" },
                  ].map(({ key, label }) => {
                    const dayData = formData.availability.schedule?.[key] || { isAvailable: true, timeSlots: [] };
                    const hasTimeSlots = dayData.timeSlots && dayData.timeSlots.length > 0;
                    const subTitle = !dayData.isAvailable ? "Desactivado" : (hasTimeSlots ? `${dayData.timeSlots.length} horario(s)` : "Todo el día");

                    return (
                      <div key={key} className="flex flex-col">
                        <div className="flex items-center justify-between py-4 border-b border-gray-800/60">
                          <div className="flex items-center space-x-4">
                            <Switch
                              checked={dayData.isAvailable}
                              onCheckedChange={(checked) => handleScheduleDayToggle(key, checked)}
                              className="data-[state=checked]:bg-emerald-500 w-11 h-6 shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="text-base text-white tracking-wide">{label}</span>
                              <span className={`text-xs ${dayData.isAvailable ? "text-gray-400" : "text-gray-600"}`}>
                                {subTitle}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!dayData.isAvailable) handleScheduleDayToggle(key, true);
                              addScheduleTimeSlot(key);
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Horario</span>
                          </button>
                        </div>

                        {/* Time Slots Area */}
                        {dayData.isAvailable && hasTimeSlots && (
                          <div className="py-3 pl-16 space-y-3 bg-[#111111]">
                            {dayData.timeSlots.map((slot, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="flex items-center bg-[#1A1A1A] border border-gray-800 rounded-lg overflow-hidden">
                                  <input
                                    type="time"
                                    value={slot.start || "12:00"}
                                    onChange={(e) => handleScheduleTimeChange(key, index, "start", e.target.value)}
                                    className="p-2 text-sm bg-transparent text-white border-none focus:ring-0 w-[100px] outline-none"
                                  />
                                  <span className="text-gray-600">-</span>
                                  <input
                                    type="time"
                                    value={slot.end || "23:00"}
                                    onChange={(e) => handleScheduleTimeChange(key, index, "end", e.target.value)}
                                    className="p-2 text-sm bg-transparent text-white border-none focus:ring-0 w-[100px] outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeScheduleTimeSlot(key, index)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {/* Configuración */}
          {activeTab === "display" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Tiempo de Preparación Mínimo (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.preparationTime?.min || ""}
                    onChange={(e) =>
                      handleInputChange("preparationTime.min", e.target.value)
                    }
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Tiempo de Preparación Máximo (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.preparationTime?.max || ""}
                    onChange={(e) =>
                      handleInputChange("preparationTime.max", e.target.value)
                    }
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="15"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Orden en la Categoría
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.display.order}
                    onChange={(e) =>
                      handleInputChange("display.order", e.target.value)
                    }
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.display.isFeatured}
                    onChange={(e) =>
                      handleInputChange(
                        "display.isFeatured",
                        e.target.checked,
                      )
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="text-xs sm:text-sm font-medium text-gray-700"
                  >
                    Plato destacado (aparece en la página principal)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showInMenu"
                    checked={formData.display.showInMenu}
                    onChange={(e) =>
                      handleInputChange(
                        "display.showInMenu",
                        e.target.checked,
                      )
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="showInMenu"
                    className="text-xs sm:text-sm font-medium text-gray-700"
                  >
                    Mostrar en el menú
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Etiquetas de Búsqueda
                </label>
                {formData.searchTags.map((tag, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) =>
                        handleArrayUpdate(
                          "searchTags",
                          index,
                          e.target.value,
                        )
                      }
                      className="flex-1 p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Ej: ceviche, pescado, limón"
                    />
                    <button
                      type="button"
                      onClick={() => handleArrayRemove("searchTags", index)}
                      className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleArrayAdd("searchTags")}
                  className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Etiqueta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Action Buttons (sticky footer) */ }
    <div className={`shrink-0 pt-4 border-t transition-colors duration-300 ${activeTab === "availability" ? "border-gray-800 bg-[#111111] -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6 -mb-4 sm:-mb-6 rounded-b-lg" : "border-gray-200"}`}>
    <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
        <DialogClose asChild>
          <Button
            onClick={onClose}
            variant={"outline"}
            className={`w-full sm:w-32 h-12 rounded-2xl font-medium transition-colors ${activeTab === "availability"
                ? "border-gray-700 text-gray-300 bg-transparent hover:bg-gray-800 hover:text-white"
                : "border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
          >
            Cancelar
          </Button>
        </DialogClose>

        <Button
          type="submit"
          disabled={loading}
          className={`w-full sm:w-32 h-12 rounded-2xl font-medium text-white transition-colors flex items-center justify-center gap-2 ${activeTab === "availability"
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          onClick={handleSubmit}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {editMode ? "Guardar" : "Crear"}
        </Button>
      </div>
    </div>
  </div>
      </DialogContent >
    </Dialog >
  );
};

export default CreateMealForm;
