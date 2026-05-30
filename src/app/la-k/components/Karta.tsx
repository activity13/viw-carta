"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Pizza, Utensils, X, HandMetal } from "lucide-react";
import DecorativeFrame from "./DecorativeBorder";
import FloatingActionGroup from "./FloatingActionGroup";
import LaKLanding from "./LaKLanding";
import Image from "next/image";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import { CartProvider, useCart } from "@/providers/CartProvider";
import { OrderFloatingButton } from "@/components/cart/OrderFloatingButton";
import { checkMealAvailability, MealAvailability } from "@/lib/availability";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Meal {
  id: string;
  name: string;
  price: number;
  description?: string;
  ingredients?: string[];
  name_en?: string;
  description_en?: string;
  ingredients_en?: string[];
  availability?: MealAvailability;
}

interface Category {
  id: string;
  name: string;
  meals: Meal[];
  description?: string;
  name_en?: string;
  description_en?: string;
}

interface KartaData {
  categories: Category[];
}

interface KartaProps {
  data: KartaData;
  restaurant: {
    name: string;
    slug: string;
    phone?: string;
    direction?: string;
    location?: string;
    description?: string;
    image?: string;
  };
  systemMessages?: MessageSystem[];
}

interface MessageSystem {
  placement: string;
  type: "info" | "warning" | "alert" | "promotion";
  content: string;
  content_en?: string;
  isActive: boolean;
}

type MenuType = "principal" | "pizzas";

const ONBOARDING_KEY = "lak_cart_onboarding_shown";

// ─── Onboarding Alert ──────────────────────────────────────────────────────────

