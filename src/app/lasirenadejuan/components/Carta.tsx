"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import { CartProvider, useCart } from "@/providers/CartProvider";
import { OrderFloatingButton } from "@/components/cart/OrderFloatingButton";
import { useRouter } from "next/navigation";
import { Home, HandMetal, X } from "lucide-react";
import { checkMealAvailability, MealAvailability } from "@/lib/availability";

interface Meal {
  id: string;
  name: string;
  price: number;
  description?: string;
  name_en?: string;
  description_en?: string;
  availability?: MealAvailability;
}

interface Category {
  id: string;
  name: string;
  meals: Meal[];
  description?: string;
  name_en?: string;
  description_en?: string;
  menuSection?: string;
}

interface CartaProps {
  data: { categories: Category[] };
  restaurant: {
    name?: string;
    phone?: string;
    direction?: string;
    location?: string;
    description?: string;
    image?: string;
    menuSections?: Array<{
      name: string;
      name_en?: string;
      slug: string;
      order: number;
      isActive: boolean;
    }>;
    [key: string]: unknown;
  };
  systemMessages?: unknown[];
  activeMenu: string;
}

function capitalizeFirstLetter(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function analyzeCategoryPrices(category: Category, activeMenu: string) {
  if (activeMenu === "principal" || activeMenu === "nigiris") {
    return { displayMode: "all_right", commonPrice: null };
  }

  if (!category.meals || category.meals.length === 0) {
    return { displayMode: "all_right", commonPrice: null };
  }

  const prices = category.meals.map((m) => m.price);
  const allEqual = prices.every((p) => p === prices[0]);

  if (allEqual) {
    return { displayMode: "title_price", commonPrice: prices[0] };
  }

  if (category.meals.length >= 5) {
    const freq: Record<number, number> = {};
    prices.forEach((p) => {
      freq[p] = (freq[p] || 0) + 1;
    });
    let maxCount = 0;
    let commonP = null;
    for (const p in freq) {
      if (freq[p] > maxCount) {
        maxCount = freq[p];
        commonP = Number(p);
      }
    }
    const differentCount = category.meals.length - maxCount;
    if (differentCount < category.meals.length / 4) {
      return { displayMode: "mixed", commonPrice: commonP };
    }
  }

  return { displayMode: "all_right", commonPrice: null };
}

const ONBOARDING_KEY = "sirena_cart_onboarding_shown";

function CartOnboardingAlert({ onDismiss }: { onDismiss: () => void }) {
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
      {/* Backdrop with elegant blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onDismiss}
      />

      {/* Alert card styled with the beach sand cream and navy theme */}
      <div className="relative bg-background text-foreground rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-foreground/10 animate-[slideUp_0.4s_ease-out] flex flex-col items-center">
        {/* Close button with soft hover transition */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all duration-300 group"
          aria-label="Close onboarding info"
        >
          <X className="w-4 h-4 text-foreground/60 group-hover:text-foreground transition-colors" />
        </button>

        {/* Icon with soft navy circular background */}
        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-5 animate-pulse">
          <HandMetal className="w-8 h-8 text-foreground/80" />
        </div>

        {/* Title in Friz font matching the rest of the brand */}
        <h3 className="text-center text-xl font-friz uppercase tracking-wider text-foreground mb-3">
          {language === "en" ? "How to order" : "¿Cómo ordenar?"}
        </h3>

        {/* Description in Serif matching the card menu description */}
        <p className="text-center text-sm font-serif leading-relaxed text-foreground/80 mb-6 px-2">
          {language === "en"
            ? "Press and hold a dish name for a second to add it to your order. Hold again to increase the quantity."
            : "Mantén pulsado un segundo sobre el nombre de un plato para agregarlo. Mantén pulsado de nuevo para aumentar la cantidad."}
        </p>

        {/* Visual indicator / Example */}
        <div className="flex items-center justify-center gap-3 bg-foreground/5 rounded-xl px-5 py-3.5 mb-6 border border-foreground/10 w-full max-w-[240px]">
          <span className="text-xs font-avenir uppercase tracking-widest text-foreground/60 font-medium">
            {language === "en" ? "Example dish" : "Plato ejemplo"}
          </span>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold px-1 animate-[bounce_1.5s_infinite]">
            2
          </span>
        </div>

        {/* Premium CTA button in Avenir */}
        <button
          onClick={onDismiss}
          className="w-full py-4 rounded-xl bg-foreground text-background text-sm font-avenir uppercase tracking-widest font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all duration-300 shadow-md"
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

function TappableMealRow({
  meal,
  t,
  activeMenu,
  displayMode,
  commonPrice,
}: {
  meal: Meal;
  t: (es?: string, en?: string) => string;
  activeMenu: string;
  displayMode: string;
  commonPrice: number | null;
}) {
  const { items, addToCart } = useCart();
  const { language } = useLanguage();
  const availabilityResult = checkMealAvailability(meal, language);
  const [justAdded, setJustAdded] = useState(false);
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartItem = items.find((item) => item.mealId === meal.id);
  const quantity = cartItem ? Number(cartItem.quantity) : 0;

  const fireAdd = useCallback(() => {
    addToCart({
      id: meal.id,
      name: meal.name,
      name_en: meal.name_en,
      price: meal.price,
      description: meal.description,
      description_en: meal.description_en,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  }, [addToCart, meal]);

  const handlePointerDown = useCallback(() => {
    if (!availabilityResult.available) return;
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

  const mealName = t(meal.name, meal.name_en);
  const mealDesc = t(meal.description, meal.description_en);

  const isBeverage = activeMenu === "bebidas";
  const titleClass = isBeverage
    ? "font-serif font-bold text-base md:text-lg capitalize"
    : "font-open-sans font-extrabold uppercase text-sm md:text-base tracking-tight";

  const showPriceRight =
    displayMode === "all_right" ||
    (displayMode === "mixed" && meal.price !== commonPrice);

  return (
    <div className={`flex items-start justify-between gap-4 ${isBeverage ? "mb-1.5 md:mb-2" : "mb-4 md:mb-6"}`}>
      <div className="flex-1">
        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          disabled={!availabilityResult.available}
          className={`text-left text-foreground tracking-wide m-0 p-0 cursor-pointer select-none transition-all duration-150 inline-flex items-center gap-2 ${pressing
            ? "scale-95 opacity-70"
            : !availabilityResult.available 
              ? "opacity-50 cursor-not-allowed grayscale"
              : "hover:opacity-80 active:scale-95"
            }`}
        >
          <span className={`${titleClass} ${!availabilityResult.available ? "line-through text-foreground/50" : ""}`}>
            {isBeverage ? capitalizeFirstLetter(mealName) : mealName}
          </span>
          {!availabilityResult.available && (
            <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.5 whitespace-nowrap uppercase tracking-wider ml-1">
              {availabilityResult.message || (language === "en" ? "Unavailable" : "Agotado")}
            </span>
          )}
          {quantity > 0 && (
            <span
              className={`inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-foreground text-background text-[10px] font-bold px-1 transition-all duration-300 ${justAdded ? "scale-125" : "scale-100"
                }`}
            >
              {quantity}
            </span>
          )}
        </button>

        {mealDesc && (
          <p className="text-foreground/80 font-serif text-xs md:text-sm leading-relaxed mt-1">
            {capitalizeFirstLetter(mealDesc)}
          </p>
        )}
      </div>

      {showPriceRight && (
        <div className="text-right shrink-0">
          <span
            className={`${isBeverage ? "font-serif" : "font-open-sans font-extrabold"} text-sm md:text-base whitespace-nowrap`}
          >
            {meal.price.toString()}
          </span>
        </div>
      )}
    </div>
  );
}

function SirenaContent({ data, restaurant, activeMenu }: CartaProps) {
  const { language, toggleLanguage } = useLanguage();
  const router = useRouter();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const shown = localStorage.getItem(ONBOARDING_KEY);
      if (!shown) {
        setShowOnboarding(true);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // localStorage not available
    }
  }, []);

  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  const renderSplitTitle = (title: string) => {
    const parts = title.split(" ");
    if (parts.length >= 2) {
      return (
        <span className="flex flex-col text-left">
          <span className="block text-xl md:text-2xl font-friz uppercase text-foreground leading-none tracking-wider">
            {parts[0]}
          </span>
          <span className="block text-2xl md:text-3xl font-friz uppercase text-foreground leading-none tracking-wider mt-1.5">
            {parts.slice(1).join(" ")}
          </span>
        </span>
      );
    }
    return (
      <span className="block text-2xl md:text-3xl font-friz uppercase text-foreground leading-none tracking-wider">
        {title}
      </span>
    );
  };

  const internalActiveMenu = activeMenu || "carta";

  const filteredCategories = data.categories.filter((cat) => {
    // If a category has no menuSection defined, it defaults to "carta"
    const section = cat.menuSection || "carta";
    return section === internalActiveMenu;
  });

  // Divide into two columns for larger screens
  let left: Category[];
  let right: Category[];

  if (internalActiveMenu === "bebidas") {
    left = filteredCategories.slice(0, 3);
    right = filteredCategories.slice(3);
  } else {
    const half = Math.ceil(filteredCategories.length / 2);
    left = filteredCategories.slice(0, half);
    right = filteredCategories.slice(half);
  }

  const renderColumn = (categories: Category[], position?: "left" | "right") => (
    <div className="flex flex-col space-y-12 relative z-10">
      {internalActiveMenu === "bebidas" && position === "left" && (
        <div className="w-32 h-32 relative mb-2 select-none pointer-events-none opacity-90">
          <Image
            src="/lasirenadejuan/images/espiral.svg"
            alt="Espiral"
            fill
            className="object-contain"
          />
        </div>
      )}
      {categories.map((category) => {
        const { displayMode, commonPrice } = analyzeCategoryPrices(
          category,
          internalActiveMenu,
        );
        const isBebidas = internalActiveMenu === "bebidas";
        return (
          <div
            key={category.id}
            id={`cat-${category.id}`}
            className="scroll-mt-[140px]"
          >
            <div className={`flex items-end justify-between ${isBebidas ? "pb-0 mb-3" : " pb-2 mb-6"}`}>
              <h2 className="text-2xl md:text-3xl font-friz uppercase text-foreground leading-none">
                {renderSplitTitle(t(category.name, category.name_en))}
              </h2>
              {displayMode !== "all_right" && commonPrice !== null && (
                <span className="text-2xl md:text-3xl font-friz text-foreground ml-4 pb-0.5">
                  {commonPrice}
                </span>
              )}
            </div>
            {t(category.description, category.description_en) && (
              <p className="text-sm md:text-base text-foreground/80 mb-6 font-serif">
                {t(category.description, category.description_en)}
              </p>
            )}
            <div>
              {category.meals.map((meal) => (
                <TappableMealRow
                  key={meal.id}
                  meal={meal}
                  t={t}
                  activeMenu={internalActiveMenu}
                  displayMode={displayMode}
                  commonPrice={commonPrice}
                />
              ))}
            </div>
          </div>
        );
      })}
      {internalActiveMenu === "bebidas" && position === "right" && (
        <div className="flex justify-end w-full mt-4">
          <div className="w-72 h-72 relative select-none pointer-events-none transition-transform hover:scale-105 duration-500">
            <Image
              src="/lasirenadejuan/images/sirena_1.svg"
              alt="Sirena"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderHorizontalCategories = (categories: Category[]) => (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 md:gap-12 pb-12 pt-4 scrollbar-none w-screen relative left-[50%] -ml-[50vw] px-[7.5vw] md:px-[auto] items-start">
      {categories.map((category) => {
        const { displayMode, commonPrice } = analyzeCategoryPrices(
          category,
          internalActiveMenu,
        );
        const catName = category.name.toLowerCase();
        const isEmpezar = catName.includes("empezar");
        const isVeganos = catName.includes("veganos") || catName.includes("para veganos");

        return (
          <div
            key={category.id}
            id={`cat-${category.id}`}
            className="snap-center shrink-0 w-[85vw] md:w-[400px] lg:w-[450px] flex flex-col justify-start"
          >
            <div className="flex items-end justify-between pb-4 mb-6 sticky top-0 bg-background/95 backdrop-blur-md z-10 pt-2 -mt-2">
              <h2 className="text-2xl md:text-3xl font-friz uppercase text-foreground leading-none">
                {renderSplitTitle(t(category.name, category.name_en))}
              </h2>
              {displayMode !== "all_right" && commonPrice !== null && (
                <span className="text-xl md:text-2xl font-friz text-foreground ml-4 pb-1">
                  {commonPrice}
                </span>
              )}
            </div>
            {t(category.description, category.description_en) && (
              <p className="text-xs md:text-sm text-foreground/70 mb-6 font-serif italic">
                {t(category.description, category.description_en)}
              </p>
            )}

            {isEmpezar ? (
              <div className="flex gap-4 items-start">
                {/* Spiral Icon on the left */}
                <div className="shrink-0 w-24 h-24 relative mt-1.5 select-none pointer-events-none opacity-85">
                  <Image
                    src="/lasirenadejuan/images/espiral.svg"
                    alt="Espiral"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  {category.meals.map((meal) => (
                    <TappableMealRow
                      key={meal.id}
                      meal={meal}
                      t={t}
                      activeMenu={internalActiveMenu}
                      displayMode={displayMode}
                      commonPrice={commonPrice}
                    />
                  ))}
                </div>
              </div>
            ) : isVeganos ? (
              <div className="flex flex-col justify-between h-full">
                <div className="flex flex-col gap-2">
                  {category.meals.map((meal) => (
                    <TappableMealRow
                      key={meal.id}
                      meal={meal}
                      t={t}
                      activeMenu={internalActiveMenu}
                      displayMode={displayMode}
                      commonPrice={commonPrice}
                    />
                  ))}
                </div>
                {/* Mermaid Mascot at the bottom right */}
                <div className="self-end w-57 h-57 relative mt-6 mr-2 select-none pointer-events-none opacity-90 transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/lasirenadejuan/images/sirena_2.svg"
                    alt="Sirena"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {category.meals.map((meal) => (
                  <TappableMealRow
                    key={meal.id}
                    meal={meal}
                    t={t}
                    activeMenu={internalActiveMenu}
                    displayMode={displayMode}
                    commonPrice={commonPrice}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const skinStyles: Record<string, string> = {
    principal: "bg-background text-foreground",
    bebidas: "bg-background text-foreground",
    nigiris: "bg-background text-foreground",
  };

  const currentSkin = skinStyles[internalActiveMenu] || skinStyles.principal;

  return (
    <div
      className={`w-full min-h-screen overflow-x-hidden relative pb-24 transition-colors duration-700 ${currentSkin}`}
    >
      {/* Decorative Elements based on Skin */}
      {internalActiveMenu === "principal" && (
        <div className="absolute top-40 -right-20 opacity-[0.03] pointer-events-none rotate-12">
          <Image
            src="/lasirenadejuan/images/sirena_2.svg"
            width={600}
            height={600}
            alt=""
          />
        </div>
      )}

      {internalActiveMenu === "nigiris" && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 opacity-[0.02] pointer-events-none">
          <Image
            src="/lasirenadejuan/images/logo.svg"
            width={800}
            height={800}
            alt=""
          />
        </div>
      )}

      {/* Menu Switcher (Mobile & Desktop) */}
      {restaurant.menuSections && restaurant.menuSections.length > 1 && (
        <div
          className="sticky top-0 z-50 backdrop-blur-md border-b border-foreground/10 px-4 py-3 flex gap-4 overflow-x-auto justify-center bg-background/80"
        >
          {restaurant.menuSections
            .filter((s) => s.isActive)
            .map((sec) => (
              <button
                key={sec.slug}
                onClick={() => router.push(`/lasirenadejuan/${sec.slug}`)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-avenir uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeMenu === sec.slug
                  ? "bg-foreground text-background shadow-lg scale-105"
                  : "bg-transparent text-foreground/60 border border-foreground/20 hover:border-foreground/40 hover:text-foreground"
                  }`}
              >
                {t(sec.name, sec.name_en)}
              </button>
            ))}
        </div>
      )}

      {/* Category In-Page Navigation (Mobile Only) */}
      {filteredCategories.length > 0 && (
        <div
          className="md:hidden sticky top-[57px] sm:top-[61px] z-40 backdrop-blur-md border-b px-4 py-2.5 flex gap-2.5 overflow-x-auto scrollbar-none shadow-sm bg-background/95 border-foreground/10"
        >
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const el = document.getElementById(`cat-${cat.id}`);
                if (el) {
                  if (internalActiveMenu === "carta") {
                    const container = el.parentElement;
                    if (container) {
                      const elementLeft = el.offsetLeft;
                      const elementWidth = el.clientWidth;
                      const containerWidth = container.clientWidth;
                      const scrollLeft = elementLeft - (containerWidth - elementWidth) / 2;
                      container.scrollTo({
                        left: scrollLeft,
                        behavior: "smooth",
                      });
                    }
                  } else {
                    el.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                      inline: "nearest",
                    });
                  }
                }
              }}
              className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-avenir uppercase tracking-widest active:scale-95 transition-all bg-foreground/5 text-foreground/80 border border-foreground/10 hover:bg-foreground/10"
            >
              {t(cat.name, cat.name_en)}
            </button>
          ))}
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-6 py-10 md:py-16 relative z-10">
        {internalActiveMenu === "carta" ? (
          renderHorizontalCategories(filteredCategories)
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            {renderColumn(left, "left")}
            {renderColumn(right, "right")}
          </div>
        )}

        {filteredCategories.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <p className="font-serif text-xl">
              Sin categorías disponibles en esta sección.
            </p>
          </div>
        )}
      </div>

      {internalActiveMenu !== "bebidas" && (
        <div className="flex justify-center mt-10 mb-20 relative z-10">
          <Image
            src="/lasirenadejuan/images/sirena_1.svg"
            width={120}
            height={120}
            alt="Sirena"
            className="opacity-40 hover:opacity-100 transition-opacity duration-700"
          />
        </div>
      )}

      {/* Floating Action Group (Home & Language) */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        <button
          onClick={() => toggleLanguage()}
          className="w-12 h-12 rounded-full bg-background border border-foreground/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-foreground/80 hover:text-foreground hover:border-foreground/40 transition-all duration-300 active:scale-90"
          aria-label="Toggle Language"
        >
          <span className="text-xs font-avenir font-bold tracking-widest leading-none mt-[2px]">
            {language === "en" ? "ES" : "EN"}
          </span>
        </button>

        <button
          onClick={() => router.push("/lasirenadejuan")}
          className="w-12 h-12 rounded-full bg-foreground text-background shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center hover:bg-foreground/90 transition-all duration-300 active:scale-90"
          aria-label="Home"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      <OrderFloatingButton restaurantPhone={restaurant.phone || ""} />
      {showOnboarding && <CartOnboardingAlert onDismiss={dismissOnboarding} />}
    </div>
  );
}

export default function Carta(props: CartaProps) {
  return (
    <LanguageProvider>
      <CartProvider>
        <SirenaContent {...props} />
      </CartProvider>
    </LanguageProvider>
  );
}
