"use client";

import styles from "../theme.module.css";
import { HuaCategoryBlock } from "../components/HuaCategoryBlock";
import { HuaCategorySection } from "../components/HuaCategorySection";
import { HuaMenuNavigation } from "../components/HuaMenuNavigation";
import { useMenuData } from "../menu-context";
import { useLanguage } from "@/hooks/useLanguage";

export default function CenaPage() {
  const { language } = useLanguage();
  const data = useMenuData();
  const { categories = [], systemMessages: messages = [] } = data;
  const t = (es, en) => (language === "en" && en ? en : es || "");
  const getMsg = (placement) => messages.find((m) => m.placement === placement);
  // Filter empty categories
  const menuByCat = categories.filter(
    (cat) => cat.meals && cat.meals.length > 0,
  );

  // Layout Logic
  const normalize = (s) => s?.trim().toLowerCase() || "";
  const col1Names = [
    "piqueos",
    "entre panes",
    "sandwiches",
    "plato de fondo",
    "fondos de noche",
  ];
  const col2Names = ["pizzas", "postres"];

  const col1Data = [];
  const col2Data = [];

  menuByCat.forEach((cat) => {
    const name = normalize(cat.name);
    if (col1Names.some((n) => name.includes(n))) {
      col1Data.push(cat);
    } else if (col2Names.some((n) => name.includes(n))) {
      col2Data.push(cat);
    }
  });

  // Custom sorting based on explicit order in lists
  col1Data.sort((a, b) => {
    const idxA = col1Names.findIndex((n) => normalize(a.name).includes(n));
    const idxB = col1Names.findIndex((n) => normalize(b.name).includes(n));
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });
  col2Data.sort((a, b) => {
    const idxA = col2Names.findIndex((n) => normalize(a.name).includes(n));
    const idxB = col2Names.findIndex((n) => normalize(b.name).includes(n));
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  return (
    <div
      className={`${styles.huaTheme} min-h-screen relative p-2 sm:p-6 pb-20 font-body`}
    >
      <HuaMenuNavigation />

      <div className="relative z-10 bg-hua-white min-h-[90vh] shadow-xl hua-border-celeste p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
          <img
            src="/hua-puntasal/images/logo-hua.svg"
            alt="Watermark"
            className="w-[90vw] max-w-[1000px] opacity-[0.20]"
          />
        </div>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline mb-4 pb-2">
          <div className="relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-20 md:w-56 h-full bg-[url('/hua-puntasal/images/wave-lines.svg')] -z-10 opacity-30"></div>
            <h1 className="md:text-8xl text-6xl text-hua-blue hua-heading-title italic font-bold relative translate-x-2 translate-y-4 mb-4 md:mb-0">
              {t(
                getMsg("cena_title")?.content,
                getMsg("cena_title")?.content_en,
              )}
            </h1>
          </div>

          <div className=" sm:mt-0 text-right">
            <p className="text-hua-blue text-base sm:text-lg font-bold tracking-widest uppercase">
              {t(
                getMsg("cena_msg_d1_1")?.content,
                getMsg("cena_msg_d1_1")?.content_en,
              )}
            </p>
            <p className="text-hua-blue text-base sm:text-lg tracking-[0.2em] uppercase">
              {t(
                getMsg("cena_msg_d1_2")?.content,
                getMsg("cena_msg_d1_2")?.content_en,
              )}
            </p>
          </div>
        </header>

        <div className="sm:hidden sticky top-0 z-30 mb-6 -mx-4 bg-hua-white pb-2 shadow-sm">
          <HuaCategorySection
            categories={[...col1Data, ...col2Data]}
            language={language}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            {col1Data.map((cat) => (
              <HuaCategoryBlock
                key={cat._id}
                category={cat}
                meals={cat.meals}
                language={language}
              />
            ))}
          </div>
          <div>
            {col2Data.map((cat) => (
              <HuaCategoryBlock
                key={cat._id}
                category={cat}
                meals={cat.meals}
                language={language}
              />
            ))}
          </div>
        </div>

        <footer className="mt-16 pt-8 border-hua-celeste flex flex-col md:flex-row justify-between items-center md:items-end text-xs text-hua-gray font-body">
          <div className="text-center mb-4 md:mb-0">
            <p className="font-bold text-hua-blue">
              {t(
                getMsg("cena_moni_i2")?.content,
                getMsg("cena_moni_i2")?.content_en,
              )}
            </p>
          </div>
          <div className="absolute left-1/2 bottom-8 -translate-x-1/2 hidden md:block">
            <img
              src="/hua-puntasal/images/logo-hua-azul.svg"
              alt="HUA"
              className="h-24 w-auto"
            />
          </div>
          <div className="text-center md:text-right">
            <p className="font-bold mb-2 md:mr-10 whitespace-pre-line text-center w-[180px] ml-auto">
              {t(
                getMsg("cena_horario_d2")?.content,
                getMsg("cena_horario_d2")?.content_en,
              )}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
