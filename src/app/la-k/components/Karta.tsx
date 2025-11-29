"use client";

import { useState } from "react";
import { Pizza, Utensils } from "lucide-react";
import DecorativeFrame from "./DecorativeBorder";
import FloatingActionGroup from "./FloatingActionGroup";
import Image from "next/image";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import LanguageToggle from "@/components/LanguageToggle";

interface Meal {
  id: string;
  name: string;
  price: number;
  description?: string;
  ingredients?: string[];
  // Campos en inglés (opcionales)
  name_en?: string;
  description_en?: string;
  ingredients_en?: string[];
}

interface Category {
  id: string;
  name: string;
  meals: Meal[];
  description?: string;
  // Campos en inglés (opcionales)
  name_en?: string;
  description_en?: string;
}

interface KartaData {
  categories: Category[];
}

interface KartaProps {
  data: KartaData;
  restaurant: { phone: string };
  systemMessages?: MessageSystem[];
}

interface MessageSystem {
  placement: string;
  type: "info" | "warning" | "alert" | "promotion";
  content: string;
  content_en: string;
  isActive: boolean;
}

type MenuType = "principal" | "pizzas";

function KartaContent({ data, restaurant, systemMessages = [] }: KartaProps) {
  const { language } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<MenuType>("principal");

  // Helper de traducción con fallback al ES
  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  // Helper para obtener mensaje por placement
  const getMessage = (placement: string) => {
    return systemMessages.find((m) => m.placement === placement && m.isActive);
  };

  const filteredCategories = data.categories.filter((category) => {
    const joined = `${category.name || ""} ${
      category.name_en || ""
    }`.toLowerCase();
    return activeMenu === "pizzas"
      ? joined.includes("pizza")
      : !joined.includes("pizza");
  });

  const half = Math.ceil(filteredCategories.length / 2);
  const left = filteredCategories.slice(0, half);
  const right = filteredCategories.slice(half);

  return (
    <div className="w-full min-h-3.5  md:min-h-screen relative">
      {/* Toggle de idioma fijo */}
      <div className="fixed bottom-38 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Barra horizontal para móviles, se pueden ver las categorías (usa ancla estable por id) */}
      <div className="fixed bottom-0 left-0 w-full z-50 border-t border-black bg-neutral-50 shadow-inner overflow-x-auto xl:hidden">
        <div className="flex gap-3 px-4 py-3 min-w-full overflow-x-auto scrollbar-none">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                const target = document.getElementById(`cat-${category.id}`);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="whitespace-nowrap px-4 py-2 text-sm uppercase tracking-wider text-primary font-semibold border border-border rounded-md bg-card shadow-sm active:scale-95 active:bg-primary active:text-primary-foreground transition-all duration-150"
            >
              {t(category.name, category.name_en)}
            </button>
          ))}
        </div>
      </div>

      <DecorativeFrame>
        {/* Contenedor del menú dentro del marco */}
        <div className="w-full mx-auto py-4 md:py-6 overflow-x-hidden pb-24 xl:pb-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                {activeMenu === "pizzas" ? (
                  <Pizza className="w-8 h-8 text-secondary" />
                ) : (
                  <Utensils className="w-8 h-8 text-secondary" />
                )}
              </div>
              <p className="text-secondary text-lg font-medium">
                {language === "en"
                  ? "No categories available in this menu"
                  : "No hay categorías disponibles en esta carta"}
              </p>
            </div>
          ) : (
            <div
              className={`space-y-8 -order-1 flex-1 ${
                activeMenu === "pizzas"
                  ? "grid grid-cols-1 xl:grid-cols-1 gap-2"
                  : "grid grid-cols-1 xl:grid-cols-2 gap-10"
              } `}
            >
              {activeMenu === "pizzas" ? (
                <div className="flex flex-col space-y-8">
                  {filteredCategories.map((category) => {
                    const isPizzas =
                      /pizza/i.test(category.name || "") ||
                      /pizza/i.test(category.name_en || "");
                    return (
                      <div key={category.id} id={`cat-${category.id}`}>
                        <div>
                          {isPizzas && (
                            <div className="flex py-6  lg:mb-10 justify-center text-center flex-col items-center">
                              <Image
                                src="/la-k/images/pizzas-la-k-title.svg"
                                alt="Carta de pizzas la k vichayito"
                                width={100}
                                height={100}
                              />
                              <h3 className="theme-la-k text-sm md:text-2xl text-primary">
                                {language === "en"
                                  ? "Family size, thin crust"
                                  : "Tamaño familiar masa delgada"}
                              </h3>
                            </div>
                          )}
                          {t(category.description, category.description_en) && (
                            <p className="whitespace-pre-line text-center text-xs md:text-4xl text-secondary mb-4">
                              {t(category.description, category.description_en)}
                            </p>
                          )}
                        </div>

                        {/* Lista de platos */}
                        <div className=" lg:p-10">
                          {category.meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="flex items-start justify-between gap-4 group leading-none active:scale-95 active:bg-secondary-foreground transition-transform duration-150"
                            >
                              <div className="flex-1 xl:flex">
                                <h5 className="text-[0.80rem] md:text-lg text-primary uppercase tracking-wide leading-tight m-0 p-0 whitespace-nowrap">
                                  {t(meal.name, meal.name_en)}
                                </h5>
                                {t(meal.description, meal.description_en) && (
                                  <p className="flex text-[0.7rem] md:text-xs text-secondary-content leading-relaxed uppercase">
                                    {t(meal.description, meal.description_en)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-[0.80rem] md:text-lg text-primary uppercase tracking-wide leading-tight whitespace-nowrap">
                                  S/ {meal.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {isPizzas && (
                          <div className="flex mt-4 sm:mt-1 p-6 justify-end text-center flex-col items-center">
                            {/* Mensaje del sistema para el footer de pizzas */}
                            {(() => {
                              const msg = getMessage("pizza_menu_footer");
                              if (msg) {
                                return (
                                  <div
                                    className={`mb-6 px-4 py-2 rounded-lg text-xs md:text-base font-extralight
                                    ${
                                      msg.type === "info"
                                        ? "text-primary"
                                        : msg.type === "warning"
                                        ? "text-yellow-800 bg-yellow-50"
                                        : msg.type === "alert"
                                        ? "text-red-800 bg-red-50"
                                        : "text-green-800 bg-green-50"
                                    }`}
                                  >
                                    {t(msg.content, msg.content_en)}
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <Image
                              src="/la-k/images/la-k-footer-divider.svg"
                              alt="Carta de pizzas la k vichayito"
                              width={100}
                              height={100}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {/* Columna izquierda */}
                  <div className="flex flex-col space-y-8">
                    {left.map((category) => (
                      <div key={category.id} id={`cat-${category.id}`}>
                        {!(t(category.name, category.name_en) === "Salsas") && (
                          <div>
                            <h2 className="text-center text-xs font-bold uppercase tracking-wider text-primary">
                              {t(category.name, category.name_en)}
                            </h2>
                            <div className="flex justify-center mb-4">
                              <Image
                                src="/la-k/images/la-k-divider.svg"
                                alt="Carta de pizzas la k vichayito"
                                width={250}
                                height={125}
                              />
                            </div>
                          </div>
                        )}
                        {t(category.description, category.description_en) && (
                          <p className="whitespace-pre-line text-start text-xs text-secondary-content">
                            {t(category.description, category.description_en)}
                          </p>
                        )}

                        {/* Lista de platos */}
                        <div>
                          {category.meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="flex items-start justify-between gap-4 group leading-none active:scale-95 active:bg-secondary-foreground transition-transform duration-150"
                            >
                              <div className="flex-1">
                                {/* Nombre del plato */}
                                <h5 className="text-[0.80rem] text-primary uppercase tracking-wide leading-tight m-0 p-0">
                                  {t(meal.name, meal.name_en)}
                                </h5>
                                {/* Descripción del plato */}

                                {t(meal.description, meal.description_en) && (
                                  <p className="text-[0.7rem] text-secondary-content leading-relaxed">
                                    {t(meal.description, meal.description_en)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-[0.80rem] text-primary uppercase tracking-wide leading-tight">
                                  S/ {meal.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Columna derecha */}
                  <div className="flex flex-col space-y-8">
                    {right.map((category) => (
                      <div key={category.id} id={`cat-${category.id}`}>
                        {!(t(category.name, category.name_en) === "Salsas") && (
                          <div>
                            <h2 className="text-center text-xs font-bold uppercase tracking-wider text-primary">
                              {t(category.name, category.name_en)}
                            </h2>
                            <div className="flex justify-center mb-4">
                              <Image
                                src="/la-k/images/la-k-divider.svg"
                                alt="Carta de pizzas la k vichayito"
                                width={250}
                                height={125}
                              />
                            </div>
                          </div>
                        )}
                        {t(category.description, category.description_en) && (
                          <p className="whitespace-pre-line text-start text-xs text-secondary-content">
                            {t(category.description, category.description_en)}
                          </p>
                        )}

                        {/* Lista de platos */}
                        <div>
                          {category.meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="flex items-start justify-between gap-4 group leading-none active:scale-95 active:bg-secondary-foreground transition-transform duration-150"
                            >
                              <div className="flex-1">
                                <h5 className="text-[0.80rem]  text-primary uppercase tracking-wide leading-tight m-0 p-0">
                                  {t(meal.name, meal.name_en)}
                                </h5>
                                {t(meal.description, meal.description_en) && (
                                  <p className="text-[0.7rem] text-secondary-content leading-relaxed">
                                    {t(meal.description, meal.description_en)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-[0.80rem] text-primary uppercase tracking-wide leading-tight">
                                  S/ {meal.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DecorativeFrame>

      <FloatingActionGroup
        restaurant={restaurant}
        activeMenu={activeMenu}
        onChange={setActiveMenu}
      />
    </div>
  );
}

export default function LaKarta(props: KartaProps) {
  return (
    <LanguageProvider>
      <KartaContent {...props} />
    </LanguageProvider>
  );
}
