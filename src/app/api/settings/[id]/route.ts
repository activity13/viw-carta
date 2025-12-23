import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Restaurant from "@/models/restaurants";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;

    await connectToDatabase();
    const { id } = await params;

    // Security Check
    if (id !== secureRestaurantId) {
      return NextResponse.json(
        { error: "No tienes permiso para ver este restaurante" },
        { status: 403 }
      );
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 404 }
      );
    }

    console.debug("🚀 ~ route.ts:23 ~ GET ~ restaurant cargado", restaurant);
    return NextResponse.json(restaurant, { status: 200 });
  } catch (error) {
    console.error("Error al obtener restaurante:", error);
    return handleAuthError(error);
  }
}
