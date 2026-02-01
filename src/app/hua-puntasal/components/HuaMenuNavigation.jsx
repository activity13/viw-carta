"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, Wine, Coffee, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import HuaLanguageToggle from "./HuaLanguageToggle";
import { useLanguage } from "@/hooks/useLanguage";

export const HuaMenuNavigation = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  // Translation helper
  const t = (es, en) => (language === "en" && en ? en : es || "");

  // Navigation labels with translation support
  const navLabels = {
    almuerzo: { es: "Almuerzo", en: "Lunch" },
    cena: { es: "Cena", en: "Dinner" },
    bebidas: { es: "Bebidas", en: "Drinks" },
    inicio: { es: "Inicio", en: "Home" },
  };

  const links = [
    {
      href: "/hua-puntasal/almuerzo",
      label: t(navLabels.almuerzo.es, navLabels.almuerzo.en),
      icon: Utensils,
    },
    {
      href: "/hua-puntasal/cena",
      label: t(navLabels.cena.es, navLabels.cena.en),
      icon: Wine,
    },
    {
      href: "/hua-puntasal/bebidas",
      label: t(navLabels.bebidas.es, navLabels.bebidas.en),
      icon: Coffee,
    },
  ];

  const current = links.find((l) => pathname.includes(l.href));

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 print:hidden">
      {isOpen && (
        <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="default"
                className={`shadow-lg rounded-2xl border-2 w-full justify-between gap-3 ${pathname === link.href ? "border-hua-blue bg-hua-celeste text-hua-blue font-bold" : "border-hua-blue/30 bg-hua-white text-hua-gray hover:bg-hua-celeste/50 hover:border-hua-blue"}`}
              >
                {link.label}
                <link.icon className="h-4 w-4" />
              </Button>
            </Link>
          ))}
          <Link href="/hua-puntasal">
            <Button
              variant="secondary"
              className="shadow-lg rounded-2xl border-2 border-hua-blue/30 text-hua-dark-blue bg-hua-white hover:bg-hua-celeste/50 hover:border-hua-blue w-full font-semibold"
            >
              {t(navLabels.inicio.es, navLabels.inicio.en)}
            </Button>
          </Link>
        </div>
      )}

      <HuaLanguageToggle />

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-hua-blue hover:bg-hua-dark-blue text-white shadow-xl border-4 hua-border-blue transition-all hover:scale-110"
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};
