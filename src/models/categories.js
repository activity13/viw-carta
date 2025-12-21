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
    name_en_manual: {
      type: Boolean,
      default: false,
    },
    code: {
      type: String,
      required: [true, "El código de la categoría es obligatorio"],
      trim: true,
      maxlength: [20, "El código no puede exceder 20 caracteres"],
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
    description_en_manual: {
      type: Boolean,
      default: false,
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
  { restaurantId: 1, slug: 1 },
  { unique: true, sparse: true }
); // slug único por restaurante
CategorySchema.index(
  { restaurantId: 1, code: 1 },
  { unique: true, sparse: true }
); // code único por restaurante
CategorySchema.index({ restaurantId: 1, order: 1 }, { sparse: true }); // para ordenamiento

// Limpiar el modelo del cache si existe para evitar conflictos de schema
delete models.Categories;

const Categories = model("Categories", CategorySchema);

// Eliminar índices antiguos problemáticos y crear los nuevos
Categories.collection
  .dropIndexes()
  .then(() => {
    console.log("Índices antiguos eliminados");

    // Crear solo los índices que necesitamos
    Categories.collection.createIndex(
      { restaurantId: 1, slug: 1 },
      { unique: true, name: "restaurant_slug_unique" }
    );

    Categories.collection.createIndex(
      { restaurantId: 1, code: 1 },
      { unique: true, name: "restaurant_code_unique" }
    );

    Categories.collection.createIndex(
      { restaurantId: 1, order: 1 },
      { name: "restaurant_order" }
    );
  })
  .catch((err) => {
    console.log("Error managing indexes:", err.message);
  });

export default Categories;
