import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MealSchema from "@/models/meals";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const session = await requireAuth("staff");
    await connectToDatabase();

    const { params, formData } = await request.json();

    // Asegurar que solo se actualice si pertenece al restaurante del usuario
    const mealUpdated = await MealSchema.updateOne(
      {
        _id: params.id,
        restaurantId: session.user.restaurantId,
      },
      {
        $set: {
          name: formData.name,
          name_en: formData.name_en || "",
          description: formData.description,
          description_en: formData.description_en || "",
          shortDescription: formData.shortDescription,
          shortDescription_en: formData.shortDescription_en || "",

          // Información básica
          categoryId: formData?.categoryId,

          // Precios
          basePrice: formData?.basePrice,
          comparePrice: formData?.comparePrice,

          // Imágenes
          images: formData?.images || [],

          // Ingredientes y alérgenos
          ingredients: formData?.ingredients || [],
          allergens: formData?.allergens || [],
          dietaryTags: formData?.dietaryTags || [],

          // Variantes (simplificado)
          variants: formData?.variants || [],

          // Disponibilidad
          availability: formData?.availability || {
            isAvailable: true,
            availableQuantity: "",
          },

          // Tiempo de preparación
          preparationTime: formData?.preparationTime || {
            min: "",
            max: "",
          },

          // Configuración de visualización
          display: formData?.display || {
            order: "",
            isFeatured: false,
            showInMenu: true,
          },

          // Estado
          status: formData?.status || "active",

          // SEO
          searchTags: formData?.searchTags || [""],
        },
      }
    );
    if (mealUpdated.matchedCount === 0) {
      throw new Error(
        "No se encontró ningún documento con el _id especificado."
      );
    }
    if (mealUpdated.modifiedCount === 0) {
      console.log("No se realizaron cambios en el documento.");
    }
    return NextResponse.json(
      { message: "Comida actualizada con éxito" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error interno en el servidor", error);
    return handleAuthError(error);
  }
}
