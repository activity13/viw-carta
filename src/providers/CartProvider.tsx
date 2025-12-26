"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { generateOrderIdentity, OrderIdentity } from "@/utils/orderIdentity";

export interface CartItem {
  mealId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  identity: OrderIdentity | null;
  addToCart: (product: { id: string; name: string; price: number }) => void;
  removeFromCart: (mealId: string) => void;
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

    if (items.length === 0) {
      // Optional: Clear identity when cart is empty?
      // For now, let's keep it or maybe clear it.
      // User requirement: "paso 1 seleccionar el primer producto... genera la orden"
      // So if cart is empty, maybe we reset identity?
      // Let's keep identity if it exists, or reset if we want a fresh start.
      // If items are empty, we might want to clear storage to be clean,
      // but keeping identity allows re-adding without changing name.
      // Let's persist.
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, identity }));
  }, [items, identity, isLoaded]);

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.mealId === product.id);

      // Generate identity if it doesn't exist (First product added)
      if (!identity) {
        setIdentity(generateOrderIdentity());
      }

      if (existing) {
        return prev.map((i) =>
          i.mealId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          mealId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (mealId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.mealId === mealId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.mealId === mealId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.mealId !== mealId);
    });
  };

  const clearCart = () => {
    setItems([]);
    setIdentity(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        identity,
        addToCart,
        removeFromCart,
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
