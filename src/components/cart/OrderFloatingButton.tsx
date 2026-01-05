"use client";

import React, { useState } from "react";
import { useCart } from "@/providers/CartProvider";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { OrderSummaryModal } from "./OrderSummaryModal";
import { cn } from "@/lib/utils";

interface OrderFloatingButtonProps {
  restaurantPhone: string;
}

export const OrderFloatingButton = ({
  restaurantPhone,
}: OrderFloatingButtonProps) => {
  const { totalItems, totalPrice } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (totalItems === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-90 animate-in fade-in slide-in-from-bottom-4">
        <Button
          size="lg"
          className={cn(
            "h-14 rounded-full shadow-lg flex items-center gap-3 px-6",
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => setIsModalOpen(true)}
        >
          <div className="relative">
            <Receipt className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {totalItems}
            </span>
          </div>
          <span className="font-bold text-lg">S/.{totalPrice.toFixed(2)}</span>
        </Button>
      </div>

      <OrderSummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantPhone={restaurantPhone}
      />
    </>
  );
};
