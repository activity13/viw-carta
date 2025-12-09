import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invitation from "@/models/invitation";

// GET: Validar código de invitación
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    await connectToDatabase();

    const invitation = await Invitation.findOne({
      code: code.toUpperCase(),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Código de invitación no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si está expirado
    if (invitation.isExpired()) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: "expired" });
      return NextResponse.json(
        { error: "El código de invitación ha expirado" },
        { status: 410 }
      );
    }

    // Verificar si ya fue usado
    if (invitation.status === "used") {
      return NextResponse.json(
        { error: "El código de invitación ya ha sido utilizado" },
        { status: 410 }
      );
    }

    // Devolver información de la invitación sin datos sensibles
    return NextResponse.json(
      {
        valid: true,
        email: invitation.email,
        restaurantName: invitation.restaurantName,
        expiresAt: invitation.expiresAt,
        notes: invitation.notes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al validar invitación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
