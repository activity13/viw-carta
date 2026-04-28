"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageToggle from "@/components/LanguageToggle";
import { applyRestaurantTheme, getDefaultTheme } from "@/utils/colorPalettes";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Globe, ChefHat, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { OrderFloatingButton } from "@/components/cart/OrderFloatingButton";
import { MealDetailModal } from "./MealDetailModal";

interface Meal {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
}

interface Category {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  meals: Meal[];
}

interface RestaurantMenuProps {
  data: { categories: Category[] };
  restaurant: {
    name: string;
    slug: string;
    phone: string;
    direction?: string;
    location?: string;
    description?: string;
    image: string;
    theme?: {
      palette?: string;
      customColors?: Record<string, string>;
      primaryColor?: string;
      backgroundColor?: string;
    };
  };
}

// ─── Hub screen ────────────────────────────────────────────────────────────────
function HubScreen({
  restaurant,
  categories,
  language,
  onStart,
}: {
  restaurant: RestaurantMenuProps["restaurant"];
  categories: Category[];
  language: string;
  onStart: (categoryId?: string) => void;
}) {
  const { toggleLanguage } = useLanguage();
  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  return (
    <div className="min-h-dvh bg-background flex flex-col pb-24">
      <div className="flex-1 flex flex-col px-4 pt-10 max-w-md mx-auto w-full">
        {/* 1. Header: Logo centrado y nombre */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 rounded-full border-4 border-primary/10 overflow-hidden bg-card shadow-sm mb-4 relative flex items-center justify-center">
            {restaurant.image ? (
              <Image
                src={
                  restaurant.image.startsWith("http")
                    ? restaurant.image
                    : `/${restaurant.slug}/images/${restaurant.image}`
                }
                alt={restaurant.name}
                fill
                className="object-contain p-2"
                unoptimized
              />
            ) : (
              <ChefHat className="w-12 h-12 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase text-center">
            {restaurant.name}
          </h1>
        </div>

        {/* 2. Banners Promocionales 2:1 */}
        <div className="w-full flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none mb-8 -mx-4 px-4 pb-2">
          {/* Banner Negocio (Placeholder) */}
          <div className="snap-center shrink-0 w-[85%] aspect-2/1 rounded-3xl bg-linear-to-br from-primary/90 to-primary text-primary-foreground p-5 flex flex-col justify-end relative overflow-hidden shadow-lg shadow-primary/20">
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <ChefHat className="w-20 h-20" />
            </div>
            <div className="relative z-10">
              <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2">
                {language === "en" ? "New" : "Novedad"}
              </span>
              <h3 className="font-bold text-xl leading-tight mb-1">
                {language === "en" ? "Welcome to" : "¡Bienvenido a"} {restaurant.name}!
              </h3>
              <p className="text-xs text-primary-foreground/90 line-clamp-1">
                {language === "en" && false // Optional: If we had restaurant.description_en we'd use it, for now generic
                  ? "Discover our best dishes"
                  : restaurant.description || (language === "en" ? "Discover our best dishes" : "Descubre nuestros mejores platillos")}
              </p>
            </div>
          </div>

          {/* Banner Viw-Carta */}
          <a
            href="https://viw-carta.com"
            target="_blank"
            rel="noopener noreferrer"
            className="snap-center shrink-0 w-[85%] aspect-2/1 rounded-3xl bg-linear-to-br from-zinc-900 to-black text-white p-5 flex flex-col justify-end relative overflow-hidden shadow-lg group"
          >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe className="w-20 h-20" />
            </div>
            <div className="relative z-10">
              <span className="inline-block px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2">
                Powered By
              </span>
              <h3 className="font-bold text-xl leading-tight text-[#70d8c8] mb-1">
                Viw-Carta
              </h3>
              <p className="text-xs text-zinc-400">
                {language === "en" ? "Digitize your restaurant today." : "Digitaliza tu restaurante hoy."}
              </p>
            </div>
          </a>
        </div>

        {/* 3. Tarjetas de Categorías (2 Columnas) */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onStart(cat.id)}
              className="flex flex-col items-start p-4 rounded-3xl bg-card border border-primary/10 shadow-sm hover:shadow-md hover:border-primary/40 transition-all active:scale-95 text-left group"
            >
              <span className="font-bold text-sm leading-tight text-foreground mb-3 line-clamp-2 w-full group-hover:text-primary transition-colors">
                {t(cat.name, cat.name_en)}
              </span>
              <div className="flex items-center justify-between w-full mt-auto">
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {cat.meals.length} {language === "en" ? "items" : "prods"}
                </span>
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <ArrowRight className="w-3 h-3 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Main action: Ver menú completo */}
        <Button
          onClick={() => onStart()}
          className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 mb-6"
        >
          {language === "en" ? "View Full Menu" : "Ver menú completo"}
        </Button>
      </div>

      {/* 4. Bottom Navigation Bar (Instagram style) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50">
        <div className="max-w-md mx-auto flex items-center justify-around h-[72px] px-2 pb-1">
          {/* Llamar */}
          <a
            href={`tel:${restaurant.phone}`}
            className="flex flex-col items-center justify-center w-20 h-full gap-1.5 text-muted-foreground hover:text-primary transition-colors active:scale-95"
          >
            <Phone className="w-6 h-6" />
            <span className="text-[10px] font-semibold tracking-wide">
              {language === "en" ? "Call" : "Llamar"}
            </span>
          </a>

          {/* Ubicación */}
          {restaurant.location ? (
            <a
              href={restaurant.location}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center w-20 h-full gap-1.5 text-muted-foreground hover:text-primary transition-colors active:scale-95"
            >
              <MapPin className="w-6 h-6" />
              <span className="text-[10px] font-semibold tracking-wide">
                {language === "en" ? "Location" : "Ubicación"}
              </span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center w-20 h-full gap-1.5 text-muted-foreground opacity-40">
              <MapPin className="w-6 h-6" />
              <span className="text-[10px] font-semibold tracking-wide">
                {language === "en" ? "Location" : "Ubicación"}
              </span>
            </div>
          )}

          {/* Idioma Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex flex-col items-center justify-center w-20 h-full gap-1.5 text-muted-foreground hover:text-primary transition-colors active:scale-95"
          >
            <Globe className="w-6 h-6" />
            <span className="text-[10px] font-semibold tracking-wide uppercase">
              {language === "en" ? "ES / EN" : "ES / EN"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Menu screen ───────────────────────────────────────────────────────────────
function MenuScreen({
  restaurant,
  categories,
  initialCategory,
  language,
  onBack,
}: {
  restaurant: RestaurantMenuProps["restaurant"];
  categories: Category[];
  initialCategory?: string;
  language: string;
  onBack: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState(
    initialCategory || categories[0]?.id || "",
  );
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const offset = 140;
      for (const cat of categories) {
        const el = document.getElementById(`cat-${cat.id}`);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= offset && top + el.offsetHeight > offset) {
            setActiveCategory(cat.id);
            // Scroll nav pill into view
            const pill = document.getElementById(`nav-${cat.id}`);
            pill?.scrollIntoView({
              inline: "center",
              behavior: "smooth",
              block: "nearest",
            });
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  // Scroll to initial category on mount
  useEffect(() => {
    if (initialCategory) {
      setTimeout(() => {
        const el = document.getElementById(`cat-${initialCategory}`);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 110;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 100);
    }
  }, [initialCategory]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveCategory(id);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 max-w-6xl mx-auto w-full">
          {/* Logo small */}
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border relative"
          >
            {restaurant.image ? (
              <Image
                src={
                  restaurant.image.startsWith("http")
                    ? restaurant.image
                    : `/${restaurant.slug}/images/${restaurant.image}`
                }
                alt={restaurant.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-primary" />
              </div>
            )}
          </button>
          <span className="font-semibold text-sm truncate flex-1">
            {restaurant.name}
          </span>
          <LanguageToggle />
        </div>

        {/* Category nav pills (Mobile Only) */}
        <div
          ref={navRef}
          className="md:hidden flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none max-w-6xl mx-auto w-full"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`nav-${cat.id}`}
              onClick={() => scrollTo(cat.id)}
              className={cn(
                "shrink-0 text-xs font-medium px-4 py-1.5 rounded-full border transition-all whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {t(cat.name, cat.name_en)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row relative">
        {/* Sidebar Categorías (Desktop Only) */}
        <aside className="hidden md:block w-64 shrink-0 py-8 pr-6 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto z-30 scrollbar-hide">
          <nav className="flex flex-col gap-1.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
              {language === "en" ? "Categories" : "Categorías"}
            </h3>
            {categories.map((cat) => (
              <button
                key={`side-${cat.id}`}
                onClick={() => scrollTo(cat.id)}
                className={cn(
                  "text-left text-sm font-medium px-4 py-2.5 rounded-xl transition-all truncate",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {t(cat.name, cat.name_en)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 py-8 md:py-10 space-y-14 md:border-l md:pl-8 lg:pl-12">
          {categories.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
              {/* Category header */}
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold text-primary">
                  {t(cat.name, cat.name_en)}
                </h2>
                <div className="h-px bg-border flex-1" />
                <span className="text-xs text-muted-foreground shrink-0">
                  {cat.meals.length} {language === "en" ? "items" : "items"}
                </span>
              </div>

              {cat.description && (
                <p className="text-sm text-muted-foreground italic mb-5">
                  {t(cat.description, cat.description_en)}
                </p>
              )}

              {/* Meals grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.meals.map((meal) => {
                  const mealName = t(meal.name, meal.name_en);
                  const mealDesc = t(meal.description, meal.description_en);
                  const hasDiscount =
                    meal.comparePrice && meal.comparePrice > meal.price;

                  return (
                    <div
                      key={meal.id}
                      onClick={() => setSelectedMeal(meal)}
                      className="group relative bg-card rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      {/* Image */}
                      {meal.images && meal.images.length > 0 ? (
                        <div className="relative h-44 w-full overflow-hidden">
                          <Image
                            src={meal.images[0].url}
                            alt={meal.images[0].alt || mealName}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                          {hasDiscount && (
                            <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {language === "en" ? "SALE" : "OFERTA"}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-44 bg-muted/50 flex items-center justify-center">
                          <ChefHat className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
                            {mealName}
                          </h3>
                          <div className="shrink-0 text-right">
                            <div className="font-bold text-primary text-sm">
                              S/ {meal.price.toFixed(2)}
                            </div>
                            {hasDiscount && (
                              <div className="text-[11px] text-muted-foreground line-through">
                                S/ {meal.comparePrice!.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>

                        {mealDesc && mealDesc.trim() && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
                            {mealDesc.trim()}
                          </p>
                        )}

                        <AddToCartButton
                          meal={meal}
                          className="w-full mt-auto text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-10 px-4 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 justify-between items-start text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">
              {restaurant.name}
            </p>
            {restaurant.description && (
              <p className="text-xs max-w-xs">
                {restaurant.description.trim()}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4" />
              {restaurant.phone}
            </a>
            {restaurant.direction && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{restaurant.direction}</span>
              </div>
            )}
            {restaurant.location && (
              <a
                href={restaurant.location}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Globe className="w-4 h-4" />
                {language === "en" ? "View on Map" : "Ver en Mapa"}
              </a>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {restaurant.name}. Powered by{" "}
          <span className="text-primary font-semibold">Viw Carta</span>
        </div>
      </footer>

      {/* Floating cart */}
      <OrderFloatingButton restaurantPhone={restaurant.phone} />

      {/* Meal detail modal */}
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          language={language}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </div>
  );
}

// ─── Root component ─────────────────────────────────────────────────────────
export default function RestaurantMenu({
  data,
  restaurant,
}: RestaurantMenuProps) {
  const { language } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string | undefined>();

  const theme = restaurant.theme || {};

  useEffect(() => {
    if (theme.palette) {
      applyRestaurantTheme({
        palette: theme.palette,
        customColors: theme.customColors as Record<string, string> | undefined,
      });
    } else {
      applyRestaurantTheme(getDefaultTheme());
    }
    return () => {
      document.getElementById("restaurant-theme")?.remove();
    };
  }, [theme]);

  if (!showMenu) {
    return (
      <HubScreen
        restaurant={restaurant}
        categories={data.categories}
        language={language}
        onStart={(catId) => {
          setInitialCategory(catId);
          setShowMenu(true);
        }}
      />
    );
  }

  return (
    <MenuScreen
      restaurant={restaurant}
      categories={data.categories}
      initialCategory={initialCategory}
      language={language}
      onBack={() => setShowMenu(false)}
    />
  );
}
