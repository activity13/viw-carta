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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md bg-card border-border">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground font-mono">Preparando tu menú...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-destructive/20 bg-card">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-mono">{error}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4 border-primary text-primary hover:bg-primary/10"
            >
              Volver al inicio
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
          <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 font-roboto tracking-widest">
            ¡Felicidades, {restaurant?.name}! 🎉
          </h1>
          <p className="text-xl text-muted-foreground mb-2 font-mono uppercase">
            Tu menú digital está listo
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-primary/80 font-mono">
            <Sparkles className="w-4 h-4" />
            <span>
              Configuración inicial completada.
            </span>
          </div>
        </div>

        {/* Success Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-mono">
          <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <CheckCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {categories.length}
              </h3>
              <p className="text-xs font-medium text-muted-foreground uppercase">Categorías</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <CheckCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {meals.length}
              </h3>
              <p className="text-xs font-medium text-muted-foreground uppercase">Productos</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <CheckCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 break-all">
                {restaurant?.slug}
              </h3>
              <p className="text-xs font-medium text-muted-foreground uppercase">Subdominio</p>
            </CardContent>
          </Card>
        </div>

        {/* What's Next Section */}
        <Card className="mb-10 border-border bg-card shadow-xl">
          <CardHeader className="text-center pb-4 border-b border-border mb-6">
            <CardTitle className="text-2xl font-roboto tracking-widest text-primary">¿Siguiente paso?</CardTitle>
            <CardDescription className="text-base text-muted-foreground font-mono">
              Personaliza tu terminal de venta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Customize */}
              <div className="border border-border rounded-lg p-6 bg-background hover:border-primary/50 transition-colors group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-black transition-colors">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2 font-roboto uppercase">
                      Personalizar carta
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 font-mono">
                      Ajusta categorías y productos para reflejar tu inventario real.
                    </p>
                    <Button
                      onClick={startCustomization}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-mono"
                    >
                      ACCEDER EDITOR
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Option 2: Preview */}
              <div className="border border-border rounded-lg p-6 bg-background hover:border-primary/50 transition-colors group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-black transition-colors">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2 font-roboto uppercase">
                      Vista pública
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 font-mono">
                      Inspecciona la interfaz que verán tus clientes finales.
                    </p>
                    <Button
                      onClick={previewMenu}
                      variant="outline"
                      className="w-full border-primary/50 text-primary hover:bg-primary/10 rounded-none font-mono"
                    >
                      ABRIR PREVIEW
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
          <Button
            variant="ghost"
            onClick={skipToBackoffice}
            className="text-xs hover:text-primary hover:bg-primary/5 font-mono text-muted-foreground uppercase tracking-widest"
          >
            SALTAR AL PANEL DE CONTROL
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
