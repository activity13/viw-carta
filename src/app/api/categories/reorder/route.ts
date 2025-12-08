import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Categories from "@/models/categories";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();

    const { categories, restaurantId } = await request.json();

    if (!categories || !Array.isArray(categories) || !restaurantId) {
      return NextResponse.json(
        { error: "categories (array) y restaurantId son obligatorios" },
        { status: 400 }
      );
    }

    // Update each category's order
    const updatePromises = categories.map((category, index) => {
      return Categories.findOneAndUpdate(
        { _id: category.id, restaurantId },
        { order: index + 1 },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    // Return the updated categories
    const updatedCategories = await Categories.find({
      restaurantId,
      isActive: true,
    }).sort({ order: 1 });

    return NextResponse.json(updatedCategories, { status: 200 });
  } catch (error) {
    console.error("Error al reordenar categorías:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
