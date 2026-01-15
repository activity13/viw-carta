import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Restaurant from "@/models/restaurants";
import User from "@/models/user";
import Categories from "@/models/categories";
import Meal from "@/models/meals";
import Order from "@/models/order";

type SubscriptionPlan = "standard" | "premium";
type SubscriptionStatus =
  | "trialing"
  | "active"
  | "paused"
  | "past_due"
  | "canceled";

type SubscriptionPatch = {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  startedAt?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  notes?: string;
};

function toDateOrNull(value: unknown): Date | null {
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isPlan(value: unknown): value is SubscriptionPlan {
  return value === "standard" || value === "premium";
}

function isStatus(value: unknown): value is SubscriptionStatus {
  return (
    value === "trialing" ||
    value === "active" ||
    value === "paused" ||
    value === "past_due" ||
    value === "canceled"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const restaurant = await Restaurant.findById(id)
      .populate("ownerId", "fullName email username role isActive")
      .lean();

    if (!restaurant) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const restaurantId = id;

    const [users, categoriesCount, mealsCount, ordersCount] = await Promise.all(
      [
        User.find({ restaurantId })
          .select("fullName username email role isActive createdAt updatedAt")
          .sort({ createdAt: 1 })
          .lean(),
        Categories.countDocuments({ restaurantId }),
        Meal.countDocuments({ restaurantId }),
        Order.countDocuments({ restaurantId }),
      ]
    );

    return NextResponse.json(
      {
        restaurant,
        users,
        counts: {
          categories: categoriesCount,
          meals: mealsCount,
          orders: ordersCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as {
      subscription?: SubscriptionPatch;
      note?: string;
    };

    const patch = body?.subscription;
    if (!patch || typeof patch !== "object") {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    const auditChangeParts: string[] = [];

    if (patch.plan !== undefined) {
      if (!isPlan(patch.plan)) {
        return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
      }
      update["subscription.plan"] = patch.plan;
      update["plan"] = patch.plan; // sync legacy
      auditChangeParts.push(`plan=${patch.plan}`);
    }

    if (patch.status !== undefined) {
      if (!isStatus(patch.status)) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }
      update["subscription.status"] = patch.status;
      auditChangeParts.push(`status=${patch.status}`);
    }

    if (patch.startedAt !== undefined) {
      update["subscription.startedAt"] = toDateOrNull(patch.startedAt);
      auditChangeParts.push("startedAt");
    }

    if (patch.trialEndsAt !== undefined) {
      update["subscription.trialEndsAt"] = toDateOrNull(patch.trialEndsAt);
      auditChangeParts.push("trialEndsAt");
    }

    if (patch.currentPeriodEnd !== undefined) {
      update["subscription.currentPeriodEnd"] = toDateOrNull(
        patch.currentPeriodEnd
      );
      auditChangeParts.push("currentPeriodEnd");
    }

    if (patch.notes !== undefined) {
      update["subscription.notes"] =
        typeof patch.notes === "string" ? patch.notes.trim() : "";
      auditChangeParts.push("notes");
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Nada para actualizar" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const auditEntry = {
      at: new Date(),
      byUserId: session.user.id ? session.user.id : undefined,
      change: auditChangeParts.join(","),
      note: typeof body.note === "string" ? body.note.trim() : "",
    };

    const updated = await Restaurant.findByIdAndUpdate(
      id,
      {
        $set: update,
        $push: { "subscription.audit": auditEntry },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ restaurant: updated }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar suscripción:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
