"use client";

import React from "react";
import Image from "next/image";
import { X, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { cn } from "@/lib/utils";

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

interface MealDetailModalProps {
  meal: Meal | null;
  language: string;
  onClose: () => void;
}

export function MealDetailModal({
  meal,
  language,
  onClose,
}: MealDetailModalProps) {
  if (!meal) return null;

  const name = language === "en" && meal.name_en ? meal.name_en : meal.name;
  const description =
    language === "en" && meal.description_en
      ? meal.description_en
      : meal.description;
  const hasImage = meal.images && meal.images.length > 0;
  const hasDiscount = meal.comparePrice && meal.comparePrice > meal.price;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full bg-background shadow-2xl overflow-hidden",
          "sm:max-w-lg sm:rounded-2xl",
          "rounded-t-3xl max-h-[92vh] flex flex-col",
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full bg-background/80 backdrop-blur p-1.5 shadow-md hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        {hasImage ? (
          <div className="relative w-full aspect-video shrink-0">
            <Image
              src={meal.images![0].url}
              alt={meal.images![0].alt || name}
              fill
              className="object-cover"
              unoptimized
            />
            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
                OFERTA
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-video bg-muted flex items-center justify-center shrink-0">
            <ChefHat className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4 p-5 overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold leading-tight">{name}</h2>

            {/* Price row */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-primary">
                S/ {meal.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-base text-muted-foreground line-through">
                  S/ {meal.comparePrice!.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {description && description.trim() && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {description.trim().replace(/\\n/g, "\n")}
            </p>
          )}

          {/* CTA */}
          <AddToCartButton meal={meal} className="w-full mt-2" />
        </div>
      </div>
    </div>
  );
}
