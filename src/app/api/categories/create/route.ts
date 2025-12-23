import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CategorySchema from "@/models/categories";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;

    await connectToDatabase();
    const body = await request.json();
    console.log("🚀 ~ route.ts:9 ~ POST ~ body:", body);
    const { name, name_en, code, slug, description, description_en, order } =
      body;

    // Validación básica
    if (!name || !code || !slug || !order) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Verifica que el código y el slug sean únicos para el restaurante
    const exists = await CategorySchema.findOne({
      $or: [{ code }, { slug }, { order }],
      restaurantId: secureRestaurantId,
    });
    if (exists) {
      return NextResponse.json(
        {
          error:
            "Ya existe una categoría con ese código, slug u orden en el restaurante",
        },
        { status: 400 }
      );
    }

    const newCategory = new CategorySchema({
      name,
      name_en: name_en || "",
      code,
      slug,
      order,
      description: description || "",
      description_en: description_en || "",
      restaurantId: secureRestaurantId,
      isActive: true,
    });

    await newCategory.save();

    return NextResponse.json(
      { message: "Categoría creada exitosamente", category: newCategory },
      { status: 201 }
    );
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
