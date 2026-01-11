import { model, models, Schema } from "mongoose";

const counterSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

counterSchema.index({ restaurantId: 1, key: 1 }, { unique: true });

const Counter = models.Counter || model("Counter", counterSchema);

export default Counter;
