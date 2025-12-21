import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CategorySchema from "@/models/categories";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, name, code, slug, description, restaurantId, order } = body;

    if (!id || !restaurantId) {
      console.error("Faltan datos obligatorios: id o restaurantId");
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // Verifica si el código o slug ya existen en otra categoría del mismo restaurante
    const exists = await CategorySchema.findOne({
      _id: { $ne: id },
      restaurantId,
      $or: [{ code }, { slug }],
    });
    if (exists) {
      return NextResponse.json(
        {
          error:
            "Ya existe una categoría con ese código o slug en el restaurante",
        },
        { status: 400 }
      );
    }
    console.log("🚀 ~ route.tsx:34 ~ PUT ~ order:", order);
    const updated = await CategorySchema.findOneAndUpdate(
      { _id: id, restaurantId },
      {
        name,
        code,
        slug,
        order,
        description: description || "",
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Categoría no encontrada o no pertenece al restaurante" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Categoría actualizada exitosamente", category: updated },
      { status: 200 }
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
