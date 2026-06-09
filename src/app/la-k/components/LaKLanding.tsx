"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import { Phone, MapPin, Navigation, Utensils, Pizza, Globe } from "lucide-react";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface LaKRestaurantInfo {
  name: string;
  slug: string;
  phone?: string;
  direction?: string;
  location?: string;
  description?: string;
  image?: string;
}

interface LaKLandingProps {
  restaurant: LaKRestaurantInfo;
  onNavigate: (menu: "principal" | "pizzas") => void;
  isEmbedded?: boolean;
}

// ─── LaKLanding ────────────────────────────────────────────────────────────────

export default function LaKLanding({ restaurant, onNavigate, isEmbedded = false }: LaKLandingProps) {
  const { language, toggleLanguage } = useLanguage();

  const phoneNumber = (restaurant.phone || "").replace(/\s+/g, "").trim();

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center relative overflow-hidden px-6 py-12">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Language toggle - top right */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 flex items-center gap-2 px-3 py-2 rounded-full border border-black/10 text-black/50 hover:text-black hover:border-black/30 transition-all duration-300 text-xs font-medium tracking-wider uppercase z-10"
      >
        <Globe className="w-3.5 h-3.5" />
        {language === "en" ? "ES" : "EN"}
      </button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full animate-[fadeInUp_0.8s_ease-out]">
        {/* Logo */}
        <div className="w-40 h-40 sm:w-48 sm:h-48 relative mb-6">
          {restaurant.image ? (
            <Image
              src={restaurant.image}
              alt={`Logo de ${restaurant.name}`}
              fill
              className="object-contain"
              priority
            />
          ) : (
            <div className="w-full h-full rounded-full bg-black/5 flex items-center justify-center">
              <Utensils className="w-16 h-16 text-black/20" />
            </div>
          )}
        </div>

        {/* Divider line */}
        <div className="w-16 h-px bg-black/20 mb-6" />

        {/* Business info */}
        {!isEmbedded && (
          <div className="flex flex-col items-center gap-3 mb-10 text-center">
            {restaurant.direction && (
              <div className="flex items-center gap-2 text-black/50 text-xs tracking-wider uppercase">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{restaurant.direction}</span>
              </div>
            )}

            {restaurant.phone && (
              <a
                href={`tel:${phoneNumber}`}
                className="flex items-center gap-2 text-black/50 hover:text-black text-xs tracking-wider uppercase transition-colors duration-300"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{restaurant.phone}</span>
              </a>
            )}

            {restaurant.location && (
              <a
                href={restaurant.location}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-black/50 hover:text-black text-xs tracking-wider uppercase transition-colors duration-300"
              >
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>{language === "en" ? "View on Map" : "Ver en Mapa"}</span>
              </a>
            )}
          </div>
        )}

        {/* Menu navigation buttons */}
        <div className="w-full flex flex-col gap-3 mb-10">
          {/* Carta Principal */}
          <button
            onClick={() => onNavigate("principal")}
            className="group w-full flex items-center justify-between px-6 py-5 rounded-2xl border border-black/10 bg-white hover:bg-black hover:text-white hover:border-black transition-all duration-500 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-black/5 group-hover:bg-white/10 flex items-center justify-center transition-colors duration-500">
                <Utensils className="w-5 h-5 text-black/60 group-hover:text-white/80 transition-colors duration-500" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold tracking-wide uppercase">
                  {language === "en" ? "Main Menu" : "Carta Principal"}
                </span>
                <span className="block text-[10px] text-black/40 group-hover:text-white/50 tracking-wider uppercase transition-colors duration-500">
                  {language === "en"
                    ? "Appetizers, main courses & more"
                    : "Entradas, fondos y más"}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:translate-x-1">
              <svg
                className="w-4 h-4 text-black/40 group-hover:text-white/80 transition-colors duration-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Carta de Pizzas */}
          <button
            onClick={() => onNavigate("pizzas")}
            className="group w-full flex items-center justify-between px-6 py-5 rounded-2xl border border-black/10 bg-white hover:bg-black hover:text-white hover:border-black transition-all duration-500 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-black/5 group-hover:bg-white/10 flex items-center justify-center transition-colors duration-500">
                <Pizza className="w-5 h-5 text-black/60 group-hover:text-white/80 transition-colors duration-500" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold tracking-wide uppercase">
                  {language === "en" ? "Pizza Menu" : "Carta de Pizzas"}
                </span>
                <span className="block text-[10px] text-black/40 group-hover:text-white/50 tracking-wider uppercase transition-colors duration-500">
                  {language === "en"
                    ? "Family-size, thin crust"
                    : "Tamaño familiar, masa delgada"}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:translate-x-1">
              <svg
                className="w-4 h-4 text-black/40 group-hover:text-white/80 transition-colors duration-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Powered by */}
        <a
          href="https://viw-carta.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-black/25 tracking-widest uppercase hover:text-black/40 transition-colors duration-300"
        >
          Powered by <span className="font-semibold">Viw Carta</span>
        </a>
      </div>

      {/* CSS animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
