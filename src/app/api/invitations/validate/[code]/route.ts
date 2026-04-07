import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invitation from "@/models/invitation";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    await connectToDatabase();
    const { code } = params;

    const invitation = await Invitation.findOne({
      code: code.toUpperCase(),
      status: "pending",
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Código de invitación no válido o ya utilizado" },
        { status: 404 }
      );
    }

    if (invitation.isExpired()) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: "expired" });
      return NextResponse.json(
        { error: "El código de invitación ha expirado" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      restaurantName: invitation.restaurantName,
      expiresAt: invitation.expiresAt,
      notes: invitation.notes,
      type: invitation.type || "restaurant_registration",
      role: invitation.role || "admin",
    });
  } catch (error) {
    console.error("Error al validar invitación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
