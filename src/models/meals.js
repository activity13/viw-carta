// models/Meal.js
import { Schema, model, models } from "mongoose";

// Sub-schema para variantes/opciones
const VariantOptionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  }, // "Grande", "Mediano", "Picante", "Sin cebolla"
  priceModifier: {
    type: Number,
    default: 0,
  }, // +5.00, -2.50, 0
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

// Sub-schema para grupos de variantes
const VariantGroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  }, // "Tamaño", "Nivel de picante", "Extras"
  type: {
    type: String,
    enum: ["single", "multiple"], // single = radio buttons, multiple = checkboxes
    default: "single",
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
  options: [VariantOptionSchema],
  order: {
    type: Number,
    default: 0,
  },
});

// Sub-schema para horarios de disponibilidad
const AvailabilityScheduleSchema = new Schema(
  {
    monday: {
      isAvailable: { type: Boolean, default: true },
      timeSlots: [
        {
          start: String, // "08:00"
          end: String, // "22:00"
        },
      ],
    },
    tuesday: {
      isAvailable: { type: Boolean, default: true },
      timeSlots: [
        {
          start: String,
          end: String,
        },
      ],
    },
    wednesday: {
      isAvailable: { type: Boolean, default: true },
      timeSlots: [
        {
          start: String,
          end: String,
        },
      ],
    },
    thursday: {
      isAvailable: { type: Boolean, default: true },
      timeSlots: [
        {
          start: String,
          end: String,
        },
      ],
    },
    friday: {
      isAvailable: { type: Boolean, default: true },
      timeSlots: [
        {
          start: String,
          end: String,
        },
      ],
    },
    saturday: {
      isAvailable: { type: Boolean, default: true },
      timeSlots: [
        {
          start: String,
          end: String,
        },
      ],
    },
    sunday: {
      isAvailable: { type: Boolean, default: true },
      timeSlots: [
        {
          start: String,
          end: String,
        },
      ],
    },
  },
  { _id: false }
);

// Sub-schema para información nutricional
const NutritionSchema = new Schema(
  {
    calories: {
      type: Number,
      min: 0,
    },
    protein: {
      type: Number,
      min: 0,
    }, // gramos
    carbohydrates: {
      type: Number,
      min: 0,
    }, // gramos
    fat: {
      type: Number,
      min: 0,
    }, // gramos
    fiber: {
      type: Number,
      min: 0,
    }, // gramos
    sugar: {
      type: Number,
      min: 0,
    }, // gramos
    sodium: {
      type: Number,
      min: 0,
    }, // miligramos
    servingSize: {
      type: String,
      trim: true,
    }, // "1 porción (250g)"
  },
  { _id: false }
);

// Schema principal del plato
const MealSchema = new Schema(
  {
    // Información básica
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Datos del plato
    name: {
      type: String,
      required: [true, "El nombre del plato es obligatorio"],
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
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    }, // auto-generado: "ceviche-mixto-123"
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    description_en: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    description_en_manual: {
      type: Boolean,
      default: false,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [100, "La descripción corta no puede exceder 100 caracteres"],
    }, // para móviles
    shortDescription_en: {
      type: String,
      trim: true,
      maxlength: [100, "La descripción corta no puede exceder 100 caracteres"],
    },
    shortDescription_en_manual: {
      type: Boolean,
      default: false,
    },
    // Precios
    basePrice: {
      type: Number,
      required: [true, "El precio base es obligatorio"],
      min: [0, "El precio no puede ser negativo"],
    },
    comparePrice: {
      type: Number,
      min: 0,
    }, // precio "tachado" para ofertas
    // Medios
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "",
        },
        alt_en: {
          type: String,
          default: "",
        },
        alt_en_manual: {
          type: Boolean,
          default: false,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Ingredientes y alérgenos
    ingredients: [
      {
        type: String,
        trim: true,
      },
    ], // ["Pescado fresco", "Cebolla roja", "Ají amarillo"]
    ingredients_en: [
      {
        type: String,
        trim: true,
      },
    ],
    ingredients_en_manual: {
      type: Boolean,
      default: false,
    },
    allergens: [
      {
        type: String,
        enum: [
          "gluten",
          "lactosa",
          "nueces",
          "maní",
          "huevos",
          "soya",
          "fish",
          "mariscos",
          "ajonjolí",
        ],
      },
    ],
    allergens_en: [
      {
        type: String,
        enum: [
          "gluten",
          "lactosa",
          "nueces",
          "maní",
          "huevos",
          "soya",
          "fish",
          "mariscos",
          "ajonjolí",
        ],
      },
    ],
    allergens_en_manual: {
      type: Boolean,
      default: false,
    },
    // Etiquetas dietéticas
    dietaryTags: [
      {
        type: String,
        enum: [
          "vegetariano",
          "vegano",
          "gluten-free",
          "dairy-free",
          "keto",
          "bajos-carbs",
          "alta-proteina",
          "organico",
          "picante",
          "mild",
          "recomendación-chef",
        ],
      },
    ],
    dietaryTags_en: [
      {
        type: String,
        enum: [
          "vegetariano",
          "vegano",
          "gluten-free",
          "dairy-free",
          "keto",
          "bajos-carbs",
          "alta-proteina",
          "organico",
          "picante",
          "mild",
          "recomendación-chef",
        ],
      },
    ],
    dietaryTags_en_manual: {
      type: Boolean,
      default: false,
    },
    // Variantes y personalizaciones
    variants: [VariantGroupSchema],

    // Disponibilidad
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      availableQuantity: {
        type: Number,
        min: 0,
      }, // para platos limitados
      schedule: AvailabilityScheduleSchema,
      seasonalAvailability: {
        startDate: Date, // para platos estacionales
        endDate: Date,
      },
    },

    // Información nutricional
    nutrition: NutritionSchema,

    // Tiempo de preparación
    preparationTime: {
      min: {
        type: Number,
        min: 0,
      }, // minutos mínimos
      max: {
        type: Number,
        min: 0,
      }, // minutos máximos
    },

    // Configuración de visualización
    display: {
      order: {
        type: Number,
        default: 0,
      }, // orden en la categoría
      isFeatured: {
        type: Boolean,
        default: false,
      }, // destacado en homepage
      showInMenu: {
        type: Boolean,
        default: true,
      },
    },

    // Estado y metadata
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "archived"],
      default: "active",
    },

    // Métricas (se actualizan por separado)
    metrics: {
      viewCount: {
        type: Number,
        default: 0,
      },
      orderCount: {
        type: Number,
        default: 0,
      },
      rating: {
        average: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    },

    // SEO y búsqueda
    searchTags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ], // palabras clave para búsqueda interna
    searchTags_en: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    serchTags_en_manual: {
      type: Boolean,
      default: false,
    },
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastOrderedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices compuestos para queries eficientes
MealSchema.index({ restaurantId: 1, categoryId: 1, "display.order": 1 });
MealSchema.index({ restaurantId: 1, status: 1, "availability.isAvailable": 1 });
MealSchema.index({ restaurantId: 1, "display.isFeatured": 1 });
MealSchema.index({ name: "text", description: "text", searchTags: "text" });

