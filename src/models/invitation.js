import { Schema, model, models } from "mongoose";

const InvitationSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, "El código de invitación es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [8, "El código debe tener al menos 8 caracteres"],
      maxlength: [12, "El código no puede exceder 12 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El correo electrónico es obligatorio"],
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Por favor, ingresa un correo electrónico válido",
      ],
    },
    restaurantName: {
      type: String,
      required: [true, "El nombre del restaurante es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    status: {
      type: String,
      enum: ["pending", "used", "expired"],
      default: "pending",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    usedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    usedAt: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Las notas no pueden exceder 500 caracteres"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar consultas
InvitationSchema.index({ code: 1 }, { unique: true });
InvitationSchema.index({ email: 1 });
InvitationSchema.index({ status: 1 });
InvitationSchema.index({ expiresAt: 1 });
InvitationSchema.index({ createdBy: 1 });

// Método estático para generar código único
InvitationSchema.statics.generateUniqueCode = async function () {
  let code;
  let isUnique = false;

  while (!isUnique) {
    // Generar código de 8 caracteres (letras y números)
    code = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Verificar si ya existe
    const existing = await this.findOne({ code });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
};

// Método para verificar si está expirado
InvitationSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Método para marcar como usado
InvitationSchema.methods.markAsUsed = function (userId) {
  this.status = "used";
  this.usedBy = userId;
  this.usedAt = new Date();
  return this.save();
};

const Invitation = models.Invitation || model("Invitation", InvitationSchema);

export default Invitation;
