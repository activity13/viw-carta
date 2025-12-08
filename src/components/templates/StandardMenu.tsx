"use client";

import React from "react";

import Image from "next/image";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import LanguageToggle from "@/components/LanguageToggle";

// Interfaces (should ideally be shared)
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
    phone: string;
    theme?: RestaurantTheme;
  };
}

function StandardMenuContent({ data, restaurant }: StandardMenuProps) {
  const { language } = useLanguage();
  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  const theme = restaurant.theme || {};
  const primaryColor = theme.primaryColor || "#000000";
  // const secondaryColor = theme.secondaryColor || "#ffffff";
  const backgroundColor = theme.backgroundColor || "#f8f9fa";
  const fontFamily = theme.fontFamily || "sans-serif";

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        backgroundColor: backgroundColor,
        fontFamily: fontFamily,
        color: primaryColor,
      }}
    >
      {/* Language Toggle */}
      <div className="fixed bottom-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Header / Cover */}
      <header className="relative h-48 md:h-64 w-full overflow-hidden">
        {theme.coverImageUrl ? (
          <Image
            src={theme.coverImageUrl}
            alt={restaurant.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <span className="text-2xl font-bold opacity-20">
              {restaurant.name}
            </span>
          </div>
        )}

        {/* Logo Overlay */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg flex items-center justify-center">
            {theme.logoUrl ? (
              <Image
                src={theme.logoUrl}
                alt="Logo"
                width={96}
                height={96}
                className="object-cover"
              />
            ) : (
              <span className="text-xl font-bold">
                {restaurant.name.substring(0, 2)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Restaurant Info */}
      <div className="mt-12 text-center px-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          {restaurant.name}
        </h1>
      </div>

      {/* Menu Categories */}
      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-12">
        {data.categories.map((category) => (
          <section key={category.id} id={`cat-${category.id}`}>
            <h2
              className="text-xl font-bold mb-6 border-b-2 pb-2 uppercase text-center"
              style={{ borderColor: primaryColor }}
            >
              {t(category.name, category.name_en)}
            </h2>

            <div className="space-y-6">
              {category.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex justify-between items-start gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg leading-tight">
                      {t(meal.name, meal.name_en)}
                    </h3>
                    {t(meal.description, meal.description_en) && (
                      <p className="text-sm opacity-80 mt-1">
                        {t(meal.description, meal.description_en)}
                      </p>
                    )}
                  </div>
                  <div className="font-bold whitespace-nowrap">
                    S/ {meal.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function StandardMenu(props: StandardMenuProps) {
  return (
    <LanguageProvider>
      <StandardMenuContent {...props} />
    </LanguageProvider>
  );
}
