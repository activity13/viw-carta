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

const OrderAdjustmentSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["discount", "surcharge"],
      required: true,
    },
    percent: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String, trim: true, default: "" },
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
    tableNumber: { type: String, trim: true, default: "" },
    customer: { type: OrderCustomerSchema, default: () => ({}) },
    items: { type: [OrderItemSchema], default: [] },
    // Discounts / surcharges (percentage)
    adjustment: { type: OrderAdjustmentSchema, default: null },
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

// In Next.js dev with HMR, mongoose models can be cached with an older schema.
// If schema evolves (e.g., new fields like tableNumber/adjustment), rebuild the model.
const existingModel = models.Order as
  | (typeof models.Order & { schema?: { path?: (name: string) => unknown } })
  | undefined;

const adjustmentPath = existingModel?.schema?.path?.("adjustment") as
  | { schema?: { path?: (name: string) => unknown } }
  | undefined;

const needsRebuild =
  process.env.NODE_ENV !== "production" &&
  !!existingModel &&
  (!existingModel.schema?.path?.("tableNumber") ||
    !existingModel.schema?.path?.("adjustment") ||
    !adjustmentPath?.schema?.path?.("note"));

if (needsRebuild) {
  delete models.Order;
}

const Order = models.Order || model("Order", OrderSchema);

export default Order;
