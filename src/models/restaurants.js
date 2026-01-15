import { Schema, model, models } from "mongoose";

const SubscriptionAuditSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    byUserId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    change: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ["standard", "premium"],
      default: "standard",
    },
    status: {
      type: String,
      enum: ["trialing", "active", "paused", "past_due", "canceled"],
      default: "active",
    },
    startedAt: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },

    provider: {
      type: String,
      enum: ["manual", "stripe"],
      default: "manual",
    },
    providerCustomerId: { type: String, trim: true, default: "" },
    providerSubscriptionId: { type: String, trim: true, default: "" },

    notes: { type: String, trim: true, default: "" },
    audit: { type: [SubscriptionAuditSchema], default: [] },
  },
  { _id: false }
);

const RestaurantSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del restaurante es obligatorio"],
      trim: true,
      unique: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    slug: {
      type: String,
      required: [true, "El slug del restaurante es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    direction: {
      type: String,
      required: [true, "La dirección del restaurante es obligatoria"],
      trim: true,
      maxlength: [200, "La dirección no puede exceder 200 caracteres"],
    },
    location: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Permite valores vacíos
          return /^https?:\/\/.+/.test(v);
        },
        message: "La locación debe ser una URL válida",
      },
    },
    phone: {
      type: String,
      required: [true, "El teléfono del restaurante es obligatorio"],
      trim: true,
      maxlength: [15, "El teléfono no puede exceder 15 caracteres"],
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    image: {
      type: String,
      required: false,
      trim: true,
    },
    frameQR: {
      type: String,
      required: false,
      trim: true,
    },
    QrCode: {
      type: String,
      required: false,
      trim: true,
    },
    // SaaS Fields
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for now to support legacy data
    },
    plan: {
      type: String,
      enum: ["standard", "premium"],
      default: "standard",
    },
    // Fuente de verdad a futuro (manual inicialmente)
    subscription: {
      type: SubscriptionSchema,
      default: () => ({
        plan: "standard",
        status: "active",
        provider: "manual",
      }),
    },
    theme: {
      palette: {
        type: String,
        default: "viw",
        enum: ["classic", "ocean", "forest", "sunset", "royal", "viw"],
      },
      customColors: {
        primary: { type: String },
        secondary: { type: String },
        accent: { type: String },
        background: { type: String },
        text: { type: String },
        muted: { type: String },
      },
      // Legacy fields - mantained for backward compatibility
      primaryColor: { type: String },
      secondaryColor: { type: String },
      backgroundColor: { type: String },
      fontFamily: { type: String, default: "Inter" },
      logoUrl: { type: String },
      coverImageUrl: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

RestaurantSchema.index({ plan: 1 });
RestaurantSchema.index({ "subscription.plan": 1 });
RestaurantSchema.index({ "subscription.status": 1 });
RestaurantSchema.index({ "subscription.currentPeriodEnd": 1 });

const Restaurant = models.Restaurant || model("Restaurant", RestaurantSchema);

export default Restaurant;
