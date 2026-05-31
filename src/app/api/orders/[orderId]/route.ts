import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";
import { withTransaction } from "@/lib/with-transaction";
import Meal from "@/models/meals";
import Order from "@/models/order";
import Client from "@/models/client";
import CashSession from "@/models/cashSession";
import Restaurant from "@/models/restaurants";
import { getBillingProvider } from "@/lib/billing/factory";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

type OrderItemDoc = {
  mealId: string;
  code?: string;
  name?: string;
  unitPrice?: number;
  qty: number;
  notes?: string;
};

type OrderAdjustmentDoc = {
  kind: "discount" | "surcharge";
  percent: number;
  note?: string;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateTotal(items: Array<{ unitPrice: number; qty: number }>) {
  return items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePercent(value: unknown): number | null {
  const num =
    toFiniteNumber(value) ??
    (typeof value === "string" && value.trim() !== ""
      ? toFiniteNumber(Number(value))
      : null);
  if (num === null) return null;
  if (num <= 0) return null;
  return Math.min(100, Math.max(0, num));
}

function normalizeAdjustment(value: unknown): OrderAdjustmentDoc | null {
  if (!isRecord(value)) return null;
  const kind = value.kind;
  if (kind !== "discount" && kind !== "surcharge") return null;
  const percent = normalizePercent(value.percent);
  if (percent === null) return null;

  const noteRaw = value.note;
  const note = typeof noteRaw === "string" ? noteRaw.trim() : "";
  // Keep it short to avoid huge documents / tickets
  const safeNote = note.length > 120 ? note.slice(0, 120) : note;

  return safeNote ? { kind, percent, note: safeNote } : { kind, percent };
}

function calculateAdjustedTotal(order: {
  items: Array<{ unitPrice: number; qty: number }>;
  adjustment?: OrderAdjustmentDoc | null;
}) {
  const subtotal = round2(calculateTotal(order.items));
  const adj = order.adjustment;
  if (!adj) return subtotal;

  const amount = round2((subtotal * adj.percent) / 100);
  const total = adj.kind === "discount" ? subtotal - amount : subtotal + amount;
  return round2(total);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
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
        { status: 404 },
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await requireAuth("waiter");
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
        { status: 404 },
      );
    }

    if (order.status === "paid" && action !== "cancel") {
      return NextResponse.json(
        { error: "La orden ya está pagada" },
        { status: 400 },
      );
    }

    if (action === "setCustomer") {
      const customer = body.customer as Record<string, unknown> | undefined;
      if (!customer || typeof customer !== "object") {
        return NextResponse.json(
          { error: "Cliente inválido" },
          { status: 400 },
        );
      }

      if (typeof body.tableNumber === "string") {
        order.tableNumber = body.tableNumber;
      }

      if (typeof body.invoiceType === "string" && ["boleta", "factura", "nota_venta"].includes(body.invoiceType)) {
        order.invoiceType = body.invoiceType;
      }

      order.customer = {
        name: typeof customer.name === "string" ? customer.name : "",
        surname: typeof customer.surname === "string" ? customer.surname : "",
        documentType:
          typeof customer.documentType === "string"
            ? customer.documentType
            : "none",
        documentNumber:
          typeof customer.documentNumber === "string"
            ? customer.documentNumber
            : "",
        email: typeof customer.email === "string" ? customer.email : "",
        phone: typeof customer.phone === "string" ? customer.phone : "",
        address: typeof customer.address === "string" ? customer.address : "",
      };

      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "setAdjustment") {
      const adjustment = normalizeAdjustment(body.adjustment);

      // Allow clearing by sending percent <= 0 or invalid payload
      order.adjustment = adjustment as unknown as typeof order.adjustment;

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
      }).select("name basePrice code availability");

      if (!meal) {
        return NextResponse.json(
          { error: "Producto no encontrado" },
          { status: 404 },
        );
      }

      const items = order.items as unknown as OrderItemDoc[];

      const existing = items.find((i) => i.mealId === mealId);
      const newQty = Math.max(0, (existing?.qty ?? 0) + qtyDelta);

      // Validar inventario si aplica
      if (meal.availability && typeof meal.availability.availableQuantity === "number") {
         if (newQty > meal.availability.availableQuantity && !meal.availability.continueSellingWhenOutOfStock) {
            return NextResponse.json(
               { error: `No se puede añadir al carrito porque el stock está agotado. Quedan ${meal.availability.availableQuantity} disponibles y no se permiten sobreventas.` },
               { status: 400 }
            );
         }
      }

      if (existing) {
        existing.qty = newQty;
        if (existing.qty === 0) {
          order.items = items.filter(
            (i) => i.mealId !== mealId,
          ) as unknown as typeof order.items;
        }
      } else {
        if (qtyDelta > 0) {
          order.items.push({
            mealId,
            code: (meal as { code?: string }).code || "",
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

      const items = order.items as unknown as OrderItemDoc[];
      const existing = items.find((i) => i.mealId === mealId);
      if (!existing) {
        return NextResponse.json(
          { error: "Item no encontrado" },
          { status: 404 },
        );
      }

      if (qty > 0) {
         // Validar inventario si aplica
         const meal = await Meal.findOne({
           _id: mealId,
           restaurantId: session.user.restaurantId,
         }).select("availability");
         
         if (meal && meal.availability && typeof meal.availability.availableQuantity === "number") {
            if (qty > meal.availability.availableQuantity && !meal.availability.continueSellingWhenOutOfStock) {
               return NextResponse.json(
                  { error: `No se puede añadir al carrito porque el stock está agotado. Quedan ${meal.availability.availableQuantity} disponibles y no se permiten sobreventas.` },
                  { status: 400 }
               );
            }
         }
      }

      if (qty === 0) {
        order.items = items.filter(
          (i) => i.mealId !== mealId,
        ) as unknown as typeof order.items;
      } else {
        existing.qty = qty;
      }

      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "setItemNotes") {
      const mealId = body.mealId;
      const notesRaw = body.notes;
      console.log("setting notes", { mealId, notesRaw });
      if (typeof mealId !== "string" || mealId.length === 0) {
        return NextResponse.json({ error: "mealId inválido" }, { status: 400 });
      }

      const notes = typeof notesRaw === "string" ? notesRaw.trim() : "";

      const items = order.items as unknown as OrderItemDoc[];
      const existing = items.find((i) => i.mealId === mealId);

      if (!existing) {
        return NextResponse.json(
          { error: "Item no encontrado" },
          { status: 404 },
        );
      }

      existing.notes = notes.slice(0, 500); // Limit to 500 chars

      // Ensure mongoose detects the change
      order.markModified("items");

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
          { status: 409 },
        );
      }

      order.status = "active";
      order.createdByUserId = session.user.id;
      order.heldAt = null;
      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "cancel") {
      if (order.status === "paid") {
        const userRole = session.user.role as string;
        if (userRole === "waiter") {
          return NextResponse.json(
            { error: "Solo administradores pueden anular órdenes pagadas" },
            { status: 403 }
          );
        }

        // Si ya fue emitido fiscalmente a SUNAT, debemos anularlo ante el OSE (Comunicación de Baja)
        if (order.fiscalStatus && order.fiscalStatus.status === "emitted") {
          const restaurant = await Restaurant.findById(session.user.restaurantId);
          if (!restaurant) {
            return NextResponse.json(
              { error: "Restaurante no encontrado para validar credenciales." },
              { status: 404 }
            );
          }

          const providerName = restaurant.fiscal?.provider || "nubefact";
          const apiEndpoint =
            restaurant.fiscal?.apiEndpoint ||
            process.env.NUBEFACT_DEFAULT_ENDPOINT ||
            "https://api.nubefact.com/api/v1/79e79e3e-aefd-4584-9b42-661ee884cf46";
          const apiKey =
            restaurant.fiscal?.apiKey ||
            process.env.NUBEFACT_DEFAULT_TOKEN ||
            "b3a86a6c3d1b4de281a3be66ba2c72532f8ec95e72a54492bfb3d69a61418ad0";

          if (apiEndpoint && !/^https?:\/\//i.test(apiEndpoint)) {
            console.warn(`[BILLING WARNING] Nubefact endpoint "${apiEndpoint}" has no protocol. Prepending https:// automatically.`);
          }

          const billingProvider = getBillingProvider({
            provider: providerName,
            endpoint: apiEndpoint,
            token: apiKey,
          });

          const documentId = `${order.fiscalDocumentPrefix}-${order.fiscalDocumentNumber}`;
          const reason = "Anulación de venta por el administrador en caja";

          const cancelRes = await billingProvider.cancelInvoice(documentId, reason);

          if (cancelRes.success) {
            order.fiscalStatus = {
              status: "cancelled",
              provider: providerName as "nubefact" | "efact",
              pdfUrl: order.fiscalStatus.pdfUrl || "",
              xmlUrl: order.fiscalStatus.xmlUrl || "",
              cdrUrl: order.fiscalStatus.cdrUrl || "",
              errorCode: "",
              errorMessage: "",
              emittedAt: order.fiscalStatus.emittedAt,
              cancelledAt: new Date(),
              cancellationReason: reason,
              rawResponse: cancelRes.rawResponse,
            };
          } else {
            return NextResponse.json(
              { 
                error: `SUNAT/OSE Error al anular: ${cancelRes.errorMessage || "Error al comunicar la baja."}`,
                details: cancelRes.rawResponse
              },
              { status: 500 }
            );
          }
        }
      }
      order.status = "cancelled";
      await order.save();
      return NextResponse.json(order, { status: 200 });
    }

    if (action === "pay") {
      const payments = body.payments;
      if (!Array.isArray(payments)) {
        return NextResponse.json(
          { error: "payments inválido" },
          { status: 400 },
        );
      }

      if (!order.items || order.items.length === 0) {
        return NextResponse.json(
          { error: "La orden está vacía" },
          { status: 400 },
        );
      }

      const total = calculateAdjustedTotal({
        items: order.items,
        adjustment: (order.adjustment ??
          null) as unknown as OrderAdjustmentDoc | null,
      });
      const sum = round2(
        payments.reduce((acc: number, p: unknown) => {
          const rec = isRecord(p) ? p : {};
          const amount = typeof rec.amount === "number" ? rec.amount : 0;
          return acc + (Number.isFinite(amount) ? amount : 0);
        }, 0),
      );

      if (sum !== total) {
        return NextResponse.json(
          { error: "El pago debe igualar el total" },
          { status: 400 },
        );
      }

      // Basic sanitization
      order.payments = payments.map((p: unknown) => {
        const rec = isRecord(p) ? p : {};
        return {
          type: typeof rec.type === "string" ? rec.type : "other",
          amount: typeof rec.amount === "number" ? rec.amount : 0,
        };
      }) as unknown as typeof order.payments;

      // --- TRANSACCIÓN ACID FISCAL (con fallback para dev local sin replica set) ---
      // El correlativo fiscal y el cambio de estado de la orden son atómicos.
      // Si order.save() falla, el correlativo fiscal hace rollback.
      await withTransaction(async (mongoSession) => {
        const sessionOpts = mongoSession ? { session: mongoSession } : {};

        const invoiceType = order.invoiceType || "nota_venta";
        
        let updateQuery = {};
        if (invoiceType === "factura") updateQuery = { $inc: { "fiscal.currentInvoiceNumber": 1 } };
        else if (invoiceType === "boleta") updateQuery = { $inc: { "fiscal.currentReceiptNumber": 1 } };
        else updateQuery = { $inc: { "fiscal.currentTicketNumber": 1 } };

        const restaurant = await Restaurant.findOneAndUpdate(
          { _id: session.user.restaurantId },
          updateQuery,
          { new: true, ...sessionOpts }
        );

        if (restaurant && restaurant.fiscal) {
          if (invoiceType === "factura") {
            order.fiscalDocumentPrefix = restaurant.fiscal.invoiceSeries || "F001";
            order.fiscalDocumentNumber = restaurant.fiscal.currentInvoiceNumber;
          } else if (invoiceType === "boleta") {
            order.fiscalDocumentPrefix = restaurant.fiscal.receiptSeries || "B001";
            order.fiscalDocumentNumber = restaurant.fiscal.currentReceiptNumber;
          } else {
            order.fiscalDocumentPrefix = restaurant.fiscal.ticketSeries || "NV01";
            order.fiscalDocumentNumber = restaurant.fiscal.currentTicketNumber;
          }
        }

        if (invoiceType === "boleta" || invoiceType === "factura") {
          order.fiscalStatus = {
            status: "pending",
            provider: (restaurant && restaurant.fiscal && restaurant.fiscal.provider) || "nubefact",
            pdfUrl: "",
            xmlUrl: "",
            cdrUrl: "",
            errorCode: "",
            errorMessage: "",
            emittedAt: null,
            cancelledAt: null,
            cancellationReason: "",
          };
        } else {
          order.fiscalStatus = null;
        }

        order.status = "paid";
        order.paidAt = new Date();

        const currentCashSession = mongoSession
          ? await CashSession.findOne({
              restaurantId: session.user.restaurantId,
              status: "open",
            }).session(mongoSession)
          : await CashSession.findOne({
              restaurantId: session.user.restaurantId,
              status: "open",
            });
        if (currentCashSession) {
          order.cashSessionId = currentCashSession._id;
        }

        // Descontar inventario y validar stock final
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
             const anyItem = item as any;
             if (!anyItem.mealId) continue;
             const mealQuery = mongoSession
               ? Meal.findOne({ _id: anyItem.mealId, restaurantId: session.user.restaurantId }).session(mongoSession)
               : Meal.findOne({ _id: anyItem.mealId, restaurantId: session.user.restaurantId });
               
             const meal = await mealQuery;
             
             if (meal && meal.availability && typeof meal.availability.availableQuantity === "number") {
                // Verificar si hay stock suficiente si no se permiten sobreventas
                if (!meal.availability.continueSellingWhenOutOfStock && meal.availability.availableQuantity < anyItem.qty) {
                  throw new Error(`Stock insuficiente para "${meal.name}". Quedan ${meal.availability.availableQuantity} y la orden pide ${anyItem.qty}. Por favor, ajusta la cantidad o retira el producto.`);
                }
                
                meal.availability.availableQuantity -= anyItem.qty;
                // El hook pre-save de Meal se encargará de ponerlo en no disponible si llega a <= 0
                await meal.save(sessionOpts);
             }
          }
        }

        await order.save(sessionOpts);
      });

      // Guardar métricas del cliente (fuera de la transacción: no es crítico)
      if (order.customer?.documentNumber) {
        try {
          const client = await Client.findOne({
            documentNumber: order.customer.documentNumber,
            restaurantId: session.user.restaurantId
          });
          
          if (client) {
            client.purchaseStats = client.purchaseStats || { totalSpent: 0, totalOrders: 0, lastOrderDate: null };
            client.purchaseStats.totalSpent = (client.purchaseStats.totalSpent || 0) + total;
            client.purchaseStats.totalOrders = (client.purchaseStats.totalOrders || 0) + 1;
            client.purchaseStats.lastOrderDate = new Date();
            
            client.orderHistory = client.orderHistory || [];
            client.orderHistory.push({
              orderId: order._id as unknown as React.Key,
              date: new Date(),
              amount: total
            });
            
            await client.save();
          }
        } catch (err) {
           console.error("Error actualizando métricas del cliente:", err);
        }
      }

      return NextResponse.json(order, { status: 200 });
    }

    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Stock insuficiente")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
