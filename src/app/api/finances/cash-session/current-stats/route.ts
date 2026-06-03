import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import CashSession from "@/models/cashSession";
import Order from "@/models/order";
import Meal from "@/models/meals";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import mongoose from "mongoose";
import Categories from "@/models/categories";

export const dynamic = "force-dynamic";

interface LeanCategory {
  _id: string;
  name: string;
}

interface LeanMeal {
  _id: string;
  categoryId?: string | LeanCategory | null;
}

interface LeanOrderItem {
  mealId: string;
  name: string;
  unitPrice: number;
  qty: number;
  notes?: string;
  category?: string;
}

interface LeanOrderAdjustment {
  kind: "discount" | "surcharge";
  percent: number;
  note?: string;
}

interface LeanOrderPayment {
  type: "cash" | "card" | "transfer" | "other";
  amount: number;
}

interface LeanOrder {
  _id: string;
  status: "active" | "on_hold" | "paid" | "cancelled";
  items: LeanOrderItem[];
  adjustment?: LeanOrderAdjustment | null;
  payments: LeanOrderPayment[];
  createdByUserId?: { fullName: string } | string | null;
  orderNumber?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export async function GET() {
  try {
    await connectToDatabase();

    // Prevent Webpack tree-shaking of Categories model (required for Mongoose populate)
    if (!Categories) {
      console.warn("Categories model not registered");
    }

    const session = await getServerSession(authOptions);

    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const openSession = await CashSession.findOne({
      restaurantId: session.user.restaurantId,
      status: "open",
    });

    if (!openSession) {
      return NextResponse.json(
        { activeSession: null, stats: null },
        { status: 200 },
      );
    }

    // Calcular estadísticas en vivo
    const ordersRaw = await Order.find({ cashSessionId: openSession._id })
      .populate("createdByUserId", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    // Obtener el mapeo de platos a categorías
    const meals = (await Meal.find({ restaurantId: session.user.restaurantId })
      .populate("categoryId", "name")
      .lean()) as unknown as LeanMeal[];

    const mealCategoryMap: Record<string, string> = {};
    meals.forEach((m) => {
      if (m.categoryId && typeof m.categoryId === "object" && "name" in m.categoryId) {
        mealCategoryMap[String(m._id)] = m.categoryId.name;
      } else {
        mealCategoryMap[String(m._id)] = "Otros";
      }
    });

    const orders: LeanOrder[] = ((ordersRaw || []) as unknown as LeanOrder[])
      .filter(Boolean)
      .map((order) => {
        const itemsWithCategory = (order.items || []).map((item) => ({
          ...item,
          category: mealCategoryMap[String(item.mealId)] || "Otros"
        }));
        return {
          ...order,
          items: itemsWithCategory
        };
      });

    let totalSales = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalTransfer = 0;
    let totalDiscounts = 0;
    let orderCount = 0;
    let cancelledOrderCount = 0;
    let totalItemsSold = 0;

    // Para el top de platos
    const dishesRaw: Record<string, { name: string; qty: number }> = {};

    orders.forEach((order) => {
      if (!order) return;
      if (order.status === "cancelled") {
        cancelledOrderCount++;
        return;
      }

      if (order.status === "paid") {
        orderCount++;

        let subtotal = 0;
        (order.items || []).forEach((item) => {
          if (!item) return;
          const qty = item.qty || 0;
          const unitPrice = item.unitPrice || 0;
          subtotal += unitPrice * qty;

          if (item.mealId) {
            if (!dishesRaw[item.mealId]) {
              dishesRaw[item.mealId] = { name: item.name || "Producto sin nombre", qty: 0 };
            }
            dishesRaw[item.mealId].qty += qty;
          }
          totalItemsSold += qty;
        });

        let orderTotal = subtotal;
        if (order.adjustment) {
          const percent = order.adjustment.percent || 0;
          const adjAmount = subtotal * (percent / 100);
          if (order.adjustment.kind === "discount") {
            orderTotal -= adjAmount;
            totalDiscounts += adjAmount;
          } else if (order.adjustment.kind === "surcharge") {
            orderTotal += adjAmount;
          }
        }
        totalSales += orderTotal;

        (order.payments || []).forEach((payment) => {
          if (!payment) return;
          const amount = payment.amount || 0;
          if (payment.type === "cash") totalCash += amount;
          else if (payment.type === "card") totalCard += amount;
          else if (payment.type === "transfer") totalTransfer += amount;
        });
      }
    });

    const topDishes = Object.values(dishesRaw)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const stats = {
      totalSales,
      totalCash,
      totalCard,
      totalTransfer,
      totalDiscounts,
      orderCount,
      cancelledOrderCount,
      totalItemsSold,
      expectedCashInRegister: (openSession.startingCash || 0) + totalCash,
      topDishes,
      ticketPromedio: orderCount > 0 ? (totalSales / orderCount).toFixed(2) : 0,
    };

    return NextResponse.json(
      { activeSession: openSession, stats, orders },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching current cash session stats:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
