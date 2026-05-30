import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import CashSession from "@/models/cashSession";
import Order from "@/models/order";
import Meal from "@/models/meals";
import "@/models/categories";

export async function GET() {
  try {
    await connectToDatabase();
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
    const meals = await Meal.find({ restaurantId: session.user.restaurantId })
      .populate("categoryId", "name")
      .lean();
    
    const mealCategoryMap: Record<string, string> = {};
    meals.forEach((m: any) => {
      if (m.categoryId && typeof m.categoryId === "object" && m.categoryId.name) {
        mealCategoryMap[String(m._id)] = m.categoryId.name;
      } else {
        mealCategoryMap[String(m._id)] = "Otros";
      }
    });

    const orders = ordersRaw.map((order: any) => {
      const itemsWithCategory = (order.items || []).map((item: any) => ({
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
      if (order.status === "cancelled") {
        cancelledOrderCount++;
        return;
      }

      if (order.status === "paid") {
        orderCount++;

        let subtotal = 0;
        order.items.forEach((item: { name: string; qty: number; unitPrice: number; mealId: string }) => {
          subtotal += item.unitPrice * item.qty;

          if (!dishesRaw[item.mealId]) {
            dishesRaw[item.mealId] = { name: item.name, qty: 0 };
          }
          dishesRaw[item.mealId].qty += item.qty;
          totalItemsSold += item.qty;
        });

        let orderTotal = subtotal;
        if (order.adjustment) {
          const adjAmount = subtotal * (order.adjustment.percent / 100);
          if (order.adjustment.kind === "discount") {
            orderTotal -= adjAmount;
            totalDiscounts += adjAmount;
          } else if (order.adjustment.kind === "surcharge") {
            orderTotal += adjAmount;
          }
        }
        totalSales += orderTotal;

        order.payments.forEach((payment: { type: string; amount: number }) => {
          if (payment.type === "cash") totalCash += payment.amount;
          else if (payment.type === "card") totalCard += payment.amount;
          else if (payment.type === "transfer") totalTransfer += payment.amount;
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
      expectedCashInRegister: openSession.startingCash + totalCash,
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
