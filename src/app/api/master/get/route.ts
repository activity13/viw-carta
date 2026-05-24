import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Meal from "@/models/meals";
import Restaurant from "@/models/restaurants";
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("restaurantId");
    // Query de prueba mientras se implementa la lógica
    const restaurant = await Restaurant.findById(id);
    const meals = await Meal.find({ restaurantId: restaurant?._id });
    return NextResponse.json(meals, { status: 200 });
  } catch (error) {
    console.error("Error interno en el servidor", error);
    return NextResponse.json(
      {
        error: "Ha ocurrido un problema. Por favor, intenta nuevamente",
        error_message:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
