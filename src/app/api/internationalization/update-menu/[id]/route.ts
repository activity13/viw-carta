import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CategorySchema from "@/models/categories";
import MealSchema from "@/models/meals";
import SystemMessage from "@/models/SystemMessage";
import VariantTemplate from "@/models/VariantTemplate";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;

    const { id: restaurantId } = await params;

    if (restaurantId !== secureRestaurantId) {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar este menú" },
        { status: 403 }
      );
    }

    const body = await req.json();

    await connectToDatabase();

    // Validar si contiene meals, categories o messages
    const hasMeals = Array.isArray(body.meals);
    const hasCategories = Array.isArray(body.categories);
    const hasMessages = Array.isArray(body.messages);
    const hasVariants = Array.isArray(body.variants);

    if (!hasMeals && !hasCategories && !hasMessages && !hasVariants) {
      return NextResponse.json(
        { error: "No se enviaron categorías, platos, mensajes o variantes válidas." },
        { status: 400 }
      );
    }

    const results: {
      updatedMeals: unknown[];
      updatedCategories: unknown[];
      updatedMessages: unknown[];
      updatedVariants: unknown[];
    } = {
      updatedMeals: [],
      updatedCategories: [],
      updatedMessages: [],
      updatedVariants: [],
    };

    // 🔹 Actualizar categorías si vienen
    if (hasCategories) {
      for (const cat of body.categories) {
        if (!cat.id) continue;

        const updateFields: Record<string, unknown> = {};
        const manualFlags: Record<string, unknown> = {};

        if (cat.name !== undefined) {
          updateFields.name = cat.name;
          manualFlags.name_manual = true;
        }
        if (cat.name_en !== undefined) {
          updateFields.name_en = cat.name_en;
          manualFlags.name_en_manual = true;
        }
        if (cat.description !== undefined) {
          updateFields.description = cat.description;
          manualFlags.description_manual = true;
        }
        if (cat.description_en !== undefined) {
          updateFields.description_en = cat.description_en;
          manualFlags.description_en_manual = true;
        }

        const updated = await CategorySchema.findOneAndUpdate(
          { _id: cat.id, restaurantId },
          { $set: { ...updateFields, ...manualFlags } },
          { new: true }
        );

        if (updated) results.updatedCategories.push(updated);
      }
    }

    // 🔹 Actualizar platos si vienen
    if (hasMeals) {
      for (const meal of body.meals) {
        if (!meal.id) continue;

        const updateFields: Record<string, unknown> = {};
        const manualFlags: Record<string, unknown> = {};

        if (meal.name !== undefined) {
          updateFields.name = meal.name;
          manualFlags.name_manual = true;
        }
        if (meal.name_en !== undefined) {
          updateFields.name_en = meal.name_en;
          manualFlags.name_en_manual = true;
        }
        if (meal.description !== undefined) {
          updateFields.description = meal.description;
          manualFlags.description_manual = true;
        }
        if (meal.description_en !== undefined) {
          updateFields.description_en = meal.description_en;
          manualFlags.description_en_manual = true;
        }
        if (meal.ingredients !== undefined) {
          updateFields.ingredients = meal.ingredients;
          manualFlags.ingredients_manual = true;
        }
        if (meal.ingredients_en !== undefined) {
          updateFields.ingredients_en = meal.ingredients_en;
          manualFlags.ingredients_en_manual = true;
        }

        const updated = await MealSchema.findOneAndUpdate(
          { _id: meal.id, restaurantId },
          { $set: { ...updateFields, ...manualFlags } },
          { new: true }
        );

        if (updated) results.updatedMeals.push(updated);
      }
    }

    // 🔹 Actualizar mensajes si vienen
    if (hasMessages) {
      for (const msg of body.messages) {
        if (!msg.id) continue;

        const updateFields: Record<string, unknown> = {};
        const manualFlags: Record<string, unknown> = {};

        if (msg.content !== undefined) {
          updateFields.content = msg.content;
          manualFlags.content_manual = true;
        }
        if (msg.content_en !== undefined) {
          updateFields.content_en = msg.content_en;
          manualFlags.content_en_manual = true;
        }

        const updated = await SystemMessage.findOneAndUpdate(
          { _id: msg.id, restaurantId },
          { $set: { ...updateFields, ...manualFlags } },
          { new: true }
        );

        if (updated) results.updatedMessages.push(updated);
      }
    }

    // 🔹 Actualizar variantes si vienen
    if (hasVariants) {
      for (const variant of body.variants) {
        if (!variant.id) continue;

        const updateFields: Record<string, unknown> = {};

        if (variant.title_en !== undefined) {
          updateFields.title_en = variant.title_en;
        }
        if (variant.options !== undefined) {
          updateFields.options = variant.options;
        }

        const updated = await VariantTemplate.findOneAndUpdate(
          { _id: variant.id, restaurantId },
          { $set: updateFields },
          { new: true }
        );

        if (updated) results.updatedVariants.push(updated);
      }
    }

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando menú:", error);
    return handleAuthError(error);
  }
}
