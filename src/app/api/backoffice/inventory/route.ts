import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Meal from "@/models/meals";
import Category from "@/models/categories";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const session = await requireAuth("staff");
    await connectToDatabase();

    // Buscar solo productos que tienen control de stock (availableQuantity es un número)
    const meals = await Meal.find({
      restaurantId: session.user.restaurantId,
      "availability.availableQuantity": { $type: "number" }
    })
      .populate("categoryId", "name")
      .select("name basePrice availability categoryId status display images")
      .sort({ "categoryId": 1, name: 1 })
      .lean();

    return NextResponse.json(meals, { status: 200 });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return handleAuthError(error);
  }
}
