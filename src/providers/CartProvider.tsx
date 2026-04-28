"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { generateOrderIdentity, OrderIdentity } from "@/utils/orderIdentity";

export interface CartItem {
  mealId: string;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
  quantity: number | string;
}

interface CartContextType {
  items: CartItem[];
  identity: OrderIdentity | null;
  addToCart: (product: { id: string; name: string; name_en?: string; price: number; description?: string; description_en?: string }) => void;
  removeFromCart: (mealId: string) => void;
  updateQuantity: (mealId: string, quantity: number | string) => void;
  removeItem: (mealId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "viw_cart_storage";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [identity, setIdentity] = useState<OrderIdentity | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setItems(parsed.items || []);
        setIdentity(parsed.identity || null);
      } catch (e) {
        console.error("Failed to parse cart data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever items or identity changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, identity }));
  }, [items, identity, isLoaded]);

  const addToCart = (product: { id: string; name: string; name_en?: string; price: number; description?: string; description_en?: string }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.mealId === product.id);

      // Generate identity if it doesn't exist (First product added)
      if (!identity) {
        setIdentity(generateOrderIdentity());
      }

      if (existing) {
        return prev.map((i) => {
          if (i.mealId === product.id) {
            const q = typeof i.quantity === "number" ? i.quantity : parseFloat(i.quantity as string) || 0;
            return { ...i, quantity: q + 1 };
          }
          return i;
        });
      }
      return [
        ...prev,
        {
          mealId: product.id,
          name: product.name,
          name_en: product.name_en,
          price: product.price,
          description: product.description,
          description_en: product.description_en,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (mealId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.mealId === mealId);
      if (existing) {
        const q = typeof existing.quantity === "number" ? existing.quantity : parseFloat(existing.quantity as string) || 0;
        if (q > 1) {
          return prev.map((i) =>
            i.mealId === mealId ? { ...i, quantity: Math.max(0, q - 1) } : i
          );
        }
      }
      return prev.filter((i) => i.mealId !== mealId);
    });
  };

  const updateQuantity = (mealId: string, quantity: number | string) => {
    setItems((prev) => {
      if (typeof quantity === "number" && quantity < 0) {
        return prev.filter((i) => i.mealId !== mealId);
      }
      return prev.map((i) =>
        i.mealId === mealId ? { ...i, quantity } : i
      );
    });
  };

  const removeItem = (mealId: string) => {
    setItems((prev) => prev.filter((i) => i.mealId !== mealId));
  };

  const clearCart = () => {
    setItems([]);
    setIdentity(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const totalItems = items.reduce((acc, item) => {
    const q = typeof item.quantity === "number" ? item.quantity : parseFloat(item.quantity as string) || 0;
    return acc + q;
  }, 0);
  const totalPrice = items.reduce((acc, item) => {
    const q = typeof item.quantity === "number" ? item.quantity : parseFloat(item.quantity as string) || 0;
    return acc + item.price * q;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        identity,
        addToCart,
        removeFromCart,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
