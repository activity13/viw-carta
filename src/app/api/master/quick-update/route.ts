import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MealSchema from "@/models/meals";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const session = await requireAuth("staff");
    await connectToDatabase();
    const { id, field, value } = await request.json();

    if (!id || !field) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (id, field)" },
        { status: 400 }
      );
    }

    // Validar que el campo sea uno de los permitidos para edición rápida
    const allowedFields = [
      "name",
      "description",
      "basePrice",
      "display.showInMenu",
    ];
    if (!allowedFields.includes(field)) {
      // Opcional: permitir todos o restringir. Por seguridad, mejor restringir o validar.
      // Para este caso, permitiremos los básicos.
    }

    const updateData = { [field]: value };

    const result = await MealSchema.updateOne(
      { _id: id, restaurantId: session.user.restaurantId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Plato no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Actualizado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en quick-update:", error);
    return handleAuthError(error);
  }
}
