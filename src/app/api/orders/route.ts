import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";
import Counter from "@/models/counter";
import Order from "@/models/order";

async function getNextOrderNumber(restaurantId: string) {
  const counter = await Counter.findOneAndUpdate(
    { restaurantId, key: "orderNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return counter.seq as number;
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth("staff");
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const mine = searchParams.get("mine") === "true";

    const query: Record<string, unknown> = {
      restaurantId: session.user.restaurantId,
    };

    if (status) query.status = status;
    if (mine) query.createdByUserId = session.user.id;

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST() {
  try {
    const session = await requireAuth("staff");
    await connectToDatabase();

    const restaurantId = session.user.restaurantId as string;
    const userId = session.user.id;

    const existingActive = await Order.findOne({
      restaurantId,
      createdByUserId: userId,
      status: "active",
    });

    if (existingActive) {
      return NextResponse.json(
        { error: "Ya existe una orden activa" },
        { status: 409 }
      );
    }

    const orderNumber = await getNextOrderNumber(restaurantId);

    const order = await Order.create({
      restaurantId,
      createdByUserId: userId,
      orderNumber,
      status: "active",
      customer: { name: "", documentType: "none", documentNumber: "" },
      items: [],
      payments: [],
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
