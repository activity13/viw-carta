import mongoose, { model, Schema } from "mongoose";

const clientSchema = new Schema(
  {
    // NextAuth multi-restaurante isolation
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    
    // Core identity
    documentType: {
      type: String,
      enum: ["none", "dni", "ruc", "passport", "ci", "ce"],
      default: "none",
    },
    documentNumber: {
      type: String,
      required: [true, "El número de documento es obligatorio"],
      index: true,
    },
    
    // Personal / Business attributes
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    
    // Contact
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Por favor, ingresa un correo electrónico válido",
      ],
    },
    
    // Classification and state
    clientType: {
      type: String,
      enum: ["standard", "frequent", "family_and_friends", "vip"],
      default: "standard",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    marketingOptIn: {
      type: Boolean,
      default: false,
    },
    
    // Metrics
    purchaseStats: {
      totalOrders: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      lastOrderDate: { type: Date, default: null },
    },
    
    // History
    orderHistory: [
      {
        orderId: { type: Schema.Types.ObjectId, ref: "Order" },
        date: { type: Date },
        amount: { type: Number },
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per restaurant, meaning the same DNI could be a client in two different restaurants
clientSchema.index({ restaurantId: 1, documentNumber: 1 }, { unique: true });

const Client = mongoose.models?.Client || model("Client", clientSchema);

export default Client;
