import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CategorySchema from "@/models/categories";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    console.log("🚀 ~ route.ts:9 ~ POST ~ body:", body);
    const { name, code, slug, description, restaurantId, order } = body;

    // Validación básica
    if (!name || !code || !slug || !restaurantId || !order) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Verifica que el código y el slug sean únicos para el restaurante
    const exists = await CategorySchema.findOne({
      $or: [{ code }, { slug }, { order }],
      restaurantId,
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
      code,
      slug,
      order,
      description: description || "",
      restaurantId,
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
