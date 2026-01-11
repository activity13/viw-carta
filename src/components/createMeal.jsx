"use client";

import React, { useState, useEffect } from "react";
import Axios, { AxiosError } from "axios";
import { Plus, X, Upload, Save, Loader2 } from "lucide-react";
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
    name_en: "",
    description: "",
    description_en: "",
    shortDescription: "",
    shortDescription_en: "",

    // Precios
    basePrice: Number(),
    comparePrice: Number(),

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
    name_en: "",
    description: "",
    description_en: "",
    shortDescription: "",
    shortDescription_en: "",

    // Precios
    basePrice: Number(),
    comparePrice: Number(),

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
        // revalidateMenu(slug);
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
    { id: "media", label: "Imágenes" },
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
            Crear Nuevo Plato
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Completa el formulario para agregar un nuevo plato al menú.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">
          <div>
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex flex-wrap gap-2 sm:gap-4 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>

                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        handleInputChange("categoryId", value)
                      }
                      required
                    >
                      <SelectTrigger className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Categorías</SelectLabel>
                          {categories?.length === 0 && (
                            <SelectItem value="no-categories" disabled>
                              No hay categorías disponibles
                            </SelectItem>
                          )}
                          {categories.map((cat) => (
                            <SelectItem
                              key={cat._id}
                              value={cat._id.toString()}
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Nombre del Plato *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    maxLength={100}
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Ej: Ceviche Mixto"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.name || "").length}/100 caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    maxLength={500}
                    rows={4}
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Descripción detallada del plato..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.description || "").length}/500 caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Descripción Corta (para móviles)
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      handleInputChange("shortDescription", e.target.value)
                    }
                    maxLength={100}
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Descripción breve..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.shortDescription || "").length}/100 caracteres
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Precio Base *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-500 text-sm">
                        S/.
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.basePrice}
                        onChange={(e) =>
                          handleInputChange("basePrice", e.target.value)
                        }
                        className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Precio Comparativo (precio tachado)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-500 text-sm">
                        S/.
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.comparePrice}
                        onChange={(e) =>
                          handleInputChange("comparePrice", e.target.value)
                        }
                        className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Tiempo de Preparación Mínimo (minutos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.preparationTime.min}
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
                      value={formData.preparationTime.max}
                      onChange={(e) =>
                        handleInputChange("preparationTime.max", e.target.value)
                      }
                      className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="15"
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Imágenes */}
            {activeTab === "media" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Imágenes del Plato
                  </label>

                  {/* Lista de imágenes existentes */}
                  {formData.images && formData.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {formData.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                        >
                          <img
                            src={img.url}
                            alt={`Imagen ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                // Eliminar del servidor UploadThing
                                await Axios.post("/api/uploadthing/delete", {
                                  url: img.url,
                                });

                                // Eliminar del estado local
                                const newImages = [...formData.images];
                                newImages.splice(idx, 1);
                                setFormData((prev) => ({
                                  ...prev,
                                  images: newImages,
                                }));
                              } catch (error) {
                                console.error("Error deleting image:", error);
                                alert("Error al eliminar la imagen");
                              }
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Eliminar imagen"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Uploader */}
                  {!formData.images || formData.images.length < 1 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                      <UploadButton
                        endpoint="mealImage"
                        onClientUploadComplete={(res) => {
                          if (res && res[0]) {
                            const newImage = {
                              url: res[0].url,
                              alt: formData.name || "Imagen del plato",
                              isPrimary: formData.images.length === 0,
                            };
                            setFormData((prev) => ({
                              ...prev,
                              images: [...prev.images, newImage],
                            }));
                            console.log("Files: ", res);
                          }
                        }}
                        onUploadError={(error) => {
                          alert(`ERROR! ${error.message}`);
                        }}
                        appearance={{
                          button:
                            "bg-emerald-600 text-white hover:bg-emerald-700 ut-uploading:cursor-not-allowed rounded-md px-4 py-2",
                          allowedContent: "text-gray-500 text-xs mt-2",
                        }}
                        content={{
                          button({ ready }) {
                            if (ready) return "Subir Imagen";
                            return "Cargando...";
                          },
                          allowedContent({ ready, fileTypes, isUploading }) {
                            if (!ready) return "Verificando...";
                            if (isUploading) return "Subiendo...";
                            return `Máx 2MB. Formatos: ${fileTypes.join(", ")}`;
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center italic">
                      Límite de 1 imagen alcanzado. Elimina la actual para subir
                      otra.
                    </p>
                  )}
                </div>
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
                            e.target.value
                          )
                        }
                        className="flex-1 p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Ej: Pescado fresco"
                      />
                      <button
                        type="button"
                        onClick={() => handleArrayRemove("ingredients", index)}
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
                      <label key={tag} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.dietaryTags.includes(tag)}
                          onChange={() => handleMultiSelect("dietaryTags", tag)}
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
                    {(formData.shortDescription_en || "").length}/100 caracteres
                  </p>
                </div>
              </div>
            )}
            {/* Disponibilidad */}
            {activeTab === "availability" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.availability.isAvailable}
                    onChange={(e) =>
                      handleInputChange(
                        "availability.isAvailable",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="isAvailable"
                    className="text-xs sm:text-sm font-medium text-gray-700"
                  >
                    Plato disponible
                  </label>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Cantidad Disponible (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.availability.availableQuantity}
                    onChange={(e) =>
                      handleInputChange(
                        "availability.availableQuantity",
                        e.target.value
                      )
                    }
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Dejar vacío para disponibilidad ilimitada"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para platos con cantidad limitada
                  </p>
                </div>
              </div>
            )}
            {/* Configuración */}
            {activeTab === "display" && (
              <div className="space-y-4">
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
                          e.target.checked
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
                          e.target.checked
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
                          handleArrayUpdate("searchTags", index, e.target.value)
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

        {/* Action Buttons (sticky footer) */}
        <div className="shrink-0 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <DialogClose asChild>
                <Button
                  onClick={onClose}
                  variant={"outline"}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </Button>
              </DialogClose>

              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                onClick={handleSubmit}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editMode ? "Guardar Cambios" : "Crear Plato"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMealForm;
