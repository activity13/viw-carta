import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la categoría es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    name_en: {
      type: String,
      trim: true,
    },
    code: {
      type: Number,
      required: [true, "El código de la categoría es obligatorio"],
      trim: true,
      maxlength: [10, "El código no puede exceder 10 caracteres"],
    },
    slug: {
      type: String,
      required: [true, "El slug de la categoría es obligatorio"],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "La descripción no puede exceder 300 caracteres"],
      default: "",
    },
    description_en: {
      type: String,
      trim: true,
      maxlength: [300, "La descripción no puede exceder 300 caracteres"],
      default: "",
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    order: {
      type: Number,
      required: false,
      default: 999,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index(
  { restaurantId: 1, code: 1, slug: 1, order: 1 },
  { unique: true }
);

const Categories = models.Categories || model("Categories", CategorySchema);

export default Categories;
