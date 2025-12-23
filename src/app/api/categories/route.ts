import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Categories from "@/models/categories";

import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;
    await connectToDatabase();

    const categories = await Categories.find({
      restaurantId: secureRestaurantId,
      isActive: true,
    }).sort({ order: 1 });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return handleAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;
    await connectToDatabase();

    const body = await request.json();
    const { name, name_en, description, description_en, order, code, slug } =
      body;

    if (!name) {
      return NextResponse.json(
        { error: "Nombre es obligatorio" },
        { status: 400 }
      );
    }

    // Get the highest order number for this restaurant if order not provided
    const maxOrderCategory = await Categories.findOne(
      { restaurantId: secureRestaurantId, isActive: true },
      {},
      { sort: { order: -1 } }
    );

    const newOrder =
      order !== undefined ? order : (maxOrderCategory?.order || 0) + 1;

    const category = new Categories({
      name,
      name_en,
      description,
      code,
      slug,
      description_en,
      restaurantId: secureRestaurantId,
      order: newOrder,
      isActive: true,
    });

    await category.save();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;
    await connectToDatabase();

    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de categoría es obligatorio" },
        { status: 400 }
      );
    }

    const category = await Categories.findOneAndUpdate(
      { _id: id, restaurantId: secureRestaurantId },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de categoría es obligatorio" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const category = await Categories.findOneAndUpdate(
      { _id: id, restaurantId: secureRestaurantId },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Categoría eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
