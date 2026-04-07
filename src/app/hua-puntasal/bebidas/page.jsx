"use client";

import { HuaCategoryBlock } from "../components/HuaCategoryBlock";
import { HuaCategorySection } from "../components/HuaCategorySection";
import { HuaMenuNavigation } from "../components/HuaMenuNavigation";
import { useMenuData } from "../menu-context";
import { useLanguage } from "@/hooks/useLanguage";

export default function BebidasPage() {
  const { language } = useLanguage();
  const data = useMenuData();
  const { categories = [], systemMessages: messages = [] } = data;

  const t = (es, en) => (language === "en" && en ? en : es || "");
  const getMsg = (placement) => messages.find((m) => m.placement === placement);
  const bebidasMsg = getMsg("bebidas_msg_d1");
  const bebidasMsgText = t(bebidasMsg?.content, bebidasMsg?.content_en);

  // Only keep categories that have meals
  const menuByCat = categories.filter(
    (cat) => cat.meals && cat.meals.length > 0,
  );

  // Layout Logic: adhere strictly to these columns
  // Col 1: Cócteles, Puros
  // Col 2: Cervezas, Sangría, Bebidas Calientes
  // Col 3: Bebidas sin alcohol

  const normalize = (s) => s?.trim().toLowerCase() || "";

  const rules = [
    { names: ["cocteles", "puros"], target: 0 },
    { names: ["cervezas", "sangría", "calientes"], target: 1 },
    { names: ["sin alcohol"], target: 2 },
  ];

  const columns = [[], [], []];

  // Place only categories that match any rule; ignore others
  menuByCat.forEach((cat) => {
    const name = normalize(cat.name + " " + (cat.name_en || ""));
    for (const rule of rules) {
      if (rule.names.some((n) => name.includes(n))) {
        columns[rule.target].push(cat);
        break;
      }
    }
  });

  const [col1Data, col2Data, col3Data] = columns;

  return (
    <div className="min-h-screen relative p-2 sm:p-6 pb-20 font-body bg-hua-celeste/80">
      <HuaMenuNavigation />

      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <img
          src="/hua-puntasal/images/logo-hua.svg"
          alt="Watermark"
          className="w-[90vw] max-w-[1000px] opacity-[0.05]"
        />
      </div>

      {/* Borde blanco para Bebidas */}
      <div className="relative z-10 bg-hua-celeste min-h-[90vh] shadow-xl hua-border-white p-4 sm:p-8 max-w-[1400px] mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline mb-8  pb-4">
          <div className="relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-20 md:w-56 h-full bg-[url('/hua-puntasal/images/wave-lines.svg')] -z-10 opacity-30"></div>
            <h1 className="md:text-8xl text-6xl text-hua-blue hua-heading-title italic font-bold relative translate-x-2 translate-y-4 mb-4 md:mb-0">
              {t(
                getMsg("bebidas_title")?.content,
                getMsg("bebidas_title")?.content_en,
              )}
            </h1>
          </div>

          <div className="mt-4 lg:mt-0 text-right">
            <p className="text-hua-blue text-base sm:text-lg font-bold tracking-widest uppercase">
              <span className="inline xl:hidden">{bebidasMsgText}</span>
              <span className="hidden xl:inline" style={{ whiteSpace: "pre" }}>
                {bebidasMsgText?.split("").map((char, i) => (
                  <span
                    key={i}
                    className="inline-block"
                    style={{
                      transform: `translateY(${Math.sin(i * 0.5) * 4}px)`,
                      transition: "transform 0.3s ease",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </span>
            </p>
          </div>
        </header>

        <div className="sm:hidden sticky top-0 z-30 mb-6 -mx-4 bg-hua-white pb-2 shadow-sm">
          <HuaCategorySection
            categories={[...col1Data, ...col2Data, ...col3Data]}
            language={language}
          />
        </div>

        {/* 3 Columns Grid for Bebidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
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
          <div className="md:col-span-2 lg:col-span-1">
            {col3Data.map((cat) => (
              <HuaCategoryBlock
                key={cat._id}
                category={cat}
                meals={cat.meals}
                language={language}
              />
            ))}
          </div>
        </div>

        <footer className="mt-16 pt-8 flex flex-col md:flex-row justify-between items-start text-xs text-hua-gray font-body">
          <div className="mb-4 md:mb-0">
            <p className="font-bold text-hua-blue">
              {t(
                getMsg("bebidas_moni_i2")?.content,
                getMsg("bebidas_moni_i2")?.content_en,
              )}
            </p>
          </div>
          <div className="absolute left-1/2 bottom-8 -translate-x-1/2 hidden md:block">
            <img
              src="/hua-puntasal/images/logo-hua-azul.svg"
              alt="HUA"
              className="h-16 w-auto"
            />
          </div>
          <div className="text-right">
            <p className="-mt-12 xl:-mt-60 font-bold text-2xl whitespace-pre-line text-center ml-auto text-hua-dark-blue">
              {t(
                getMsg("bebidas_vinos_d2")?.content,
                getMsg("bebidas_vinos_d2")?.content_en,
              )}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
