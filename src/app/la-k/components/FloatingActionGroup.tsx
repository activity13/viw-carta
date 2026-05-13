import { Pizza, Utensils, MessageCircle } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";

type MenuType = "principal" | "pizzas";

interface FloatingActionGroupProps {
  restaurant: { phone?: string };
  activeMenu: MenuType;
  onChange: (menu: MenuType) => void;
}

export default function FloatingActionGroup({
  restaurant,
  activeMenu,
  onChange,
}: FloatingActionGroupProps) {
  const phoneData = restaurant.phone || "";
  const phoneNumber = phoneData.replace(/\s+/g, "").trim();
  const message = encodeURIComponent(
    "¡Hola! Quisiera hacer un pedido del restaurante La K. Estoy en: "
  );

  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-black/5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-2 py-1.5 transition-all duration-300">
      <div className="flex items-center gap-1.5">
        {/* Botón Carta Principal */}
        <button
          onClick={() => onChange("principal")}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
            activeMenu === "principal"
              ? "bg-black text-white shadow-md scale-105"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          title="Carta Principal"
        >
          <Utensils className="w-4 h-4" />
        </button>

        {/* Botón Carta Pizzas */}
        <button
          onClick={() => onChange("pizzas")}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
            activeMenu === "pizzas"
              ? "bg-black text-white shadow-md scale-105"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          title="Carta de Pizzas"
        >
          <Pizza className="w-4 h-4" />
        </button>
      </div>

      {/* Línea divisora */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Cambio de Idioma */}
      <div className="scale-90">
        <LanguageToggle />
      </div>

      {/* Línea divisora */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Botón WhatsApp */}
      <a
        href={`https://wa.me/${phoneNumber}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-9 h-9 bg-[#25D366] text-white rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all duration-200"
        title="Escríbenos por WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
      </a>
    </div>
  );
}
