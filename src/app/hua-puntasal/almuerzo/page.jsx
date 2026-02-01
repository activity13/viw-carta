"use client";

import { HuaCategoryBlock } from "../components/HuaCategoryBlock";
import { HuaCategorySection } from "../components/HuaCategorySection";
import { HuaMenuNavigation } from "../components/HuaMenuNavigation";
import { useMenuData } from "../menu-context";
import { useLanguage } from "@/hooks/useLanguage";

export default function AlmuerzoPage() {
  const { language } = useLanguage();
  const data = useMenuData();
  const { categories = [], systemMessages: messages = [] } = data;
  const t = (es, en) => (language === "en" && en ? en : es || "");
  const getMsg = (placement) => messages.find((m) => m.placement === placement);
  console.log(messages);
  // Categories already contain meals from API
  const menuByCat = categories.filter(
    (cat) => cat.meals && cat.meals.length > 0,
  );

  // Normalization
  const normalize = (s) => s?.trim().toLowerCase() || "";

  // Col 1: Entradas, Guarniciones. Col 2: Fondos, Postres.
  const col1Names = ["entradas", "guarniciones"];
  const col2Names = ["fondos", "postres"];

  const col1Data = [];
  const col2Data = [];

  menuByCat.forEach((cat) => {
    const name = normalize(cat.name);
    if (col1Names.some((n) => name.includes(n))) {
      col1Data.push(cat);
    } else if (col2Names.some((n) => name.includes(n))) {
      col2Data.push(cat);
    }
    // Ignoramos el resto para esta vista específica, o podríamos agregarlos si deseamos.
  });

  // Sort based on predefined order
  col1Data.sort((a, b) => {
    const idxA = col1Names.findIndex((n) => normalize(a.name).includes(n));
    const idxB = col1Names.findIndex((n) => normalize(b.name).includes(n));
    return idxA - idxB;
  });

  col2Data.sort((a, b) => {
    const idxA = col2Names.findIndex((n) => normalize(a.name).includes(n));
    const idxB = col2Names.findIndex((n) => normalize(b.name).includes(n));
    return idxA - idxB;
  });

  return (
    <div className="min-h-screen relative p-2 sm:p-6 pb-20 font-body">
      <HuaMenuNavigation />

      {/* Background Logo Watermark */}
      <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
        <img
          src="/hua-puntasal/images/logo-hua.svg"
          alt="Watermark"
          className="w-[90vw] max-w-[1000px] opacity-[0.20]"
        />
      </div>

      <div className="relative z-10 bg-hua-white min-h-[90vh] shadow-xl hua-border-celeste p-4 sm:p-8 max-w-7xl mx-auto">
        {/* Header Fijo dentro de la hoja */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline mb-8 border-b-2 border-hua-celeste pb-4">
          <div className="relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-20 md:w-56 h-full bg-[url('/wave-lines.svg')] -z-10 opacity-30"></div>
            <h1 className="md:text-8xl text-6xl text-hua-blue hua-heading-title italic font-bold relative translate-x-2 translate-y-4 mb-4 md:mb-0">
              {t(
                getMsg("almuerzo_title_i1")?.content,
                getMsg("almuerzo_title_i1")?.content_en,
              )}
            </h1>
          </div>

          <div className=" sm:mt-0 text-right">
            <p className="text-hua-blue text-base sm:text-lg font-bold tracking-widest uppercase">
              {t(
                getMsg("almuerzo_msg_d1_1")?.content,
                getMsg("almuerzo_msg_d1_1")?.content_en,
              )}
            </p>
            <p className="text-hua-blue text-base sm:text-lg tracking-[0.2em] uppercase">
              {t(
                getMsg("almuerzo_msg_d1_2")?.content,
                getMsg("almuerzo_msg_d1_2")?.content_en,
              )}
            </p>
          </div>
        </header>

        {/* Navegación Móvil Sticky */}
        <div className="sm:hidden sticky top-0 z-30 mb-6 -mx-4 bg-hua-white pb-2 shadow-sm">
          <HuaCategorySection
            categories={[...col1Data, ...col2Data]}
            language={language}
          />
        </div>

        {/* Contenido Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Columna Izquierda */}
          <div>
            {col1Data.map((cat) => (
              <HuaCategoryBlock
                key={cat._id || cat.id}
                category={cat}
                meals={cat.meals}
                language={language}
              />
            ))}
          </div>

          {/* Columna Derecha */}
          <div>
            {col2Data.map((cat) => (
              <HuaCategoryBlock
                key={cat._id || cat.id}
                category={cat}
                meals={cat.meals}
                language={language}
              />
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-16 pt-8 flex flex-col md:flex-row justify-between items-end text-xs text-hua-gray font-body">
          <div className="mb-4 md:mb-0">
            <p className="font-bold text-hua-blue">
              {t(
                getMsg("almuerzo_moni_i2")?.content,
                getMsg("almuerzo_moni_i2")?.content_en,
              )}
            </p>
          </div>

          {/* Logo Central Pequeño */}
          <div className="absolute left-1/2 bottom-8 -translate-x-1/2 hidden md:block">
            <img
              src="/hua-puntasal/images/logo-hua-azul.svg"
              alt="HUA"
              className="h-32 w-auto"
            />
          </div>

          <div className="text-right">
            <p className="font-bold mr-12  mb-12 whitespace-pre-line text-center w-[180px] ml-auto">
              {t(
                getMsg("almuerzo_horario_d2")?.content,
                getMsg("almuerzo_horario_d2")?.content_en,
              )}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
