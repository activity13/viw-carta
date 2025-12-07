import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Restaurant from "@/models/restaurants";
import User from "@/models/user";
import Invitation from "@/models/invitation";

// GET: Obtener estadísticas del dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Verificar que el usuario esté autenticado y sea superadmin
    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Contar restaurantes totales
    const totalRestaurants = await Restaurant.countDocuments();

    // Contar usuarios activos totales
    const totalUsers = await User.countDocuments({ isActive: true });

    // Contar invitaciones pendientes (no expiradas)
    const pendingInvitations = await Invitation.countDocuments({
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    // Contar invitaciones usadas
    const usedInvitations = await Invitation.countDocuments({
      status: "used",
    });

    const stats = {
      totalRestaurants,
      totalUsers,
      pendingInvitations,
      usedInvitations,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
