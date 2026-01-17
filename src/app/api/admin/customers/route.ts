import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Restaurant from "@/models/restaurants";
import User from "@/models/user";
import { z } from "zod";

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

interface IPopulatedOwner {
  fullName?: string;
  email?: string;
  username?: string;
  role?: string;
  isActive?: boolean;
}

interface IRestaurant {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  ownerId?: IPopulatedOwner;
  [key: string]: unknown;
  plan?: string;
  subscription?: {
    plan?: string;
    status?: string;
  };
}

interface IUserAggregation {
  _id: Types.ObjectId;
  count: number;
}

const OwnerSchema = z
  .object({
    fullName: z.string().optional(),
    email: z.string().optional(),
    username: z.string().optional(),
    role: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .partial();

const RestaurantListItemSchema = z
  .object({
    _id: z.any(),
    name: z.string(),
    slug: z.string(),
    ownerId: OwnerSchema.optional(),
    plan: z.string().optional(),
    subscription: z
      .object({
        plan: z.string().optional(),
        status: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const page = parsePositiveInt(url.searchParams.get("page"), 1);
    const limit = Math.min(
      parsePositiveInt(url.searchParams.get("limit"), 20),
      100
    );
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (q.length > 0) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: rx }, { slug: rx }];
    }

    const [total, rawRestaurants] = await Promise.all([
      Restaurant.countDocuments(query),
      Restaurant.find(query)
        .select("name slug ownerId plan subscription") // ensures the fields you rely on are present
        .populate("ownerId", "fullName email username role isActive")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ] as const);

    const restaurants = z.array(RestaurantListItemSchema).parse(rawRestaurants);

    const restaurantIds = restaurants.map((r: IRestaurant) => r._id);

    // Se usa el genérico en aggregate
    const activeUsersCounts = await User.aggregate<IUserAggregation>([
      { $match: { restaurantId: { $in: restaurantIds }, isActive: true } },
      { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
    ]);

    const activeUsersByRestaurantId = new Map(
      activeUsersCounts.map((row: IUserAggregation) => [
        String(row._id),
        Number(row.count),
      ])
    );

    const items = restaurants.map((r: IRestaurant) => ({
      ...r,
      activeUsersCount: activeUsersByRestaurantId.get(String(r._id)) ?? 0,
    }));

    return NextResponse.json({ items, total, page, limit }, { status: 200 });
  } catch (error) {
    console.error("Error al listar clientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
