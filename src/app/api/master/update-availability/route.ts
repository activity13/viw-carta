import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Meal from "@/models/meals";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function PUT(req: Request) {
  try {
    const session = await requireAuth("staff");
    const body = await req.json();
    const { mealId, isAvailable } = body;

    if (!mealId || typeof isAvailable !== "boolean") {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const meal = await Meal.findOneAndUpdate(
      { _id: mealId, restaurantId: session.user.restaurantId },
      { "display.showInMenu": isAvailable },
      { new: true }
    );

    if (!meal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, meal });
  } catch (error) {
    console.error("Error updating meal availability:", error);
    return handleAuthError(error);
  }
}
