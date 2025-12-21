import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CategorySchema from "@/models/categories";
import MealSchema from "@/models/meals";

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { id, restaurantId } = body;

    if (!id || !restaurantId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    // 1. VERIFICACIÓN DE SEGURIDAD: ¿Tiene productos asociados?
    const hasMeals = await MealSchema.exists({
      categoryId: id,
      restaurantId: restaurantId,
    });

    if (hasMeals) {
      return NextResponse.json(
        {
          error: "No se puede eliminar una categoría que contiene productos.",
          details:
            "Te recomendamos deshabilitarla o mover los productos a otra categoría antes de eliminarla.",
        },
        { status: 409 }
      );
    }

    const deleted = await CategorySchema.findOneAndDelete({
      _id: id,
      restaurantId,
    });

    if (!deleted) {
      return NextResponse.json(
        { error: "Categoría no encontrada o no pertenece al restaurante" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Categoría eliminada exitosamente" },
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
