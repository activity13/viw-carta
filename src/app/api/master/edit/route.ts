import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Meal from "@/models/meals";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const session = await requireAuth("staff");
    await connectToDatabase();

    const { searchParams } = new URL(req.url || "");
    const id = searchParams.get("id");

    const meal = await Meal.findOne({
      _id: id,
      restaurantId: session.user.restaurantId,
    });

    if (!meal) {
      return NextResponse.json(
        { error: "Comida no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(meal, { status: 200 });
  } catch (error) {
    console.error("Error interno en el servidor", error);
    return handleAuthError(error);
  }
}
