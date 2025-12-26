"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import LanguageToggle from "@/components/LanguageToggle";
import {
  applyRestaurantTheme,
  getDefaultTheme,
  type RestaurantTheme as ThemeConfig,
} from "@/utils/colorPalettes";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Utensils,
  MapPin,
  Facebook,
  Instagram,
  Globe,
  BellRing,
  ShoppingBag,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/providers/CartProvider";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { OrderFloatingButton } from "@/components/cart/OrderFloatingButton";

// Interfaces
interface Meal {
  id: string;
  name: string;
  price: number;
  description?: string;
  name_en?: string;
  description_en?: string;
  images?: { url: string; alt: string }[];
}

interface Category {
  id: string;
  name: string;
  meals: Meal[];
  description?: string;
  name_en?: string;
  description_en?: string;
}

interface RestaurantTheme {
  palette?: string;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    muted?: string;
  };
  // Legacy fields
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  coverImageUrl?: string;
}

interface StandardMenuProps {
  data: {
    categories: Category[];
  };
  restaurant: {
    name: string;
    slug: string;
    phone: string;
    direction?: string;
    location?: string; // Google Maps URL
    description?: string;
    image: string;
    theme?: RestaurantTheme;
  };
}

function StandardMenuContent({ data, restaurant }: StandardMenuProps) {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  const theme = restaurant.theme || {};

  // Apply restaurant theme on mount
  useEffect(() => {
    console.log(restaurant);
    if (theme.palette) {
      const restaurantTheme: ThemeConfig = {
        palette: theme.palette,
        customColors: theme.customColors,
      };
      applyRestaurantTheme(restaurantTheme);
    } else {
      applyRestaurantTheme(getDefaultTheme());
    }

    return () => {
      const existingTheme = document.getElementById("restaurant-theme");
      if (existingTheme) {
        existingTheme.remove();
      }
    };
  }, [theme]);

  // Scroll spy for active category
  useEffect(() => {
    const handleScroll = () => {
      const sections = data.categories.map((cat) =>
        document.getElementById(`cat-${cat.id}`)
      );

      const scrollPosition = window.scrollY + 150; // Offset

      for (const section of sections) {
        if (
          section &&
          section.offsetTop <= scrollPosition &&
          section.offsetTop + section.offsetHeight > scrollPosition
        ) {
          setActiveCategory(section.id.replace("cat-", ""));
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data.categories]);

  const scrollToCategory = (id: string) => {
    const element = document.getElementById(`cat-${id}`);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveCategory(id);
      setIsMobileMenuOpen(false);
    }
  };

  // Legacy theme support
  const primaryColor = theme.primaryColor || "var(--primary)";
  const backgroundColor = theme.backgroundColor || "var(--background)";
  const fontFamily = "var(--font-body, sans-serif)";

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{
        fontFamily: fontFamily,
        ...(theme.backgroundColor && { backgroundColor }),
        ...(theme.primaryColor && { color: primaryColor }),
      }}
    >
      {/* Header / Cover */}
      <header className="relative h-48 md:h-72 w-full overflow-hidden shrink-0">
        {theme.coverImageUrl ? (
          <Image
            src={theme.coverImageUrl}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Utensils className="w-16 h-16 text-muted-foreground opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30" />

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 bg-linear-to-t from-black/80 to-transparent text-white">
          <div className="container mx-auto flex items-end gap-4 md:gap-6">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-background bg-background overflow-hidden shadow-lg shrink-0 relative -mb-8 md:-mb-12 z-10">
              {restaurant.image ? (
                <Image
                  src={`/${restaurant.slug}/images/${restaurant.image}`}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
                  {restaurant.name.substring(0, 2)}
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl md:text-4xl font-bold shadow-sm">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="text-sm md:text-base opacity-90 line-clamp-2 max-w-2xl">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3 relative">
            <div className="sticky top-24 space-y-6">
              <div className="bg-card rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                  <MenuIcon className="w-5 h-5" />
                  {language === "en" ? "Menu" : "Menú"}
                </h3>
                <nav className="space-y-1">
                  {data.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        activeCategory === category.id
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(category.name, category.name_en)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full gap-2" size="lg">
                  <BellRing className="w-4 h-4" />
                  {language === "en" ? "Call Waiter" : "Llamar al Mozo"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {language === "en" ? "Order Online" : "Pedir Online"}
                </Button>
              </div>
            </div>
          </aside>

          {/* Mobile Category Bar */}
          <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b -mx-4 px-4 py-3 flex items-center justify-between gap-4 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <MenuIcon className="w-5 h-5 mr-2" />
              {language === "en" ? "Categories" : "Categorías"}
            </Button>
            <div className="flex gap-2">
              <LanguageToggle />
            </div>
          </div>

          {/* Mobile Menu Drawer */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-background p-6 shadow-xl animate-in slide-in-from-left">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-xl">{restaurant.name}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <nav className="space-y-2">
                  {data.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg transition-colors",
                        activeCategory === category.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      )}
                    >
                      {t(category.name, category.name_en)}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Menu Content */}
          <main className="lg:col-span-9 space-y-12 pt-4 lg:pt-0">
            {data.categories.map((category) => (
              <section
                key={category.id}
                id={`cat-${category.id}`}
                className="scroll-mt-24"
              >
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-primary">
                    {t(category.name, category.name_en)}
                  </h2>
                  <div className="h-px bg-border flex-1" />
                </div>

                {category.description && (
                  <p className="text-muted-foreground mb-6 italic">
                    {t(category.description, category.description_en)}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="group bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      {meal.images && meal.images.length > 0 && (
                        <div className="relative h-48 w-full overflow-hidden">
                          <Image
                            src={meal.images[0].url}
                            alt={meal.images[0].alt || meal.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-bold text-lg leading-tight">
                            {t(meal.name, meal.name_en)}
                          </h3>
                          <span className="font-bold text-primary whitespace-nowrap bg-primary/10 px-2 py-1 rounded text-sm">
                            S/ {meal.price.toFixed(2)}
                          </span>
                        </div>
                        {t(meal.description, meal.description_en) && (
                          <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
                            {t(meal.description, meal.description_en)}
                          </p>
                        )}
                        <AddToCartButton
                          meal={meal}
                          className="w-full mt-auto"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h4 className="font-bold text-lg mb-4">{restaurant.name}</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto md:mx-0">
                {restaurant.description || "La mejor experiencia gastronómica."}
              </p>
            </div>

            <div className="flex flex-col items-center md:items-start gap-3">
              <h4 className="font-bold text-lg mb-2">Contacto</h4>
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4" />
                {restaurant.phone}
              </a>
              {restaurant.direction && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{restaurant.direction}</span>
                </div>
              )}
              {restaurant.location && (
                <a
                  href={restaurant.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Ver en Mapa
                </a>
              )}
            </div>

            <div className="flex flex-col items-center md:items-start gap-3">
              <h4 className="font-bold text-lg mb-2">Síguenos</h4>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Instagram className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {restaurant.name}. Powered by Viw
              Carta.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button (Mobile) */}
      {/* <div className="fixed bottom-6 right-6 z-50 lg:hidden flex flex-col gap-3">
        <Button size="icon" className="rounded-full shadow-lg h-12 w-12">
          <BellRing className="w-5 h-5" />
        </Button>
      </div> */}
      <OrderFloatingButton restaurantPhone={restaurant.phone} />
    </div>
  );
}

export default function StandardMenu(props: StandardMenuProps) {
  return (
    <LanguageProvider>
      <CartProvider>
        <StandardMenuContent {...props} />
      </CartProvider>
    </LanguageProvider>
  );
}
