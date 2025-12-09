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
import { Badge } from "@/components/ui/badge";
import {
  PartyPopper,
  Eye,
  Edit3,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Category {
  _id: string;
  name: string;
  name_en: string;
  order: number;
}

interface Meal {
  _id: string;
  name: string;
  name_en: string;
  description: string;
  price: number;
  isTemplate: boolean;
  categoryId: string;
}

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
}

// Loading component for Suspense fallback
function OnboardingWelcomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-muted-foreground">Preparando tu bienvenida...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component content that uses useSearchParams
function OnboardingWelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const restaurantId = searchParams.get("restaurantId");

  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId) {
      loadOnboardingData();
    } else {
      setError("ID de restaurante no proporcionado");
      setIsLoading(false);
    }
  }, [restaurantId]);

  const loadOnboardingData = async () => {
    try {
      setIsLoading(true);

      // Cargar datos del restaurante, categorías y platos
      const [restaurantRes, categoriesRes, mealsRes] = await Promise.all([
        axios.get(`/api/settings/${restaurantId}`),
        axios.get(`/api/categories?restaurantId=${restaurantId}`),
        axios.get(`/api/master/get?restaurantId=${restaurantId}`),
      ]);

      setRestaurant(restaurantRes.data);
      setCategories(
        categoriesRes.data.sort((a: Category, b: Category) => a.order - b.order)
      );
      setMeals(mealsRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setError("Error al cargar los datos del restaurante");
      toast.error("No se pudieron cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const startCustomization = () => {
    router.push(`/onboarding/categories?restaurantId=${restaurantId}`);
  };

  const skipToBackoffice = () => {
    router.push("/backoffice/login");
  };

  const previewMenu = () => {
    if (restaurant?.slug) {
      window.open(`/${restaurant.slug}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-muted-foreground">Preparando tu menú...</p>
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
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMealsByCategory = (categoryId: string) => {
    return meals.filter((meal) => meal.categoryId === categoryId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            ¡Felicidades, {restaurant?.name}! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Tu menú digital está listo
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
            <Sparkles className="w-4 h-4" />
            <span>Ya tienes categorías y productos ejemplo para empezar</span>
          </div>
        </div>

        {/* Success Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-emerald-800">
                {categories.length} Categorías
              </h3>
              <p className="text-sm text-emerald-600">Organizadas y listas</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800">
                {meals.length} Productos
              </h3>
              <p className="text-sm text-blue-600">Listos para personalizar</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-emerald-800">
                Subdominio Único
              </h3>
              <Link
                href={`https://${restaurant?.slug}.viw-carta.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 hover:underline hover:text-emerald-800 hover:font-bold"
              >
                {restaurant?.slug}.viw-carta.com
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Menu Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Vista Previa de tu Menú
            </CardTitle>
            <CardDescription className="text-center">
              Aquí tienes una muestra de cómo se ve tu carta digital
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((category) => {
              const categoryMeals = getMealsByCategory(category._id);
              return (
                <div
                  key={category._id}
                  className="border rounded-lg p-4 bg-white/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {category.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {categoryMeals.length} productos
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryMeals.map((meal) => (
                      <div
                        key={meal._id}
                        className="flex justify-between items-center p-3 bg-white rounded border"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {meal.name}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {meal.description}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          {meal.isTemplate ? (
                            <Badge variant="outline" className="text-xs">
                              Template
                            </Badge>
                          ) : (
                            <span className="font-semibold text-emerald-600">
                              S/. {meal.price}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={previewMenu}
            variant="outline"
            size="lg"
            className="min-w-48"
          >
            <Eye className="w-5 h-5 mr-2" />
            Ver Menú Público
          </Button>

          <Button
            onClick={startCustomization}
            size="lg"
            className="min-w-48 bg-emerald-600 hover:bg-emerald-700"
          >
            <Edit3 className="w-5 h-5 mr-2" />
            Personalizar Menú
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 mb-2">
            ¿Quieres personalizar más tarde?
          </p>
          <Button
            variant="ghost"
            onClick={skipToBackoffice}
            className="text-sm"
          >
            Ir al Panel de Administración
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function OnboardingWelcome() {
  return (
    <Suspense fallback={<OnboardingWelcomeLoading />}>
      <OnboardingWelcomeContent />
    </Suspense>
  );
}
