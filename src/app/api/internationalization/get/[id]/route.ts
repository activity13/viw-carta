import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

import Restaurant from "@/models/restaurants";
import CategorySchema from "@/models/categories";
import MealSchema from "@/models/meals";
import SystemMessage from "@/models/SystemMessage";
import VariantTemplate from "@/models/VariantTemplate";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

interface IMenuSection {
  _id?: { toString(): string };
  name: string;
  name_en?: string;
  slug: string;
  order: number;
  isActive: boolean;
}

interface IVariantOption {
  name: string;
  name_en?: string;
  price?: number;
  priceModifier?: number;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;

    const { id } = await params; // ✅ resolver promesa
    await connectToDatabase();

    // Security Check
    if (id !== secureRestaurantId) {
      return NextResponse.json(
        { error: "No tienes permiso para ver este restaurante" },
        { status: 403 }
      );
    }

    // 1️⃣ Buscar restaurante
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 404 }
      );
    }

    // 2️⃣ Buscar categorías del restaurante
    const categories = await CategorySchema.find({
      restaurantId: restaurant._id,
    }).sort({ order: 1 });

    // 3️⃣ Buscar platos del restaurante
    const meals = await MealSchema.find({
      restaurantId: restaurant._id,
      "display.showInMenu": true,
    });

    // 4️⃣ Buscar mensajes del sistema
    const messages = await SystemMessage.find({
      restaurantId: restaurant._id,
    }).sort({ order: 1 });

    // 4.5️⃣ Buscar variantes
    const variants = await VariantTemplate.find({
      restaurantId: restaurant._id,
    }).sort({ createdAt: -1 });

    // 5️⃣ Estructurar respuesta separada
    const formattedSections = (restaurant.menuSections || []).map((sec: IMenuSection) => ({
      id: sec._id ? sec._id.toString() : sec.slug,
      name: sec.name,
      name_en: sec.name_en,
      slug: sec.slug,
      order: sec.order,
      isActive: sec.isActive,
    }));

    const formattedCategories = categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      name_en: cat.name_en,
      description: cat.description,
      description_en: cat.description_en,
    }));

    const formattedMeals = meals.map((meal) => ({
      id: meal._id.toString(),
      categoryId: meal.categoryId?.toString() || null,
      name: meal.name,
      name_en: meal.name_en,
      description: meal.shortDescription || meal.description,
      description_en: meal.description_en,
      tags: meal.dietaryTags,
      ingredients: meal.ingredients,
      ingredients_en: meal.ingredients_en,
    }));

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      placement: msg.placement,
      type: msg.type,
      content: msg.content,
      content_en: msg.content_en,
      isActive: msg.isActive,
    }));

    const formattedVariants = variants.map((variant) => ({
      id: variant._id.toString(),
      title: variant.title,
      title_en: variant.title_en,
      options: (variant.options as IVariantOption[]).map((opt) => ({
        name: opt.name,
        name_en: opt.name_en,
        price: opt.price || opt.priceModifier,
      })),
    }));

    // 6️⃣ Respuesta final separada
    return NextResponse.json(
      {
        restaurant: {
          id: restaurant._id.toString(),
          name: restaurant.name,
        },
        sections: formattedSections,
        categories: formattedCategories,
        meals: formattedMeals,
        messages: formattedMessages,
        variants: formattedVariants,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching menu:", error);
    return handleAuthError(error);
  }
}
