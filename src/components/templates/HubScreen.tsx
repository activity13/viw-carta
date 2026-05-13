"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Globe, ChefHat, Store, ArrowRight } from "lucide-react";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface HubCategory {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  meals: { id: string }[];
}

interface HubRestaurantInfo {
  name: string;
  slug: string;
  phone?: string;
  direction?: string;
  location?: string;
  description?: string;
  image?: string;
  businessType?: "restaurant" | "store";
}

interface HubScreenProps {
  restaurant: HubRestaurantInfo;
  categories: HubCategory[];
  onStart: (categoryId?: string) => void;
}

export type { HubCategory, HubRestaurantInfo, HubScreenProps };

// ─── HubScreen ─────────────────────────────────────────────────────────────────
/**
 * Universal landing screen for all Viw-Carta businesses.
 * Adapts icons and copy based on `restaurant.businessType`.
 * Used by both standard and premium plans as the entry point.
 */
export default function HubScreen({
  restaurant,
  categories,
  onStart,
}: HubScreenProps) {
  const { language, toggleLanguage } = useLanguage();
  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  const isStore = restaurant.businessType === "store";
  const BrandIcon = isStore ? Store : ChefHat;

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
              <BrandIcon className="w-12 h-12 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase text-center">
            {restaurant.name}
          </h1>
        </div>

        {/* 2. Banners Promocionales 2:1 */}
        <div className="w-full flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none mb-8 -mx-4 px-4 pb-2">
          {/* Banner Negocio */}
          <div className="snap-center shrink-0 w-[85%] aspect-2/1 rounded-3xl bg-linear-to-br from-primary/90 to-primary text-primary-foreground p-5 flex flex-col justify-end relative overflow-hidden shadow-lg shadow-primary/20">
            <div className="absolute inset-0 bg-black/5" />
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <BrandIcon className="w-20 h-20" />
            </div>
            <div className="relative z-10">
              <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2">
                {language === "en" ? "New" : "Novedad"}
              </span>
              <h3 className="font-bold text-xl leading-tight mb-1">
                {language === "en" ? "Welcome to" : "¡Bienvenido a"}{" "}
                {restaurant.name}!
              </h3>
              <p className="text-xs text-primary-foreground/90 line-clamp-1">
                {restaurant.description ||
                  (language === "en"
                    ? isStore
                      ? "Discover our best products"
                      : "Discover our best dishes"
                    : isStore
                      ? "Descubre nuestros mejores productos"
                      : "Descubre nuestros mejores platillos")}
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
                {language === "en"
                  ? isStore
                    ? "Digitize your business today."
                    : "Digitize your restaurant today."
                  : isStore
                    ? "Digitaliza tu negocio hoy."
                    : "Digitaliza tu restaurante hoy."}
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
              className="flex flex-row items-center p-4 rounded-3xl bg-card border border-primary/10 shadow-sm hover:shadow-md hover:border-primary/40 transition-all active:scale-95 text-center group"
            >
              <span className="font-bold text-lg leading-tight text-foreground w-full group-hover:text-primary transition-colors">
                {t(cat.name, cat.name_en)}
              </span>
              <div className="flex items-center justify-center  mt-auto">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <ArrowRight className="w-3 h-3 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Main action: CTA adaptado al tipo de negocio */}
        <Button
          onClick={() => onStart()}
          className="w-full h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 mb-6"
        >
          {language === "en"
            ? isStore
              ? "View Full Catalog"
              : "View Full Menu"
            : isStore
              ? "Ver catálogo completo"
              : "Ver menú completo"}
        </Button>
      </div>

      {/* 4. Bottom Navigation Bar */}
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
              ES / EN
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