function CartOnboardingAlert({ onDismiss }: { onDismiss: () => void }) {
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Alert card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[slideUp_0.4s_ease-out]">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-black/50" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <HandMetal className="w-7 h-7 text-blue-500" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-center text-base font-bold text-black mb-2">
          {language === "en" ? "How to order" : "¿Cómo hacer tu pedido?"}
        </h3>

        {/* Description */}
        <p className="text-center text-sm text-black/60 leading-relaxed mb-5">
          {language === "en"
            ? "Press and hold a dish name for a second to add it to your order. Hold again to increase the quantity."
            : "Mantén pulsado un segundo sobre el nombre de un plato para agregarlo. Mantén pulsado de nuevo para aumentar la cantidad."}
        </p>

        {/* Visual indicator */}
        <div className="flex items-center justify-center gap-3 bg-black/[0.03] rounded-xl p-3 mb-5">
          <span className="text-xs text-primary uppercase tracking-wide font-medium">
            {language === "en" ? "Example dish" : "Plato ejemplo"}
          </span>
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[8px] font-bold">
            2
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-black/90 active:scale-[0.98] transition-all"
        >
          {language === "en" ? "Got it!" : "¡Entendido!"}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
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

// ─── Tappable Meal Row ─────────────────────────────────────────────────────────

function TappableMealRow({
  meal,
  language,
  t,
  variant,
}: {
  meal: Meal;
  language: string;
  t: (es?: string, en?: string) => string;
  variant: "principal" | "pizzas";
}) {
  const { items, addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didFire = useRef(false);

  const cartItem = items.find((item) => item.mealId === meal.id);
  const quantity = cartItem
    ? typeof cartItem.quantity === "number"
      ? cartItem.quantity
      : parseFloat(cartItem.quantity as string) || 0
    : 0;

  const availabilityResult = checkMealAvailability(meal, language);

  const fireAdd = useCallback(() => {
    if (!availabilityResult.available) return;
    addToCart({
      id: meal.id,
      name: meal.name,
      name_en: meal.name_en,
      price: meal.price,
      description: meal.description,
      description_en: meal.description_en,
    });
    setJustAdded(true);
    didFire.current = true;
    setTimeout(() => setJustAdded(false), 600);
  }, [addToCart, meal]);

  const handlePointerDown = useCallback(() => {
    if (!availabilityResult.available) return;
    didFire.current = false;
    setPressing(true);
    pressTimer.current = setTimeout(() => {
      fireAdd();
      setPressing(false);
    }, 300);
  }, [fireAdd, availabilityResult.available]);

  const handlePointerUp = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, []);

  const isPizzaVariant = variant === "pizzas";

  return (
    <div className={`flex items-start justify-between gap-4 group leading-none transition-transform duration-150 ${!availabilityResult.available ? "opacity-50 grayscale-[50%]" : ""}`}>
      <div className={`flex-1 ${isPizzaVariant ? "xl:flex" : ""}`}>
        {/* Long-press name to add */}
        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`text-left text-[0.80rem] ${
            isPizzaVariant ? "md:text-lg" : ""
          } text-primary uppercase tracking-wide leading-tight m-0 p-0 ${
            isPizzaVariant ? "whitespace-nowrap" : ""
          } ${availabilityResult.available ? "cursor-pointer" : "cursor-not-allowed"} select-none transition-all duration-150 inline-flex items-center gap-1.5 ${
            pressing
              ? "scale-95 text-primary/60"
              : availabilityResult.available ? "hover:text-primary/70 active:scale-95" : ""
          }`}
        >
          <span className={!availabilityResult.available ? "line-through" : ""}>{t(meal.name, meal.name_en)}</span>
          
          {!availabilityResult.available && (
             <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 border border-red-200 text-[9px] font-bold px-1.5 py-0.5 whitespace-nowrap ml-1">
               {availabilityResult.message || (language === "en" ? "Unavailable" : "Agotado")}
             </span>
          )}

          {/* Blue quantity badge — small */}
          {quantity > 0 && (
            <span
              className={`inline-flex items-center justify-center min-w-[14px] h-[14px] rounded-full bg-blue-500 text-white text-[8px] font-bold px-0.5 transition-all duration-300 ${
                justAdded ? "scale-125" : "scale-100"
              }`}
            >
              {quantity}
            </span>
          )}
        </button>

        {/* Description */}
        {t(meal.description, meal.description_en) && (
          <p
            className={`text-[0.7rem] ${
              isPizzaVariant ? "flex md:text-xs uppercase" : ""
            } text-secondary-content leading-relaxed`}
          >
            {t(meal.description, meal.description_en)}
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        <span
          className={`text-[0.80rem] ${
            isPizzaVariant ? "md:text-lg" : ""
          } text-primary uppercase tracking-wide leading-tight whitespace-nowrap`}
        >
          S/ {meal.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Karta Content ────────────────────────────────────────────────────────

function KartaContent({ data, restaurant, systemMessages = [] }: KartaProps) {
  const { language } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuType>("principal");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding only once
  useEffect(() => {
    if (showMenu) {
      try {
        const shown = localStorage.getItem(ONBOARDING_KEY);
        if (!shown) {
          setShowOnboarding(true);
        }
      } catch {
        // localStorage unavailable
      }
    }
  }, [showMenu]);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Helper de traducción con fallback al ES
  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  // Helper para obtener mensaje por placement
  const getMessage = (placement: string) => {
    return systemMessages.find((m) => m.placement === placement && m.isActive);
  };

  // ─── Landing screen ─────────────────────────────────────────────────────────
  if (!showMenu) {
    return (
      <LaKLanding
        restaurant={restaurant}
        onNavigate={(menu) => {
          setActiveMenu(menu);
          setShowMenu(true);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  // ─── Menu content ────────────────────────────────────────────────────────────
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
    <div className="w-full min-h-screen relative">
      {/* Onboarding alert */}
      {showOnboarding && <CartOnboardingAlert onDismiss={dismissOnboarding} />}

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
        {/* Logo centrado arriba del contenido del menú */}
        <div className="flex flex-col items-center pt-2 pb-4 md:pt-4 md:pb-6">
          {restaurant.image && (
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 overflow-hidden rounded-full">
              <Image
                src={restaurant.image}
                alt={`Logo de ${restaurant.name}`}
                fill
                className="object-contain p-1"
                priority
              />
            </div>
          )}
        </div>

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
                            <TappableMealRow
                              key={meal.id}
                              meal={meal}
                              language={language}
                              t={t}
                              variant="pizzas"
                            />
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
                                alt="Divisor decorativo la k"
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
                            <TappableMealRow
                              key={meal.id}
                              meal={meal}
                              language={language}
                              t={t}
                              variant="principal"
                            />
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
                                alt="Divisor decorativo la k"
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
                            <TappableMealRow
                              key={meal.id}
                              meal={meal}
                              language={language}
                              t={t}
                              variant="principal"
                            />
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

      {/* Floating cart button */}
      <OrderFloatingButton restaurantPhone={restaurant.phone || ""} />
    </div>
  );
}

export default function LaKarta(props: KartaProps) {
  return (
    <LanguageProvider>
      <CartProvider>
        <KartaContent {...props} />
      </CartProvider>
    </LanguageProvider>
  );
}
