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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-100">
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
    router.push("/backoffice");
  };

  const previewMenu = () => {
    if (restaurant?.slug) {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const rootDomain = host.replace("app.", "");
      window.open(`${protocol}//${restaurant.slug}.${rootDomain}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-green-100">
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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-rose-100">
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
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-green-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-linear-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
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
            <span>
              Ya tienes categorías y productos ejemplo que hemos creado para ti.
              Sigue a continuación y personalízalos a tu gusto.
            </span>
          </div>
        </div>

        {/* Success Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-800 mb-1">
                {categories.length}
              </h3>
              <p className="text-sm font-medium text-emerald-700">Categorías</p>
              <p className="text-xs text-emerald-600 mt-1">
                Organizadas y listas
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-800 mb-1">
                {meals.length}
              </h3>
              <p className="text-sm font-medium text-blue-700">Productos</p>
              <p className="text-xs text-blue-600 mt-1">Listos para editar</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-purple-800 mb-1 break-all">
                {restaurant?.slug}
              </h3>
              <p className="text-sm font-medium text-purple-700">
                Tu subdominio
              </p>
              <p className="text-xs text-purple-600 mt-1">.viw-carta.com</p>
            </CardContent>
          </Card>
        </div>

        {/* What's Next Section */}
        <Card className="mb-10 border-emerald-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">¿Qué sigue ahora?</CardTitle>
            <CardDescription className="text-base">
              Elige cómo quieres continuar con tu menú digital
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Customize */}
              <div className="border-2 border-emerald-200 rounded-lg p-6 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Edit3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Personalizar tu menú
                    </h3>
                    <p className="text-sm text-black mb-4">
                      Edita las categorías y productos de ejemplo para que
                      reflejen tu carta real. Es rápido y fácil.
                    </p>
                    <Button
                      onClick={startCustomization}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      Empezar ahora
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Option 2: Preview */}
              <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50/30 hover:bg-blue-50/60 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Ver menú público
                    </h3>
                    <p className="text-sm text-black mb-4">
                      Mira cómo se ve tu menú digital tal como lo verán tus
                      clientes en sus dispositivos.
                    </p>
                    <Button
                      onClick={previewMenu}
                      variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Abrir vista previa
                      <Eye className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skip Option */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">
            ¿Prefieres configurar todo más tarde?
          </p>
          <Button
            variant="ghost"
            onClick={skipToBackoffice}
            className="text-sm hover:bg-emerald-50"
          >
            Ir directamente al Panel de Administración
            <ArrowRight className="w-4 h-4 ml-2" />
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
