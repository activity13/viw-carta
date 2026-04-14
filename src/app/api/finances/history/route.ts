import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/order";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
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

    let totalSales = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalTransfer = 0;
    let totalDiscounts = 0;
    let orderCount = 0;
    let cancelledOrderCount = 0;
    let totalItemsSold = 0;

    const dishesRaw: Record<string, { name: string; qty: number }> = {};

    orders.forEach((order) => {
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

    return NextResponse.json({ stats, orders: [] }, { status: 200 }); // Retornamos [] orders por peso de payload, el backoffice quizás solo necesita los totales por ahora. Pero si quiere tabla cruzada las pasamos
  } catch (error: unknown) {
    console.error("Error fetching historical stats:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
