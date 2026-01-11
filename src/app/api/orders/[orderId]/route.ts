import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";
import Meal from "@/models/meals";
import Order from "@/models/order";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateTotal(items: Array<{ unitPrice: number; qty: number }>) {
  return items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
}

export async function GET({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  try {
    const session = await requireAuth("staff");
    await connectToDatabase();

    const { orderId } = await params;

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: session.user.restaurantId,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireAuth("staff");
    await connectToDatabase();

    const { orderId } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const action = body.action;
    if (typeof action !== "string") {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: session.user.restaurantId,
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json(
        { error: "La orden ya está pagada" },
        { status: 400 }
      );
    }

    if (action === "setCustomer") {
      const customer = body.customer as Record<string, unknown> | undefined;
      if (!customer || typeof customer !== "object") {
        return NextResponse.json(
          { error: "Cliente inválido" },
          { status: 400 }
        );
      }

      order.customer = {
        name: typeof customer.name === "string" ? customer.name : "",
        documentType:
          typeof customer.documentType === "string"
            ? customer.documentType
            : "none",
        documentNumber:
          typeof customer.documentNumber === "string"
            ? customer.documentNumber
            : "",
      };

      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "addItem") {
      const mealId = body.mealId;
      const qtyDeltaRaw = body.qtyDelta;

      if (typeof mealId !== "string" || mealId.length === 0) {
        return NextResponse.json({ error: "mealId inválido" }, { status: 400 });
      }

      const qtyDelta =
        typeof qtyDeltaRaw === "number" && Number.isFinite(qtyDeltaRaw)
          ? qtyDeltaRaw
          : 1;

      const meal = await Meal.findOne({
        _id: mealId,
        restaurantId: session.user.restaurantId,
      }).select("name basePrice");

      if (!meal) {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }

      const existing = order.items.find((i: any) => i.mealId === mealId);
      if (existing) {
        existing.qty = Math.max(0, (existing.qty ?? 0) + qtyDelta);
        if (existing.qty === 0) {
          order.items = order.items.filter((i: any) => i.mealId !== mealId);
        }
      } else {
        if (qtyDelta > 0) {
          order.items.push({
            mealId,
            name: meal.name,
            unitPrice: meal.basePrice,
            qty: qtyDelta,
          });
        }
      }

      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "setQty") {
      const mealId = body.mealId;
      const qtyRaw = body.qty;

      if (typeof mealId !== "string" || mealId.length === 0) {
        return NextResponse.json({ error: "mealId inválido" }, { status: 400 });
      }

      const qty =
        typeof qtyRaw === "number" && Number.isFinite(qtyRaw) ? qtyRaw : NaN;

      if (!Number.isFinite(qty) || qty < 0) {
        return NextResponse.json({ error: "qty inválido" }, { status: 400 });
      }

      const existing = order.items.find((i: any) => i.mealId === mealId);
      if (!existing) {
        return NextResponse.json(
          { error: "Item no encontrado" },
          { status: 404 }
        );
      }

      if (qty === 0) {
        order.items = order.items.filter((i: any) => i.mealId !== mealId);
      } else {
        existing.qty = qty;
      }

      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "hold") {
      order.status = "on_hold";
      order.heldAt = new Date();
      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "activate") {
      const existingActive = await Order.findOne({
        restaurantId: session.user.restaurantId,
        createdByUserId: session.user.id,
        status: "active",
        _id: { $ne: order._id },
      });

      if (existingActive) {
        return NextResponse.json(
          { error: "Ya existe una orden activa" },
          { status: 409 }
        );
      }

      order.status = "active";
      order.createdByUserId = session.user.id;
      order.heldAt = null;
      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "pay") {
      const payments = body.payments;
      if (!Array.isArray(payments)) {
        return NextResponse.json(
          { error: "payments inválido" },
          { status: 400 }
        );
      }

      if (!order.items || order.items.length === 0) {
        return NextResponse.json(
          { error: "La orden está vacía" },
          { status: 400 }
        );
      }

      const total = round2(calculateTotal(order.items));
      const sum = round2(
        payments.reduce((acc: number, p: any) => {
          const amount = typeof p?.amount === "number" ? p.amount : 0;
          return acc + (Number.isFinite(amount) ? amount : 0);
        }, 0)
      );

      if (sum !== total) {
        return NextResponse.json(
          { error: "El pago debe igualar el total" },
          { status: 400 }
        );
      }

      // Basic sanitization
      order.payments = payments.map((p: any) => ({
        type: typeof p?.type === "string" ? p.type : "other",
        amount: typeof p?.amount === "number" ? p.amount : 0,
      }));

      order.status = "paid";
      order.paidAt = new Date();

      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
  } catch (error) {
    return handleAuthError(error);
  }
}
