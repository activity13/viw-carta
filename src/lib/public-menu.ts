import { connectToDatabase } from "@/lib/mongodb";
import { unstable_cache, revalidateTag } from "next/cache";

import Restaurant from "@/models/restaurants";
import CategorySchema from "@/models/categories";
import SystemMessage from "@/models/SystemMessage";
import MealSchema from "@/models/meals";

export interface PublicMenuData {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    direction?: string;
    location?: string;
    phone?: string;
    image?: string;
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      borderRadius?: string;
      layout?: string;
      [key: string]: string | undefined;
    };
    businessType: string;
  };
  categories: Array<{
    id: string;
    name: string;
    name_en?: string;
    slug: string;
    description?: string;
    description_en?: string;
    meals: Array<{
      id: string;
      name: string;
      name_en?: string;
      description?: string;
      description_en?: string;
      price: number;
      comparePrice?: number;
      images: string[];
      tags: string[];
      featured: boolean;
      ingredients: string[];
      ingredients_en: string[];
      variants: Array<{
        name: string;
        name_en?: string;
        options: Array<{
          name: string;
          name_en?: string;
          price?: number;
        }>;
      }>;
    }>;
    mealsCount: number;
  }>;
  systemMessages: Array<{
    placement: string;
    type: string;
    content: string;
    content_en?: string;
    isActive: boolean;
  }>;
}

export async function getPublicMenuDataOriginal(
  subdomain: string,
): Promise<PublicMenuData> {
  await connectToDatabase();
  console.log(
    "⚡ Regenerando menú desde la DB para:",
    subdomain,
    new Date().toISOString(),
  );

  // 1. Buscar restaurante
  const restaurant = await Restaurant.findOne({ slug: subdomain });
  if (!restaurant) {
    throw new Error("Restaurante no encontrado");
  }

  // Check subscription status
  if (
    restaurant.subscription?.status === "past_due" ||
    restaurant.subscription?.status === "canceled" ||
    restaurant.subscription?.status === "paused"
  ) {
    throw new Error("Service Suspended");
  }

  // 2. Buscar categorías del restaurante
  const categories = await CategorySchema.find({
    restaurantId: restaurant._id,
    isActive: true,
  }).sort({ order: 1 });

  // 2.1 Buscar mensajes del sistema activos
  const systemMessages = await SystemMessage.find({
    restaurantId: restaurant._id,
    isActive: { $ne: false },
  }).sort({ placement: 1, order: 1 });

  // 3. Buscar platos del restaurante
  const meals = await MealSchema.find({
    restaurantId: restaurant._id,
    "display.showInMenu": true,
  }).sort({ "display.order": 1 });

  // 4. Agrupar platos en sus categorías
  const categoriesWithMeals = categories.map((cat) => {
    const catMeals = meals.filter(
      (meal) => meal.categoryId.toString() === cat._id.toString(),
    );

    return {
      id: cat._id.toString(),
      name: cat.name,
      name_en: cat.name_en,
      slug: cat.slug,
      description: cat.description,
      description_en: cat.description_en,
      meals: catMeals.map((m) => ({
        id: m._id.toString(),
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
        variants: m.variants, // Include variants for complex layouts
      })),
      mealsCount: catMeals.length,
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
  // Se serializa parseando a JSON para evitar que Mongoose devuelva objetos pesados con getters ocultos
  // que romperían los Server Components.
  return JSON.parse(
    JSON.stringify({
      restaurant: {
        id: restaurant._id.toString(),
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        direction: restaurant.direction,
        location: restaurant.location,
        phone: restaurant.phone,
        image: restaurant.image,
        theme: restaurant.theme,
        businessType: restaurant.businessType || "restaurant",
      },
      categories: categoriesWithMeals,
      systemMessages: activeSystemMessages,
    }),
  );
}

// Esta es la versión cacheada con Next.js ISR nativo (unstable_cache)
export const getPublicMenuData = (subdomain: string) => {
  return unstable_cache(
    async () => getPublicMenuDataOriginal(subdomain),
    [`menu-${subdomain}`],
    {
      tags: [`menu-${subdomain}`],
      revalidate: 60, // Regenerar estáticamente cada 60 segundos
    },
  )();
};

export async function revalidateMenu(restaurantId: string | undefined) {
  if (!restaurantId) return;
  try {
    await connectToDatabase();
    const restaurant = await Restaurant.findById(restaurantId).select("slug");
    if (restaurant?.slug) {
      console.log(
        `🧹 Revalidando caché bajo demanda para: menu-${restaurant.slug}`,
      );
      revalidateTag(`menu-${restaurant.slug}`);
    }
  } catch (e) {
    console.error("Error revalidating menu cache:", e);
  }
}
