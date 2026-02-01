/* @ts-nocheck */
"use client";

import Link from "next/link";
import { Utensils, Wine, Coffee } from "lucide-react";
import { useMenuData } from "./menu-context";
import { useLanguage } from "@/hooks/useLanguage";
import HuaLanguageToggle from "./components/HuaLanguageToggle";

export default function HuaHub() {
  const { language } = useLanguage();
  const data = useMenuData();
  const { systemMessages: messages } = data || { systemMessages: [] };

  // @ts-expect-error herramienta de desarrollo. Ejecutar para listar las plantillas de variantes en la BD.
  const t = (es, en) => (language === "en" && en ? en : es || "");
  // @ts-expect-error herramienta de desarrollo. Ejecutar para listar las plantillas de variantes en la BD.

  const getMsg = (placement) => messages.find((m) => m.placement === placement);

  const welcomeMsg = getMsg("hua_welcome");
  const welcomeText = t(welcomeMsg?.content, welcomeMsg?.content_en);

  const scheduleMsg = getMsg("almuerzo_horario_d2");
  const scheduleText = t(scheduleMsg?.content, scheduleMsg?.content_en);

  const almuerzoMsg = getMsg("almuerzo_title_i1");
  const almuerzoText = t(almuerzoMsg?.content, almuerzoMsg?.content_en);

  const bebidasMsg = getMsg("bebidas_title");
  const bebidasText = t(bebidasMsg?.content, bebidasMsg?.content_en);

  const cenaMsg = getMsg("cena_title");
  const cenaText = t(cenaMsg?.content, cenaMsg?.content_en);

  const links = [
    {
      href: "/hua-puntasal/almuerzo",
      label: almuerzoText,
      icon: Utensils,
      color: "bg-hua-celeste",
    },
    {
      href: "/hua-puntasal/cena",
      label: cenaText,
      icon: Wine,
      color: "bg-hua-celeste",
    },
    {
      href: "/hua-puntasal/bebidas",
      label: bebidasText,
      icon: Coffee,
      color: "bg-hua-blue",
      textColor: "text-white",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[url('/hua-bg-pattern.png')] bg-cover">
      <div className="bg-white/90 p-8 rounded-xl shadow-xl max-w-md w-full border-4 border-hua-celeste text-center relative overflow-hidden">
        <div className="w-32 h-32 mx-auto mb-6 bg-hua-celeste rounded-full flex items-center justify-center text-hua-blue font-bold text-2xl">
          <img
            src="./hua-puntasal/images/logo-hua-azul.svg"
            alt="Logo de Hua Puntasal"
          />
        </div>

        <h1 className="text-6xl hua-heading-title font-bold text-hua-blue mb-8 tracking-widest uppercase">
          {welcomeText || t("Bienvenido", "Welcome")}
        </h1>

        <div className="space-y-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between p-4 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border-2 border-transparent hover:border-hua-blue group ${
                link.textColor || "text-hua-dark-blue"
              } ${link.color}`}
            >
              <span className="font-bold text-lg tracking-wider">
                {link.label}
              </span>
              <link.icon className="w-6 h-6 opacity-80 group-hover:opacity-100" />
            </Link>
          ))}
        </div>

        <div className="mt-8 text-xs text-hua-gray flex justify-center">
          <p className="font-bold mb-1 whitespace-pre-line text-center w-[180px]">
            {scheduleText ||
              t(
                "Horario de Atención: 12:00 PM - 10:00 PM",
                "Opening Hours: 12:00 PM - 10:00 PM",
              )}
          </p>
        </div>

        <div className="absolute bottom-4 right-4 print:hidden">
          <HuaLanguageToggle />
        </div>
      </div>
    </div>
  );
}
