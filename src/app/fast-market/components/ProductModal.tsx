"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { X } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Lilita_One, Nunito } from "next/font/google";

const lilitaOne = Lilita_One({
  subsets: ["latin"],
  weight: "400",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

interface Meal {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
}

interface ProductModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({
  meal,
  isOpen,
  onClose,
}: ProductModalProps) {
  if (!meal) return null;

  const image = meal.images?.find((img) => img.url) || meal.images?.[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`sm:max-w-md p-0 overflow-hidden bg-white border-none shadow-xl ${nunito.className}`}
        showCloseButton={false}
      >
        <div className="relative w-full h-64 sm:h-72 bg-slate-50">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || meal.name}
              fill
              className="object-contain p-8"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <span className="text-sm">Sin imagen</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4 text-left">
            <DialogTitle
              className={`text-xl font-bold text-slate-900 mb-2 ${lilitaOne.className}`}
            >
              {meal.name}
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-sm leading-relaxed">
              {meal.description || "Sin descripción disponible."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <div className="flex flex-col">
              {meal.comparePrice && meal.comparePrice < meal.price && (
                <span className="text-xs text-slate-400 line-through mb-0.5">
                  {formatPrice(meal.price)}
                </span>
              )}
              <span className="text-2xl font-bold text-blue-600">
                {formatPrice(
                  meal.comparePrice && meal.comparePrice < meal.price
                    ? meal.comparePrice
                    : meal.price
                )}
              </span>
            </div>

            <AddToCartButton
              meal={{
                id: meal.id || meal._id,
                name: meal.name,
                price:
                  meal.comparePrice && meal.comparePrice < meal.price
                    ? meal.comparePrice
                    : meal.price,
              }}
              className="h-12 px-6 rounded-xl"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
