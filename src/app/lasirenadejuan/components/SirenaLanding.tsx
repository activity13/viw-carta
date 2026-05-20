"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import { useRouter } from "next/navigation";
import { Globe, MapPin, Phone } from "lucide-react";

interface SirenaRestaurantInfo {
  name: string;
  slug: string;
  phone?: string;
  direction?: string;
  location?: string;
  description?: string;
  image?: string;
  menuSections?: Array<{ name: string; slug: string; order: number; isActive: boolean }>;
}

interface SirenaLandingProps {
  restaurant: SirenaRestaurantInfo;
}

export default function SirenaLanding({
  restaurant,
}: SirenaLandingProps) {
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();

  const handleCall = () => {
    if (restaurant.phone) {
      window.location.href = `tel:${restaurant.phone}`;
    }
  };

  const handleLocation = () => {
    if (restaurant.location) {
      window.open(restaurant.location, "_blank");
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center relative overflow-hidden px-6 py-12">
      {/* Espiral Decorative (Top Right) */}
      <div className="absolute top-8 z-20  md:top-40 left-6 md:left-96 opacity-70 md:w-80 md:h-80 w-16 h-16 rotate-12 pointer-events-none">
        <Image
          src="/lasirenadejuan/images/espiral.svg"
          alt="Decorative Spiral"
          fill
          className="object-contain"
        />
      </div>

      {/* Sirena Mascot (Bottom Right) */}
      <div className="absolute bottom-16 right-1 md:right-64 opacity-90 md:w-80 md:h-80 w-32 h-32 pointer-events-none translate-y-10">
        <Image
          src="/lasirenadejuan/images/logo_2.svg"
          priority
          alt="Sirena Decorative"
          fill
          className="object-contain"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full animate-[fadeInUp_0.8s_ease-out]">
        {/* Main Brand Logo from DB */}
        <div className="w-64 h-64 relative mb-6 transition-transform hover:scale-105 duration-700">
          <Image
            src={restaurant.image || "/lasirenadejuan/images/logo_2.svg"}
            alt={`Logo de ${restaurant.name}`}
            width={300}
            height={300}
            className="object-contain"
            priority
          />
        </div>

        {restaurant.direction && (
          <div className="text-center mb-8">
            <p className="text-sm font-avenir tracking-widest uppercase text-foreground/70">
              {restaurant.direction}
            </p>
          </div>
        )}

        <div className="w-full flex flex-col gap-4 mb-8">
          {(restaurant.menuSections || []).filter(s => s.isActive).map((sec) => (
            <button
              key={sec.slug}
              onClick={() => router.push(`/lasirenadejuan/${sec.slug}`)}
              className="group w-full flex items-center justify-center px-6 py-5 rounded-2xl border border-foreground/15 bg-card/50 backdrop-blur-sm hover:bg-foreground hover:text-background transition-all duration-500 active:scale-[0.98] shadow-sm"
            >
              <span className="text-xl font-serif capitalize tracking-tight group-hover:text-background transition-colors duration-500">
                {sec.name}
              </span>
            </button>
          ))}
        </div>

        {/* Action Buttons Group (Location, Call, Language) */}
        <div className="flex items-center justify-center gap-6 mb-12">
          {/* Location */}
          <button
            onClick={handleLocation}
            className="flex flex-col items-center gap-2 text-foreground/60 hover:text-foreground transition-colors group"
          >
            <div className="w-12 h-12 rounded-full border border-foreground/20 flex items-center justify-center group-hover:border-foreground/40 transition-all">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-avenir uppercase tracking-widest">
              {language === "en" ? "Location" : "Ubicación"}
            </span>
          </button>

          {/* Language */}
          <button
            onClick={toggleLanguage}
            className="flex flex-col items-center gap-2 text-foreground/60 hover:text-foreground transition-colors group"
          >
            <div className="w-12 h-12 rounded-full border border-foreground/20 flex items-center justify-center group-hover:border-foreground/40 transition-all bg-foreground/5">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-avenir uppercase tracking-widest">
              {language === "en" ? "ES" : "EN"}
            </span>
          </button>

          {/* Call */}
          <button
            onClick={handleCall}
            className="flex flex-col items-center gap-2 text-foreground/60 hover:text-foreground transition-colors group"
          >
            <div className="w-12 h-12 rounded-full border border-foreground/20 flex items-center justify-center group-hover:border-foreground/40 transition-all">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-avenir uppercase tracking-widest">
              {language === "en" ? "Call" : "Llamar"}
            </span>
          </button>
        </div>

        {/* Powered by */}
        <a
          href="https://viw-carta.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-foreground/30 tracking-widest uppercase hover:text-foreground/50 transition-colors duration-300"
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
