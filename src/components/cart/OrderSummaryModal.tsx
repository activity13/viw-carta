"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/providers/CartProvider";
import { generateWhatsAppLink } from "@/utils/whatsapp";
import { Send, Plus, Minus } from "lucide-react";

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantPhone: string;
}

export const OrderSummaryModal = ({
  isOpen,
  onClose,
  restaurantPhone,
}: OrderSummaryModalProps) => {
  const { items, identity, totalPrice, addToCart, removeFromCart, clearCart } =
    useCart();

  const handleSendOrder = () => {
    const link = generateWhatsAppLink(
      restaurantPhone,
      items,
      identity,
      totalPrice
    );
    window.open(link, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-white text-slate-900 z-100 p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-2">
            <span>Tu Pedido</span>
            {identity && (
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md self-start">
                #{identity.shortId} • {identity.codeName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Revisa tu selección antes de enviar el pedido por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-8">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Tu carrito está vacío.
            </p>
          ) : (
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.mealId}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      S/.{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white rounded-full p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => removeFromCart(item.mealId)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-4 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() =>
                          addToCart({
                            id: item.mealId,
                            name: item.name,
                            price: item.price,
                          })
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:justify-between gap-2">
          <div className="flex justify-between items-center w-full mb-4 sm:mb-0">
            <span className="font-bold text-lg">Total:</span>
            <span className="font-bold text-lg">
              S/.{totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={clearCart}>
              Limpiar
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSendOrder}
              disabled={items.length === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              Pedir por WhatsApp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
