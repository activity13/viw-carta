import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";
import { withTransaction } from "@/lib/with-transaction";
import Counter from "@/models/counter";
import CashSession from "@/models/cashSession";
import Order from "@/models/order";
import Restaurant from "@/models/restaurants";

export async function GET(request: Request) {
  try {
    const session = await requireAuth("waiter");
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
    const session = await requireAuth("waiter");
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

    const cashSession = await CashSession.findOne({
      restaurantId,
      status: "open",
    });

    if (!cashSession) {
      return NextResponse.json(
        { 
          error: "No hay una caja abierta. Solicite apertura de caja.",
          code: "NO_OPEN_SESSION"
        },
        { status: 403 }
      );
    }

    interface RestaurantSettings {
      fiscal?: {
        defaultInvoiceType?: "boleta" | "factura" | "nota_venta";
      };
    }

    // Obtener la configuración fiscal por defecto del restaurante
    const restaurant = await Restaurant.findById(restaurantId)
      .select("fiscal.defaultInvoiceType")
      .lean();
    const defaultInvoiceType = (restaurant as unknown as RestaurantSettings)?.fiscal?.defaultInvoiceType || "nota_venta";

    // --- TRANSACCIÓN ACID (con fallback para dev local sin replica set) ---
    // El contador y la orden se crean atómicamente.
    // Si la orden falla, el contador hace rollback y no se pierden números.
    const order = await withTransaction(async (mongoSession) => {
      const sessionOpts = mongoSession ? { session: mongoSession } : {};

      const counter = await Counter.findOneAndUpdate(
        { restaurantId, key: "orderNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true, ...sessionOpts }
      );

      const orderNumber = counter.seq as number;

      if (mongoSession) {
        const [created] = await Order.create([{
          restaurantId,
          createdByUserId: userId,
          orderNumber,
          status: "active",
          tableNumber: "",
          observations: "",
          invoiceType: defaultInvoiceType,
          customer: { name: "", documentType: "none", documentNumber: "" },
          items: [],
          adjustment: null,
          payments: [],
          cashSessionId: cashSession._id,
        }], { session: mongoSession });
        return created;
      }

      return Order.create({
        restaurantId,
        createdByUserId: userId,
        orderNumber,
        status: "active",
        tableNumber: "",
        observations: "",
        invoiceType: defaultInvoiceType,
        customer: { name: "", documentType: "none", documentNumber: "" },
        items: [],
        adjustment: null,
        payments: [],
        cashSessionId: cashSession._id,
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
