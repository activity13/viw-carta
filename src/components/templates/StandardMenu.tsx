"use client";

import React, { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import { CartProvider } from "@/providers/CartProvider";
import HubScreen from "./HubScreen";
import RestaurantMenu from "./RestaurantMenu";
import StoreCatalog from "./StoreCatalog";
import { generateThemeCSS } from "@/utils/colorPalettes";

interface Meal {
  id: string;
  name: string;
  price: number;
  description?: string;
  name_en?: string;
  description_en?: string;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
}

interface Category {
  id: string;
  name: string;
  meals: Meal[];
  description?: string;
  name_en?: string;
  description_en?: string;
}

interface StandardMenuProps {
  data: {
    categories: Category[];
  };
  restaurant: {
    name: string;
    slug: string;
    phone?: string;
    direction?: string;
    location?: string;
    description?: string;
    image?: string;
    businessType?: "restaurant" | "store";
    theme?: {
      palette?: string;
      customColors?: Record<string, string>;
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      fontFamily?: string;
      logoUrl?: string;
      coverImageUrl?: string;
    };
  };
}

/**
 * StandardMenu — Universal template orchestrator.
 *
 * Flow:
 *   1. HubScreen (universal landing for ALL business types and plans)
 *   2. On "start" → routes to the correct catalog view:
 *        - "restaurant" → RestaurantMenu (scroll menu with categories)
 *        - "store"      → StoreCatalog   (e-commerce grid + WhatsApp CTA)
 */
export default function StandardMenu({ data, restaurant }: StandardMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Renderiza el CSS incrustado para prevenir el "flash de estilos"
  const themeCSS = generateThemeCSS({
    palette: restaurant.theme?.palette || "classic",
    customColors: restaurant.theme?.customColors,
  });

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
        {/* El CSS se inyecta desde aquí para que aplique desde el SSR */}
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

        {/* Loader elegante y moderno */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#059669] animate-spin border-opacity-80"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-[#059669] rounded-full animate-pulse"></div>
          </div>
          <p className="mt-6 text-sm font-medium text-gray-500 tracking-widest uppercase animate-pulse">
            Configurando tu experiencia...
          </p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <CartProvider>
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
        <StandardMenuInner data={data} restaurant={restaurant} />
      </CartProvider>
    </LanguageProvider>
  );
}

// ─── Inner component (needs LanguageProvider context) ────────────────────────
function StandardMenuInner({ data, restaurant }: StandardMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string | undefined>();

  if (!showMenu) {
    return (
      <HubScreen
        restaurant={restaurant}
        categories={data.categories}
        onStart={(categoryId) => {
          setInitialCategory(categoryId);
          setShowMenu(true);
        }}
      />
    );
  }

  const Template =
    restaurant.businessType === "store" ? StoreCatalog : RestaurantMenu;

  return (
    <Template
      data={data}
      restaurant={restaurant}
      initialCategory={initialCategory}
      onBack={() => {
        setShowMenu(false);
        setInitialCategory(undefined);
        window.scrollTo({ top: 0 });
      }}
    />
  );
}
