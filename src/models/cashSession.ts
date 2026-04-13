import { model, models, Schema } from "mongoose";

const CashSessionSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    openedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    closedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      required: true,
    },
    openedAt: { type: Date, default: Date.now, required: true },
    closedAt: { type: Date, default: null },
    
    // Dinero base en efectivo con el que empieza el turno para dar vueltos / cambio
    startingCash: { type: Number, default: 0, required: true },
    
    // Almacenamiento congelado de los números al momento del cierre para evitar alteraciones históricas
    summary: {
      totalSales: { type: Number, default: 0 },
      totalCash: { type: Number, default: 0 },
      totalCard: { type: Number, default: 0 },
      totalTransfer: { type: Number, default: 0 },
      totalDiscounts: { type: Number, default: 0 },
      totalSurcharges: { type: Number, default: 0 },
      orderCount: { type: Number, default: 0 },
      cancelledOrderCount: { type: Number, default: 0 },
      expectedCashInRegister: { type: Number, default: 0 } // startingCash + totalCash
    },
    
    notes: { type: String, trim: true, default: "" }
  },
  {
    timestamps: true,
  }
);

// Un restaurante solo puede tener UNA caja abierta a la vez
CashSessionSchema.index(
  { restaurantId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "open" } }
);

const CashSession = models.CashSession || model("CashSession", CashSessionSchema);
export default CashSession;
