import { Schema, model, models } from "mongoose";

const SystemMessageSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    // placement: Identificador único para saber DÓNDE mostrarlo en el frontend
    // Ejemplos: 'global_footer', 'pizza_menu_header', 'cart_warning'
    placement: {
      type: String,
      required: true,
      trim: true,
    },
    // Tipo de mensaje para estilos visuales (info = azul, warning = amarillo, alert = rojo)
    type: {
      type: String,
      enum: ["info", "warning", "alert", "promotion"],
      default: "info",
    },
    content: {
      type: String,
      required: true, // Contenido en Español
    },
    content_en: {
      type: String,
      default: "", // Contenido en Inglés
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0, // Por si hay varios mensajes en el mismo placement
    },
  },
  {
    timestamps: true,
  }
);

// Evitar duplicados de compilación en Next.js
const SystemMessage =
  models.SystemMessage || model("SystemMessage", SystemMessageSchema);

export default SystemMessage;