// Virtual para precio final (considerando variantes)
MealSchema.virtual("finalPrice").get(function () {
  return this.comparePrice && this.comparePrice > this.basePrice
    ? this.comparePrice
    : this.basePrice;
});

// Virtual para imagen principal
MealSchema.virtual("primaryImage").get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary || this.images[0] || null;
});

// Middleware pre-save
MealSchema.pre("save", function (next) {
  // Auto-generar slug si no existe
  if (!this.slug && this.name) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-") +
      "-" +
      Date.now();
  }

  // Asegurar que solo una imagen sea primary
  if (this.images && this.images.length > 0) {
    let primaryCount = this.images.filter((img) => img.isPrimary).length;
    if (primaryCount === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryCount > 1) {
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }

  // Actualizar updatedAt
  this.updatedAt = new Date();
  next();
});

// Métodos de instancia
MealSchema.methods.isAvailableNow = function () {
  if (!this.availability.isAvailable) return false;

  const now = new Date();
  const dayName = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // "14:30"

  const daySchedule = this.availability.schedule[dayName];
  if (!daySchedule.isAvailable) return false;

  return daySchedule.timeSlots.some(
    (slot) => currentTime >= slot.start && currentTime <= slot.end
  );
};

MealSchema.methods.calculatePriceWithVariants = function (
  selectedVariants = []
) {
  let totalPrice = this.basePrice;

  selectedVariants.forEach((variantSelection) => {
    const variantGroup = this.variants.id(variantSelection.groupId);
    if (variantGroup) {
      variantSelection.optionIds.forEach((optionId) => {
        const option = variantGroup.options.id(optionId);
        if (option) {
          totalPrice += option.priceModifier;
        }
      });
    }
  });

  return Math.max(0, totalPrice);
};

// Métodos estáticos
MealSchema.statics.findAvailable = function (restaurantId, categoryId = null) {
  const query = {
    restaurantId,
    status: "active",
    "availability.isAvailable": true,
    "display.showInMenu": true,
  };

  if (categoryId) {
    query.categoryId = categoryId;
  }

  return this.find(query)
    .populate("categoryId", "name order")
    .sort({ "display.order": 1, name: 1 });
};

MealSchema.statics.findFeatured = function (restaurantId, limit = 6) {
  return this.find({
    restaurantId,
    status: "active",
    "availability.isAvailable": true,
    "display.isFeatured": true,
    "display.showInMenu": true,
  })
    .populate("categoryId", "name")
    .sort({ "metrics.orderCount": -1, "display.order": 1 })
    .limit(limit);
};
const Meal = models.Meal || model("Meal", MealSchema);

export default Meal;

// Ejemplo de uso:
/*
const ceviche = new Meal({
  restaurantId: "507f1f77bcf86cd799439011",
  categoryId: "507f1f77bcf86cd799439012",
  name: "Ceviche Mixto",
  description: "Pescado y mariscos frescos marinados en leche de tigre casera",
  basePrice: 25.00,
  images: [{
    url: "https://example.com/ceviche.jpg",
    alt: "Ceviche Mixto",
    isPrimary: true
  }],
  ingredients: ["Pescado fresco", "Camarones", "Pulpo", "Cebolla roja", "Ají amarillo"],
  allergens: ["fish", "shellfish"],
  dietaryTags: ["gluten-free", "dairy-free"],
  variants: [{
    name: "Tamaño",
    type: "single",
    isRequired: true,
    options: [
      { name: "Personal", priceModifier: 0 },
      { name: "Para compartir", priceModifier: 15 }
    ]
  }, {
    name: "Extras",
    type: "multiple",
    isRequired: false,
    options: [
      { name: "Camote extra", priceModifier: 3 },
      { name: "Cancha extra", priceModifier: 2 }
    ]
  }],
  preparationTime: { min: 10, max: 15 }
});
*/
