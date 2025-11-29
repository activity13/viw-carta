"use client";

import React, { useState, useEffect } from "react";
import Axios, { AxiosError } from "axios";
import { Plus, X, Upload, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revalidateMenu } from "./utils/revalidateMenu";
import { useSession } from "next-auth/react";
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
    description: "",
    shortDescription: "",

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

  const initialFormData = {
    // Información básica
    restaurantId: "",
    categoryId: "",
    name: "",
    description: "",
    shortDescription: "",

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
        ...response.data,
        categoryId: response.data.categoryId?.toString() || "",
      });
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

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
    }
    // Aquí enviarías los datos al backend
  };

  const tabs = [
    { id: "basic", label: "Información Básica" },
    { id: "media", label: "Imágenes" },
    { id: "ingredients", label: "Ingredientes" },
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
        setCategories(res.data);
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
      console.log("Editing meal with ID:", mealId.length);
      setEditMode(true);
      fetchEditProduct(mealId);
    }
  }, [mealId]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            className="bg-green-700 hover:bg-green-600 rounded-full h-12 w-12 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            size="icon"
            aria-label="Add new item"
            onClick={() => {
              setFormData(initialFormData);
              setEditMode(false);
            }}
          >
            <h1 className="text-2xl">+</h1>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[85vw] md:max-w-3xl lg:max-w-4xl mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Crear Nuevo Plato
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Completa el formulario para agregar un nuevo plato al menú.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex flex-wrap gap-2 sm:gap-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
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
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">
                      Categoría *
                    </label>

                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        handleInputChange("categoryId", value)
                      }
                      required
                    >
                      <SelectTrigger className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Categorías</SelectLabel>
                          {categories.length === 0 && (
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
                  <label className="block text-xs sm:text-sm font-medium text-white mb-1">
                    Nombre del Plato *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    maxLength={100}
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Ceviche Mixto"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.name.length}/100 caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    maxLength={500}
                    rows={4}
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción detallada del plato..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-1">
                    Descripción Corta (para móviles)
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      handleInputChange("shortDescription", e.target.value)
                    }
                    maxLength={100}
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción breve..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.shortDescription.length}/100 caracteres
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">
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
                        className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">
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
                        className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">
                      Tiempo de Preparación Mínimo (minutos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.preparationTime.min}
                      onChange={(e) =>
                        handleInputChange("preparationTime.min", e.target.value)
                      }
                      className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">
                      Tiempo de Preparación Máximo (minutos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.preparationTime.max}
                      onChange={(e) =>
                        handleInputChange("preparationTime.max", e.target.value)
                      }
                      className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-gray-600 text-sm mb-2">
                      Arrastra y suelta imágenes aquí o
                    </p>
                    <button
                      type="button"
                      className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      Seleccionar Archivos
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG hasta 5MB cada una
                    </p>
                  </div>
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
                        className="flex-1 p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium text-sm"
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isAvailable"
                    className="text-xs sm:text-sm font-medium text-gray-700"
                  >
                    Plato disponible
                  </label>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-1">
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
                    className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">
                      Orden en la Categoría
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.display.order}
                      onChange={(e) =>
                        handleInputChange("display.order", e.target.value)
                      }
                      className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white mb-1">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                        className="flex-1 p-2 sm:p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Etiqueta
                  </button>
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200 gap-3">
              <Button
                variant={"outline"}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                <Eye className="h-4 w-4" />
                Vista Previa
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <DialogClose asChild>
                  <Button
                    onClick={onClose}
                    variant={"destructive"}
                    className="px-4 py-2 border border-gray-300 text-white hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancelar
                  </Button>
                </DialogClose>

                <button
                  type="submit"
                  variant={"primary"}
                  className="flex items-center hover:cursor-pointer gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  onClick={handleSubmit}
                >
                  <Save className="h-4 w-4" />
                  {editMode ? "Guardar Cambios" : "Crear Plato"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMealForm;
