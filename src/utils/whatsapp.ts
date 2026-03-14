import { CartItem } from "@/providers/CartProvider";
import { OrderIdentity } from "@/utils/orderIdentity";

export const generateWhatsAppLink = (
  phone: string,
  items: CartItem[],
  identity: OrderIdentity | null,
  totalPrice: number
) => {
  if (!phone || items.length === 0) return "";

  // Clean phone number (remove spaces, dashes, +, etc)
  const cleanPhone = phone.replace(/\D/g, "");

  let message = `Hola! Pedido #${identity?.shortId || "0000"}\n\n`;
  message += `Me gustaría pedir:\n`;

  items.forEach((item) => {
    const q = Number(item.quantity) || 0;
    if (q > 0) {
      message += `• ${q}x ${item.name} -S/.${(
        item.price * q
      ).toFixed(2)}\n`;
    }
  });

  message += `\n*Total: S/.${totalPrice.toFixed(2)}*`;
  message += `\n\nEspero confirmación. Gracias!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
