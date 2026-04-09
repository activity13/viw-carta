import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Invitation from "@/models/invitation";
import { connectToDatabase } from "@/lib/mongodb";
import { checkApiPermission } from "@/lib/server-guard";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const error = await checkApiPermission("manage_team");
    if (error) return error;

    const { id } = await params;

    const session = await getServerSession(authOptions);
    const restaurantId = session?.user?.restaurantId;
    const userRole = session?.user?.role;

    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant ID found" }, { status: 400 });
    }

    // ROLE CHECK: Only admin or superadmin
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json({ error: "No tienes permisos para realizar esta acción" }, { status: 403 });
    }

    await connectToDatabase();

    // Verify the invitation belongs to the same restaurant and is pending
    const invitationToDelete = await Invitation.findOneAndDelete({ 
      _id: id, 
      restaurantId,
      status: "pending" 
    });

    if (!invitationToDelete) {
      return NextResponse.json({ error: "Invitación no encontrada o ya procesada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Invitación cancelada exitosamente" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Error al cancelar la invitación" }, { status: 500 });
  }
}
