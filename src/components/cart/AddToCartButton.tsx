"use client";

import React from "react";
import { useCart } from "@/providers/CartProvider";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  meal: {
    id: string;
    name: string;
    price: number;
  };
  className?: string;
}

export const AddToCartButton = ({ meal, className }: AddToCartButtonProps) => {
  const { items, addToCart, removeFromCart } = useCart();
  const cartItem = items.find((item) => item.mealId === meal.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  if (quantity > 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="icon"
          className="h-5 w-5 sm:h-8 sm:w-8 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            removeFromCart(meal.id);
          }}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-4 text-center font-medium">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-5 w-5 sm:h-8 sm:w-8 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(meal);
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      className={cn("rounded-full px-3 sm:px-4", className)}
      onClick={(e) => {
        e.stopPropagation();
        addToCart(meal);
      }}
    >
      <Plus className="sm:mr-2 h-4 w-4" />
      <span className="hidden sm:inline">Agregar</span>
    </Button>
  );
};
