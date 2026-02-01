import mongoose from "mongoose";

const VariantTemplateSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    title_en: {
      type: String,
    },
    type: {
      type: String,
      enum: ["single", "multiple"],
      default: "single",
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    replacesBasePrice: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        name: String,
        name_en: String,
        price: Number, // Usado si replacesBasePrice es true
        priceModifier: Number, // Usado si replacesBasePrice es false (adicional)
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.VariantTemplate ||
  mongoose.model("VariantTemplate", VariantTemplateSchema);
