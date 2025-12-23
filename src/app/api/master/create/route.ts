import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MealSchema from "@/models/meals";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación y obtener restaurantId seguro
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;

    const { formData } = await request.json();

    await connectToDatabase();

    const newMeal = new MealSchema({
      restaurantId: secureRestaurantId, // Usar ID de sesión, ignorar body
      categoryId: formData?.categoryId,
      name: formData.name,
      name_en: formData.name_en || "",
      description: formData.description,
      description_en: formData.description_en || "",
      shortDescription: formData.shortDescription,
      shortDescription_en: formData.shortDescription_en || "",

      // Precios
      basePrice: formData?.basePrice,
      comparePrice: formData?.comparePrice,

      // Imágenes
      images: formData?.images || [],

      // Ingredientes y alérgenos
      ingredients: formData?.ingredients || [""],
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
    });
    await newMeal.save();
    return NextResponse.json(
      { message: "Conexión exitosa a la base de datos" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error interno en el servidor", error);
    return NextResponse.json(
      {
        error: "Ha ocurrido un problemformData. Por favor, intenta nuevamente",
        error_message:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
