import { NextResponse } from "next/server";
import translate from "google-translate-api-x";
import { connectToDatabase } from "@/lib/mongodb";
import CategorySchema from "@/models/categories";
import MealSchema from "@/models/meals";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

// Config
// Node.js runtime for server-side operations
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
//Declara un error de solicitud incorrecta reutilizable
function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
//Defino la estructura de la respuesta
type CatOut = {
  id: string;
  name: string;
  description?: string;
  meals: {
    id: string;
    name: string;
    description?: string;
    ingredients: string[];
  }[];
};

// Traduce un conjunto de strings y devuelve un mapa original -> traducido
async function translateBatch(
  texts: string[],
  from: string,
  to: string
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(texts.filter(Boolean)));
  const map = new Map<string, string>();

  await Promise.all(
    unique.map(async (t) => {
      try {
        const res = await translate(t, { from, to });
        map.set(t, res.text);
      } catch {
        map.set(t, t);
      }
    })
  );

  return map;
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;

    // Extraer id desde la URL
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id) return badRequest("Invalid 'id' in URL.");

    if (id !== secureRestaurantId) {
      return NextResponse.json(
        { error: "No tienes permiso para traducir este menú" },
        { status: 403 }
      );
    }

    // Body: { to?: string, from?: string, save?: boolean }
    let body: { to?: string; from?: string; save?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const to = (body.to || "en").trim();
    const from = (body.from || "auto").trim();
    const save = !!body.save;

    try {
      await connectToDatabase();

      // 1) Categorías activas del restaurante
      const categories = await CategorySchema.find({
        restaurantId: id,
      })
        .sort({ order: 1 })
        .lean();

      // 2) Platos del restaurante
      const meals = await MealSchema.find({
        restaurantId: id,
      }).lean();

      // 3) Estructurar
      const categoriesWithMeals: CatOut[] = categories.map((cat) => {
        const catMeals = meals.filter(
          (meal) => String(meal.categoryId) === String(cat._id)
        );

        return {
          id: String(cat._id),
          name: cat.name,
          description: cat.description || undefined,
          meals: catMeals.map((m) => ({
            id: String(m._id),
            name: m.name,
            description: m.shortDescription || m.description || undefined,
            ingredients: Array.isArray(m.ingredients)
              ? m.ingredients.filter(Boolean)
              : m.ingredients
              ? [m.ingredients]
              : [],
          })),
        };
      });

      // 4) Recolectar textos a traducir
      const bucket: string[] = [];
      for (const cat of categoriesWithMeals) {
        if (cat.name) bucket.push(cat.name);
        if (cat.description) bucket.push(cat.description);
        for (const meal of cat.meals) {
          if (meal.name) bucket.push(meal.name);
          if (meal.description) bucket.push(meal.description);
          if (Array.isArray(meal.ingredients)) bucket.push(...meal.ingredients);
        }
      }

      // Si no hay nada que traducir
      if (bucket.length === 0) {
        return NextResponse.json({
          to,
          from,
          categories: categoriesWithMeals,
          translatedCount: 0,
          saved: false,
        });
      }

      // 5) Traducir en batch
      const map = await translateBatch(bucket, from, to);

      // 6) Aplicar traducciones
      const translated: CatOut[] = categoriesWithMeals.map((cat) => ({
        ...cat,
        name: map.get(cat.name) ?? cat.name,
        description: cat.description
          ? map.get(cat.description) ?? cat.description
          : undefined,
        meals: cat.meals.map((meal) => ({
          ...meal,
          name: map.get(meal.name) ?? meal.name,
          description: meal.description
            ? map.get(meal.description) ?? meal.description
            : undefined,
          ingredients: meal.ingredients.map((ing) => map.get(ing) ?? ing),
        })),
      }));

      // 7) Si el flag save está activado, actualizar la base de datos
      if (save) {
        console.log("Flag save, updating database with translations...");

        // Categorías: actualizar por campo solo si no fue editado manualmente
        const categoryOps: Promise<unknown>[] = [];
        for (const cat of translated) {
          // name_en
          categoryOps.push(
            CategorySchema.updateOne(
              {
                _id: cat.id,
                restaurantId: id,
                $or: [
                  { name_en_manual: { $exists: false } },
                  { name_en_manual: { $ne: true } },
                ],
              },
              { $set: { name_en: cat.name } }
            )
          );

          // description_en
          categoryOps.push(
            CategorySchema.updateOne(
              {
                _id: cat.id,
                restaurantId: id,
                $or: [
                  { description_en_manual: { $exists: false } },
                  { description_en_manual: { $ne: true } },
                ],
              },
              { $set: { description_en: cat.description ?? "" } }
            )
          );
        }

        // Platos: actualizar por campo solo si no fue editado manualmente
        const mealOps: Promise<unknown>[] = [];
        for (const cat of translated) {
          for (const meal of cat.meals) {
            // name_en
            mealOps.push(
              MealSchema.updateOne(
                {
                  _id: meal.id,
                  restaurantId: id,
                  $or: [
                    { name_en_manual: { $exists: false } },
                    { name_en_manual: { $ne: true } },
                  ],
                },
                { $set: { name_en: meal.name } }
              )
            );

            // description_en
            mealOps.push(
              MealSchema.updateOne(
                {
                  _id: meal.id,
                  restaurantId: id,
                  $or: [
                    { description_en_manual: { $exists: false } },
                    { description_en_manual: { $ne: true } },
                  ],
                },
                { $set: { description_en: meal.description ?? "" } }
              )
            );

            // ingredients_en
            mealOps.push(
              MealSchema.updateOne(
                {
                  _id: meal.id,
                  restaurantId: id,
                  $or: [
                    { ingredients_en_manual: { $exists: false } },
                    { ingredients_en_manual: { $ne: true } },
                  ],
                },
                {
                  $set: {
                    ingredients_en: Array.isArray(meal.ingredients)
                      ? meal.ingredients
                      : [],
                  },
                }
              )
            );
          }
        }

        await Promise.all([...categoryOps, ...mealOps]);
      }

      return NextResponse.json({
        to,
        from,
        translatedCount: map.size,
        saved: save,
        categories: translated,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
