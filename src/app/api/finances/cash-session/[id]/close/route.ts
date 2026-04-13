import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import CashSession from "@/models/cashSession";
import Order from "@/models/order";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDatabase();
    const serverSession = await getServerSession(authOptions);

    if (
      !serverSession ||
      !["admin", "superadmin"].includes(serverSession.user?.role || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;

    const cashSession = await CashSession.findOne({
      _id: id,
      restaurantId: serverSession.user.restaurantId,
    });

    if (!cashSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (cashSession.status === "closed") {
      return NextResponse.json(
        { error: "Session is already closed" },
        { status: 400 },
      );
    }

    // Calcular totales leyendo las órdenes que pertenecen a esta sesión (y que están pagadas o anuladas)
    // Para simplificar, buscamos órdenes asociadas a este cashSessionId
    const orders = await Order.find({ cashSessionId: id });

    let totalSales = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalTransfer = 0;
    let totalDiscounts = 0;
    let totalSurcharges = 0;
    let orderCount = 0;
    let cancelledOrderCount = 0;

    orders.forEach((order) => {
      // Ignorar órdenes activas o en espera para el cálculo base (o podrías no cerrarla si hay órdenes activas)
      if (order.status === "cancelled") {
        cancelledOrderCount++;
        return; // No sumar dineros de cancelados
      }

      if (order.status === "paid") {
        orderCount++;

        let subtotal = 0;
        order.items.forEach((item: any) => {
          subtotal += item.unitPrice * item.qty;
        });

        // Aplicar descuentos/recargos para el totalSales "real"
        let orderTotal = subtotal;
        if (order.adjustment) {
          const adjAmount = subtotal * (order.adjustment.percent / 100);
          if (order.adjustment.kind === "discount") {
            orderTotal -= adjAmount;
            totalDiscounts += adjAmount;
          } else if (order.adjustment.kind === "surcharge") {
            orderTotal += adjAmount;
            totalSurcharges += adjAmount;
          }
        }
        totalSales += orderTotal;

        // Sumarizar métodos de pago
        order.payments.forEach((payment: any) => {
          if (payment.type === "cash") totalCash += payment.amount;
          else if (payment.type === "card") totalCard += payment.amount;
          else if (payment.type === "transfer") totalTransfer += payment.amount;
        });
      }
    });

    const expectedCashInRegister = cashSession.startingCash + totalCash;

    // Actualizar el documento de la sesión y cerrarlo
    cashSession.status = "closed";
    cashSession.closedAt = new Date();
    cashSession.closedByUserId = serverSession.user.id;
    cashSession.summary = {
      totalSales,
      totalCash,
      totalCard,
      totalTransfer,
      totalDiscounts,
      totalSurcharges,
      orderCount,
      cancelledOrderCount,
      expectedCashInRegister,
    };

    await cashSession.save();

    return NextResponse.json({ cashSession }, { status: 200 });
  } catch (error: any) {
    console.error("Error closing cash session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
