import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

import Restaurant from "@/models/restaurants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const { id } = await params;
  try {
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
    return NextResponse.json(
      { error: "Error al obtener los datos del restaurante" },
      { status: 500 }
    );
  }
}
