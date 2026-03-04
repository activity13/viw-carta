"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageToggle from "@/components/LanguageToggle";
import { applyRestaurantTheme, getDefaultTheme } from "@/utils/colorPalettes";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Globe,
  Search,
  Store,
  ShoppingCart,
  Minus,
  Plus,
  X,
  MessageCircle,
  ChevronRight,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/CartProvider";
import { MealDetailModal } from "./MealDetailModal";

interface Meal {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
}

interface Category {
  id: string;
  name: string;
  name_en?: string;
  meals: Meal[];
}

interface StoreCatalogProps {
  data: { categories: Category[] };
  restaurant: {
    name: string;
    slug: string;
    phone: string;
    direction?: string;
    location?: string;
    description?: string;
    image: string;
    theme?: {
      palette?: string;
      customColors?: Record<string, string>;
    };
  };
}

// ─── Cart Drawer ────────────────────────────────────────────────────────────
function CartDrawer({
  isOpen,
  onClose,
  restaurantPhone,
  restaurantName,
}: {
  isOpen: boolean;
  onClose: () => void;
  restaurantPhone: string;
  restaurantName: string;
}) {
  const {
    items,
    addToCart,
    removeFromCart,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();

  const sendWhatsApp = () => {
    const lines = items.map(
      (item) =>
        `• ${item.name} x${item.quantity} — S/ ${(item.price * item.quantity).toFixed(2)}`,
    );
    const msg = [
      `Hola ${restaurantName}! Quisiera hacer el siguiente pedido:`,
      "",
      ...lines,
      "",
      `*Total: S/ ${totalPrice.toFixed(2)}*`,
    ].join("\n");
    const phone = restaurantPhone.replace(/\D/g, "");
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-background shadow-2xl flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Tu Pedido</h2>
            {totalItems > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.mealId}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    S/ {item.price.toFixed(2)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => removeFromCart(item.mealId)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      addToCart({
                        id: item.mealId,
                        name: item.name,
                        price: item.price,
                      })
                    }
                    className="w-7 h-7 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-primary" />
                  </button>
                </div>
                <span className="text-sm font-bold shrink-0 w-16 text-right">
                  S/ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-5 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold text-lg">
                S/ {totalPrice.toFixed(2)}
              </span>
            </div>

            <Button
              className="w-full gap-2 bg-[#25D366] hover:bg-[#20b857] text-white rounded-full h-12 text-base font-semibold shadow-lg"
              onClick={sendWhatsApp}
            >
              <MessageCircle className="w-5 h-5" />
              Pedir por WhatsApp
            </Button>

            <button
              onClick={clearCart}
              className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors text-center py-1"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────
function ProductCard({
  meal,
  language,
  onOpenModal,
}: {
  meal: Meal;
  language: string;
  onOpenModal: (meal: Meal) => void;
}) {
  const { items, addToCart, removeFromCart } = useCart();
  const cartItem = items.find((i) => i.mealId === meal.id);
  const quantity = cartItem?.quantity || 0;
  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  const name = t(meal.name, meal.name_en);
  const desc = t(meal.description, meal.description_en);
  const hasDiscount = meal.comparePrice && meal.comparePrice > meal.price;
  const discountPct = hasDiscount
    ? Math.round((1 - meal.price / meal.comparePrice!) * 100)
    : 0;

  return (
    <div className="group bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden cursor-pointer bg-muted"
        onClick={() => onOpenModal(meal)}
      >
        {meal.images && meal.images.length > 0 ? (
          <Image
            src={meal.images[0].url}
            alt={meal.images[0].alt || name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="w-10 h-10 text-muted-foreground/20" />
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Tag className="w-2.5 h-2.5" />-{discountPct}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <button
          onClick={() => onOpenModal(meal)}
          className="text-left mb-1 flex-1"
        >
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
            {name}
          </h3>
          {desc && desc.trim() && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 whitespace-pre-line">
              {desc.trim().replace(/\\n/g, "\n")}
            </p>
          )}
        </button>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-3 mt-1">
          <span className="font-bold text-primary text-base">
            S/ {meal.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              S/ {meal.comparePrice!.toFixed(2)}
            </span>
          )}
        </div>

        {/* Cart controls */}
        {quantity === 0 ? (
          <Button
            size="sm"
            className="w-full rounded-full text-xs h-8"
            onClick={() => addToCart({ id: meal.id, name, price: meal.price })}
          >
            <Plus className="w-3 h-3 mr-1" />
            Agregar
          </Button>
        ) : (
          <div className="flex items-center justify-between bg-primary/10 rounded-full px-3 py-1.5">
            <button
              onClick={() => removeFromCart(meal.id)}
              className="w-5 h-5 rounded-full bg-background flex items-center justify-center shadow-sm"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-bold text-primary">{quantity}</span>
            <button
              onClick={() =>
                addToCart({ id: meal.id, name, price: meal.price })
              }
              className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root component ─────────────────────────────────────────────────────────
export default function StoreCatalog({ data, restaurant }: StoreCatalogProps) {
  const { language } = useLanguage();
  const [activeCat, setActiveCat] = useState("__all__");
  const [search, setSearch] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const { totalItems, totalPrice } = useCart();

  const theme = restaurant.theme || {};
  const t = (es?: string, en?: string) =>
    language === "en" && en ? en : es || "";

  useEffect(() => {
    if (theme.palette) {
      applyRestaurantTheme({
        palette: theme.palette,
        customColors: theme.customColors,
      });
    } else {
      applyRestaurantTheme(getDefaultTheme());
    }
    return () => {
      document.getElementById("restaurant-theme")?.remove();
    };
  }, [theme]);

  const allMeals = useMemo(
    () =>
      data.categories.flatMap((cat) =>
        cat.meals.map((m) => ({ ...m, _catId: cat.id })),
      ),
    [data.categories],
  );

  const filteredMeals = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      return activeCat === "__all__"
        ? allMeals
        : allMeals.filter((m) => m._catId === activeCat);
    }
    return allMeals.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.name_en?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q),
    );
  }, [search, activeCat, allMeals]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-4">
          {/* Logo */}
          <div className="w-14 h-14 rounded-2xl border overflow-hidden relative shrink-0 bg-muted">
            {restaurant.image ? (
              <Image
                src={
                  restaurant.image.startsWith("http")
                    ? restaurant.image
                    : `/${restaurant.slug}/images/${restaurant.image}`
                }
                alt={restaurant.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Store className="w-7 h-7 text-primary" />
              </div>
            )}
          </div>

          {/* Name & description */}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {restaurant.description.trim()}
              </p>
            )}
          </div>

          {/* Language + Cart */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle />
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <>
                  <span className="hidden sm:inline">
                    S/ {totalPrice.toFixed(2)}
                  </span>
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center sm:hidden">
                    {totalItems}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder={
                language === "en" ? "Search products..." : "Buscar productos..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Category tabs */}
      {!search && (
        <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCat("__all__")}
              className={cn(
                "shrink-0 text-xs font-medium px-4 py-1.5 rounded-full border transition-all whitespace-nowrap",
                activeCat === "__all__"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {language === "en" ? "All" : "Todo"}
            </button>
            {data.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={cn(
                  "shrink-0 text-lg font-medium px-4 py-2 rounded-full border transition-all whitespace-nowrap",
                  activeCat === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-gray-900/50 text-gray-300 border border-gray-800/50 hover:bg-gray-800/70 hover:border-gray-700",
                )}
              >
                {t(cat.name, cat.name_en)}
                <span className="ml-1.5 opacity-60">{cat.meals.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row relative">
        {/* Desktop Sidebar */}
        {!search && (
          <aside className="hidden md:block w-64 shrink-0 py-8 pr-6 sticky top-0 self-start h-screen overflow-y-auto z-30 scrollbar-hide">
            <nav className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
                Categorías
              </h3>
              <button
                onClick={() => setActiveCat("__all__")}
                className={cn(
                  "text-left text-sm font-medium px-4 py-2.5 rounded-xl transition-all",
                  activeCat === "__all__"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {language === "en" ? "All" : "Todo"}
              </button>
              {data.categories.map((cat) => (
                <button
                  key={`side-${cat.id}`}
                  onClick={() => setActiveCat(cat.id)}
                  className={cn(
                    "flex items-center justify-between text-left text-sm font-medium px-4 py-2.5 rounded-xl transition-all",
                    activeCat === cat.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span className="truncate">{t(cat.name, cat.name_en)}</span>
                  <span className="text-xs opacity-60 ml-2">
                    {cat.meals.length}
                  </span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Product grid */}
        <main
          className={cn(
            "flex-1 min-w-0 px-4 py-6 md:py-8",
            !search && "md:border-l md:pl-8 lg:pl-12",
          )}
        >
          {search && (
            <p className="text-sm text-muted-foreground mb-4">
              {filteredMeals.length} resultado
              {filteredMeals.length !== 1 ? "s" : ""} para &ldquo;{search}
              &rdquo;
            </p>
          )}

          {filteredMeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <Store className="w-12 h-12 opacity-20" />
              <p className="text-sm">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredMeals.map((meal) => (
                <ProductCard
                  key={meal.id}
                  meal={meal}
                  language={language}
                  onOpenModal={setSelectedMeal}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-start text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">
              {restaurant.name}
            </p>
            {restaurant.description && (
              <p className="text-xs max-w-xs">
                {restaurant.description.trim()}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4" />
              {restaurant.phone}
            </a>
            {restaurant.direction && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{restaurant.direction}</span>
              </div>
            )}
            {restaurant.location && (
              <a
                href={restaurant.location}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Globe className="w-4 h-4" />
                <ChevronRight className="w-3 h-3" />
                Ver en Mapa
              </a>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {restaurant.name}. Powered by{" "}
          <span className="text-primary font-semibold">Viw Carta</span>
        </div>
      </footer>

      {/* Floating CTA (mobile only when cart has items) */}
      {totalItems > 0 && (
        <div className="fixed bottom-5 left-0 right-0 flex justify-center z-30 lg:hidden px-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 bg-[#25D366] text-white rounded-full px-6 py-3 shadow-xl font-semibold text-sm animate-in fade-in slide-in-from-bottom-3"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Ver pedido · S/ {totalPrice.toFixed(2)}</span>
            <span className="bg-white/30 rounded-full px-2 py-0.5 text-xs font-bold">
              {totalItems}
            </span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        restaurantPhone={restaurant.phone}
        restaurantName={restaurant.name}
      />

      {/* Product Detail Modal */}
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          language={language}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </div>
  );
}
