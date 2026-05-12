import { Pizza, Utensils, MessageCircle } from "lucide-react";

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
    <div className="fixed bottom-18 right-4 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg px-3 py-2">
      {/* Botón Carta Principal */}
      <button
        onClick={() => onChange("principal")}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
          activeMenu === "principal"
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
        title="Carta Principal"
      >
        <Utensils className="w-5 h-5" />
      </button>

      {/* Botón Carta Pizzas */}
      <button
        onClick={() => onChange("pizzas")}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
          activeMenu === "pizzas"
            ? "bg-black text-white"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
        title="Carta de Pizzas"
      >
        <Pizza className="w-5 h-5" />
      </button>

      {/* Línea divisora */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Botón WhatsApp */}
      <a
        href={`https://wa.me/${phoneNumber}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-full shadow-md hover:scale-105 hover:bg-green-600 transition-all duration-200"
        title="Escríbenos por WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
