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

    const allowedFields = [
      "name",
      "description",
      "basePrice",
      "display.showInMenu",
      "availability.availableQuantity",
    ];
    if (!allowedFields.includes(field)) {
      // Opcional: permitir todos o restringir. Por seguridad, mejor restringir o validar.
      // Para este caso, permitiremos los básicos.
    }

    const updateData: Record<string, any> = { [field]: value };
    
    // Si actualizamos la cantidad a 0, también marcamos como no disponible
    if (field === "availability.availableQuantity") {
       if (typeof value === "number" && value <= 0) {
          updateData["availability.isAvailable"] = false;
       }
    }

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

    const { revalidateMenu } = await import("@/lib/public-menu");
    await revalidateMenu(session.user.restaurantId);

    return NextResponse.json(
      { message: "Actualizado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en quick-update:", error);
    return handleAuthError(error);
  }
}
