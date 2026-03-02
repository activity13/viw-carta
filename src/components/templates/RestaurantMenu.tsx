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
  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* Logo */}
      <div className="w-28 h-28 rounded-full border-4 border-primary/20 overflow-hidden bg-muted shadow-lg mb-6 relative">
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
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
        )}
      </div>

      {/* Name & description */}
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        {restaurant.name}
      </h1>
      {restaurant.description && (
        <p className="text-muted-foreground max-w-sm text-sm leading-relaxed mb-8">
          {restaurant.description.trim()}
        </p>
      )}

      {/* Category grid */}
      <div className="w-full max-w-sm space-y-3 mb-10">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onStart(cat.id)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all group shadow-sm"
          >
            <div className="text-left">
              <span className="font-semibold text-base">
                {t(cat.name, cat.name_en)}
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {cat.meals.length} {language === "en" ? "items" : "productos"}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      {/* See all */}
      <Button size="lg" onClick={() => onStart()} className="rounded-full px-8">
        {language === "en" ? "View Full Menu" : "Ver menú completo"}
      </Button>

      {/* Footer mini */}
      <div className="mt-12 flex flex-col gap-2 items-center text-xs text-muted-foreground">
        <a
          href={`tel:${restaurant.phone}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Phone className="w-3 h-3" />
          {restaurant.phone}
        </a>
        {restaurant.direction && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {restaurant.direction}
          </span>
        )}
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
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
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

        {/* Category nav pills */}
        <div
          ref={navRef}
          className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide max-w-4xl mx-auto"
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-14">
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
                            OFERTA
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

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-10 px-4 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 justify-between items-start text-sm text-muted-foreground">
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
                Ver en Mapa
              </a>
            )}
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
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
