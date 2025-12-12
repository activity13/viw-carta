import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

import Restaurant from "@/models/restaurants";
import CategorySchema from "@/models/categories";
import SystemMessage from "@/models/SystemMessage";
import MealSchema from "@/models/meals";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params; //
    const tag = `menu-${subdomain}`;
    await connectToDatabase();
    console.log("⚡ Regenerando menú desde la DB:", new Date().toISOString());
    // 1. Buscar restaurante
    const restaurant = await Restaurant.findOne({ slug: subdomain });
    console.log("🚀 ~ route.ts:19 ~ GET ~ restaurant:", restaurant);
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 404 }
      );
    }

    // 2. Buscar categorías del restaurante
    const categories = await CategorySchema.find({
      restaurantId: restaurant._id,
      isActive: true,
    }).sort({ order: 1 });

    // 2.1 Buscar mensajes del sistema activos
    const systemMessages = await SystemMessage.find({
      restaurantId: restaurant._id,
      isActive: true,
    }).sort({ placement: 1, order: 1 });

    // 3. Buscar platos del restaurante
    const meals = await MealSchema.find({
      restaurantId: restaurant._id,
      "display.showInMenu": true,
    }).sort({ "display.order": 1 });

    // 4. Agrupar platos en sus categorías
    const categoriesWithMeals = categories.map((cat) => {
      const catMeals = meals.filter(
        (meal) => meal.categoryId.toString() === cat._id.toString()
      );

      return {
        id: cat._id,
        name: cat.name,
        name_en: cat.name_en,
        slug: cat.slug,
        description: cat.description,
        description_en: cat.description_en,
        meals: catMeals.map((m) => ({
          id: m._id,
          name: m.name,
          name_en: m.name_en,
          description: m.shortDescription || m.description,
          description_en: m.shortDescription_en || m.description_en,
          price: m.basePrice,
          comparePrice: m.comparePrice,
          images: m.images,
          tags: m.dietaryTags,
          featured: m.display.isFeatured,
          ingredients: [m.ingredients],
          ingredients_en: [m.ingredients_en],
        })),
      };
    });

    const activeSystemMessages = systemMessages.map((msg) => ({
      placement: msg.placement,
      type: msg.type,
      content: msg.content,
      content_en: msg.content_en,
      isActive: msg.isActive,
    }));

    // 5. Respuesta final
    return NextResponse.json(
      {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
          direction: restaurant.direction,
          location: restaurant.location,
          phone: restaurant.phone,
          image: restaurant.image,
          theme: restaurant.theme, // Include theme data
        },
        categories: categoriesWithMeals,
        systemMessages: activeSystemMessages,
      },
      {
        headers: {
          // Header correcto para cache tags en Next 15
          "x-next-cache-tags": tag,
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
