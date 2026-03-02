"use client";

import React from "react";
import { LanguageProvider } from "@/hooks/useLanguage";
import { CartProvider } from "@/providers/CartProvider";
import RestaurantMenu from "./RestaurantMenu";
import StoreCatalog from "./StoreCatalog";

interface Meal {
  id: string;
  name: string;
  price: number;
  description?: string;
  name_en?: string;
  description_en?: string;
  comparePrice?: number;
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

interface StandardMenuProps {
  data: {
    categories: Category[];
  };
  restaurant: {
    name: string;
    slug: string;
    phone: string;
    direction?: string;
    location?: string;
    description?: string;
    image: string;
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
 * StandardMenu — Template router.
 *
 * Selects the correct public-facing template based on
 * `restaurant.businessType`:
 *   - "restaurant" (default) → RestaurantMenu (hub + card grid + modal)
 *   - "store"                → StoreCatalog   (e-commerce catalog + WhatsApp CTA)
 */
export default function StandardMenu({ data, restaurant }: StandardMenuProps) {
  const Template =
    restaurant.businessType === "store" ? StoreCatalog : RestaurantMenu;

  return (
    <LanguageProvider>
      <CartProvider>
        <Template data={data} restaurant={restaurant} />
      </CartProvider>
    </LanguageProvider>
  );
}
