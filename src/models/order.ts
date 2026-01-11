import { model, models, Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    mealId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderCustomerSchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    documentType: {
      type: String,
      enum: ["none", "passport", "dni", "ci", "drivers_license", "ce"],
      default: "none",
    },
    documentNumber: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const OrderPaymentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["cash", "card", "transfer", "other"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "on_hold", "paid"],
      required: true,
      default: "active",
      index: true,
    },
    customer: { type: OrderCustomerSchema, default: () => ({}) },
    items: { type: [OrderItemSchema], default: [] },
    payments: { type: [OrderPaymentSchema], default: [] },
    heldAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });

// Enforce: a user can only have one ACTIVE order per restaurant.
OrderSchema.index(
  { restaurantId: 1, createdByUserId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

const Order = models.Order || model("Order", OrderSchema);

export default Order;
