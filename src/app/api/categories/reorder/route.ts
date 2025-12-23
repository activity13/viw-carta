import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Categories from "@/models/categories";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function PUT(request: Request) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;

    await connectToDatabase();

    const { categories } = await request.json();

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: "categories (array) es obligatorio" },
        { status: 400 }
      );
    }

    // Update each category's order
    const updatePromises = categories.map((category, index) => {
      return Categories.findOneAndUpdate(
        { _id: category.id, restaurantId: secureRestaurantId },
        { order: index + 1 },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    // Return the updated categories
    const updatedCategories = await Categories.find({
      restaurantId: secureRestaurantId,
      isActive: true,
    }).sort({ order: 1 });

    return NextResponse.json(updatedCategories, { status: 200 });
  } catch (error) {
    console.error("Error al reordenar categorías:", error);
    return handleAuthError(error);
  }
}
