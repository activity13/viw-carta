"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { COLOR_PALETTES, FONT_PAIRINGS } from "@/utils/colorPalettes";

interface Meal {
  id?: string;
  _id?: string;
  price?: number;
  basePrice?: number;
  [key: string]: unknown;
}

interface Category {
  id?: string;
  _id?: string;
  meals?: Meal[];
  [key: string]: unknown;
}

interface Restaurant {
  subscriptionPlan?: string;
  theme?: {
    palette?: string;
    fontFamily?: string;
    customColors?: {
      primary?: string;
    };
  };
  image?: string;
  name?: string;
  address?: string;
  phone?: string;
  currency?: string;
  [key: string]: unknown;
}

interface PrintMenuProps {
  restaurant: Restaurant;
  categories: Category[];
}

export default function PrintMenu({ restaurant, categories }: PrintMenuProps) {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  // Check subscription (assuming subscriptionPlan could be "premium" based on business validation requirement)
  // If not explicit, we use the fact if they have custom colors or not as a proxy, or pass a prop.
  // We'll treat standard as basic list.
  const isPremium =
    restaurant.subscriptionPlan === "premium" ||
    restaurant.theme?.palette === "custom";

  // --- THEME APPLICATOR ---
  // Get theme config based on restaurant selection or defaults
  const themePalette = COLOR_PALETTES[restaurant.theme?.palette || "classic"];
  const themeFont =
    FONT_PAIRINGS[restaurant.theme?.fontFamily || "sans"] ||
    FONT_PAIRINGS["sans"];

  const primaryColor =
    restaurant.theme?.palette === "custom" && restaurant.theme?.customColors
      ? restaurant.theme.customColors.primary
      : themePalette?.primary || "#000000";

  const fontFamily = themeFont.body;
  const headingFont = themeFont.heading;

  // Trigger print dialog on mount
  useEffect(() => {
    // Small timeout to ensure images/fonts might be loaded
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const t = (key: string, obj: Record<string, unknown>) => {
    if (lang === "en" && obj[`${key}_en`])
      return (obj[`${key}_en`] as string) || (obj[key] as string);
    return obj[key] as string;
  };

  // Logic implies categories ALREADY contain meals (nested structure from API)
  // We filter out empty categories just in case
  const categoriesWithMeals = categories.filter(
    (cat) => cat.meals && cat.meals.length > 0,
  );

  // --- PREMIUM VIEW ---
  if (isPremium) {
    return (
      <div
        className="print-container min-h-screen bg-white text-black p-0 box-border"
        style={
          {
            fontFamily: fontFamily,
          } as React.CSSProperties
        }
      >
        {/* Header Premium: Branding stronger */}
        <header
          className="flex flex-col items-center justify-center p-8 mb-4 border-b-2"
          style={{ borderColor: primaryColor }}
        >
          {restaurant.image ? (
            <div className="relative h-32 w-64 mb-4">
              <Image
                src={restaurant.image}
                alt={restaurant.name || "Restaurant Logo"}
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <h1
              className="text-5xl font-bold uppercase tracking-widest mb-2 text-center"
              style={{
                fontFamily: headingFont,
                color: primaryColor,
              }}
            >
              {restaurant.name}
            </h1>
          )}
          <div className="text-sm font-medium tracking-wider uppercase text-gray-600 flex gap-4">
            <span>{restaurant.address}</span>
            {restaurant.phone && <span>• {restaurant.phone}</span>}
          </div>
        </header>

        {/* Premium Masonry Layout */}
        <div className="print-columns gap-8 px-4">
          {categoriesWithMeals.map((category) => (
            <div
              key={category.id || category._id}
              className="break-inside-avoid mb-8 page-break-avoid"
            >
              <h3
                className="text-2xl font-bold border-b-2 mb-4 pb-1 uppercase tracking-wide"
                style={{
                  fontFamily: headingFont,
                  borderColor: primaryColor,
                  color: primaryColor,
                }}
              >
                {t("name", category)}
              </h3>

              <ul className="space-y-5">
                {category.meals?.map((meal: Meal) => (
                  <li key={meal.id || meal._id} className="flex flex-col">
                    <div className="flex justify-between items-baseline w-full">
                      <span className="font-bold text-lg leading-tight">
                        {t("name", meal)}
                      </span>
                      <div className="whitespace-nowrap font-bold text-lg ml-4">
                        {restaurant.currency || "S/"}{" "}
                        {(typeof meal.price === "number"
                          ? meal.price
                          : typeof meal.basePrice === "number"
                            ? meal.basePrice
                            : 0
                        ).toFixed(2)}
                      </div>
                    </div>
                    {t("description", meal) && (
                      <span className="text-sm text-gray-600 leading-snug mt-1 w-[90%]">
                        {t("description", meal)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <footer className="mt-8 text-center text-xs text-gray-400 p-8 break-inside-avoid">
          Printed with Viw-Carta Premium
        </footer>
        <style jsx global>{`
          @media print {
            @page {
              margin: 1cm;
              size: A4;
            }
            body {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
            }
            .print-container {
              width: 100%;
              max-width: none;
              padding: 0;
              margin: 0;
            }
            nav,
            .fixed,
            button {
              display: none !important;
            }
            .break-inside-avoid {
              break-inside: avoid;
            }
          }
        `}</style>
      </div>
    );
  }

  // --- STANDARD VIEW ---
  return (
    <div
      className="print-container min-h-screen bg-white text-black p-8 max-w-[210mm] mx-auto box-border text-sm"
      style={
        {
          fontFamily: fontFamily,
        } as React.CSSProperties
      }
    >
      {/* Print Header */}
      <header
        className="text-center mb-8 border-b-2 pb-4"
        style={{ borderColor: primaryColor }}
      >
        {restaurant.image ? (
          <div className="relative h-24 w-48 mx-auto mb-2">
            <Image
              src={restaurant.image}
              alt={restaurant.name || "Restaurant Logo"}
              fill
              className="object-contain grayscale"
            />
          </div>
        ) : (
          <h1
            className="text-4xl font-bold uppercase tracking-wider"
            style={{
              fontFamily: headingFont,
              color: primaryColor,
            }}
          >
            {restaurant.name}
          </h1>
        )}
        <p className="text-sm mt-2">
          {restaurant.address} {restaurant.phone && `| ${restaurant.phone}`}
        </p>
        <p className="text-xs mt-1 text-gray-500">
          {lang === "en" ? "Updated on" : "Actualizado al"}{" "}
          {new Date().toLocaleDateString()}
        </p>
      </header>

      {/* Menu Body - Columns */}
      <div className="print-columns gap-6 space-y-6">
        {categoriesWithMeals.map((category) => (
          <div
            key={category.id || category._id}
            className="break-inside-avoid mb-6 page-break-avoid"
          >
            <h3
              className="text-xl font-bold border-b mb-3 uppercase tracking-wide"
              style={{
                fontFamily: headingFont,
                borderColor: primaryColor,
                color: primaryColor,
              }}
            >
              {t("name", category)}
            </h3>

            <ul className="space-y-3">
              {category.meals?.map((meal: Meal) => (
                <li
                  key={meal.id || meal._id}
                  className="flex justify-between items-baseline text-sm"
                >
                  <div className="pr-2">
                    <span className="font-semibold block">
                      {t("name", meal)}
                    </span>
                    {t("description", meal) && (
                      <span className="text-xs text-gray-600 block leading-tight mt-0.5">
                        {t("description", meal)}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-nowrap font-bold text-base">
                    {restaurant.currency || "S/"}{" "}
                    {(typeof meal.price === "number"
                      ? meal.price
                      : typeof meal.basePrice === "number"
                        ? meal.basePrice
                        : 0
                    ).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs border-t pt-4 break-inside-avoid">
        <p>
          {lang === "en"
            ? "Prices include taxes. Scan QR for full menu."
            : "Precios incluyen impuestos. Vea nuestra carta digital escaneando el QR."}
        </p>
        <div className="mt-2 text-[10px] text-gray-400">
          Generado por Viw-Carta
        </div>
      </footer>

      <style jsx global>{`
        @media print {
          @page {
            margin: 5mm;
            size: A4;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
          }
          .print-container {
            width: 100%;
            max-width: none;
            padding: 0;
            margin: 0;
          }

          /* Enforce 2 columns for print, regardless of viewport width */
          .print-columns {
            column-count: 2 !important;
            display: block !important;
          }

          /* Hide everything else if it exists on global scope */
          nav,
          .fixed,
          button {
            display: none !important;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }

        /* Screen preview styles (responsive) */
        @media screen {
          .print-columns {
            column-count: 1;
          }
          @media (min-width: 768px) {
            .print-columns {
              column-count: 2;
            }
          }
        }
      `}</style>
    </div>
  );
}
