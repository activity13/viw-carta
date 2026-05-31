import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/order";
import CashSession from "@/models/cashSession";
import Meal from "@/models/meals";
import mongoose from "mongoose";
import Categories from "@/models/categories";



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

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Garantizar el registro del alias singular Category bajo Next.js HMR/caching
    if (!mongoose.models.Category) {
      mongoose.model("Category", Categories.schema);
    }
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !["admin", "superadmin"].includes(session.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("start");
    const endDateParam = searchParams.get("end");
    const includeOrders = searchParams.get("includeOrders") === "true";

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 },
      );
    }

    // Forzar zona horaria local (-05:00) para la búsqueda (Corte medianoche Lima)
    const startDate = new Date(`${startDateParam}T00:00:00.000-05:00`);
    const endDate = new Date(`${endDateParam}T23:59:59.999-05:00`);

    const filter = {
      restaurantId: session.user.restaurantId,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    const orders = await Order.find(filter)
      .populate("createdByUserId", "fullName")
      .sort({ createdAt: -1 });

    const typedOrders = orders as unknown as LeanOrder[];

    let totalSales = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalTransfer = 0;
    let totalDiscounts = 0;
    let orderCount = 0;
    let cancelledOrderCount = 0;
    let totalItemsSold = 0;

    const dishesRaw: Record<string, { name: string; qty: number }> = {};

    typedOrders.forEach((order) => {
      if (order.status === "cancelled") {
        cancelledOrderCount++;
        return;
      }

      if (order.status === "paid" || order.status === "active" || order.status === "on_hold") {
        if(order.status === "paid") {
           orderCount++;
        }
        
        // Sumamos items incluso si está en espera, pero para facturación real el filtro es útil 
        // Acordamos sumar dinero SOLO en pagadas, igual que en el shift:
        if(order.status !== "paid") return;

        let subtotal = 0;
        order.items.forEach((item) => {
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

        order.payments.forEach((payment) => {
          if (payment.type === "cash") totalCash += payment.amount;
          else if (payment.type === "card") totalCard += payment.amount;
          else if (payment.type === "transfer") totalTransfer += payment.amount;
        });
      }
    });

    const topDishes = Object.values(dishesRaw)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 15); // Devolvemos el top 15 histórico

    const stats = {
      totalSales,
      totalCash,
      totalCard,
      totalTransfer,
      totalDiscounts,
      orderCount,
      cancelledOrderCount,
      totalItemsSold,
      topDishes,
      ticketPromedio: orderCount > 0 ? (totalSales / orderCount).toFixed(2) : 0,
    };

    // Consultar turnos de caja en el rango de fechas (abiertas, cerradas o con actividad en el periodo)
    const sessionsFilter = {
      restaurantId: session.user.restaurantId,
      $or: [
        { openedAt: { $gte: startDate, $lte: endDate } },
        { closedAt: { $gte: startDate, $lte: endDate } },
        { status: "open", openedAt: { $lte: endDate } }
      ]
    };

    const sessions = await CashSession.find(sessionsFilter)
      .populate("openedByUserId", "fullName username")
      .populate("closedByUserId", "fullName username")
      .sort({ openedAt: -1 });

    let ordersToSend: LeanOrder[] = [];
    if (includeOrders) {
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

      ordersToSend = (orders as unknown as { toJSON?: () => LeanOrder }[]).map((order) => {
        const orderObj = order.toJSON ? order.toJSON() : (order as unknown as LeanOrder);
        const itemsWithCategory = (orderObj.items || []).map((item) => ({
          ...item,
          category: mealCategoryMap[String(item.mealId)] || "Otros"
        }));
        return {
          ...orderObj,
          items: itemsWithCategory
        };
      });
    }

    return NextResponse.json(
      { stats, sessions, orders: ordersToSend },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error fetching historical stats:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
