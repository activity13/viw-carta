import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";
import Order from "@/models/order";
import Restaurant from "@/models/restaurants";
import Meal from "@/models/meals";
import { getBillingProvider } from "@/lib/billing/factory";
import { InvoiceRequest } from "@/lib/billing/types";

// Helper to round numbers to 2 decimal places (standard for currency in Peru)
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Map customer document types from Viw-Carta format to SUNAT/Nubefact codes
const mapCustomerDocType = (docType: string): 'DNI' | 'RUC' | 'PASAPORTE' | 'CE' | 'VARIOS' => {
  const norm = docType?.toLowerCase();
  if (norm === 'dni') return 'DNI';
  if (norm === 'ruc') return 'RUC';
  if (norm === 'passport') return 'PASAPORTE';
  if (norm === 'ce') return 'CE';
  return 'VARIOS';
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const trace: string[] = [];
  const logTrace = (msg: string, level: "info" | "warn" | "error" = "info") => {
    const timestamp = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${msg}`;
    if (level === "error") {
      console.error(formatted);
    } else if (level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
    trace.push(formatted);
  };

  try {
    // Only waiter or staff can emit invoice documents
    const session = await requireAuth("waiter");
    await connectToDatabase();

    const { orderId } = await params;
    
    // We get the order
    const order = await Order.findOne({
      _id: orderId,
      restaurantId: session.user.restaurantId,
    });

    if (!order) {
      logTrace(`Order not found for ID: ${orderId}`, "error");
      return NextResponse.json(
        { error: "Orden no encontrada", trace },
        { status: 404 },
      );
    }

    // Read request body options if any
    const body = await request.json().catch(() => ({}));
    const assignNewNumber = body?.assignNewNumber === true;

    // Determine the scenario
    let scenarioName = "INITIAL EMISSION";
    if (assignNewNumber) {
      scenarioName = "ASSIGN NEW NUMBER & EMIT";
    } else if (order.fiscalStatus && order.fiscalStatus.status !== "pending") {
      scenarioName = "RE-EMISSION (RETRY SAME NUMBER)";
    }

    logTrace(`┌────────────────────────────────────────────────────────┐`);
    logTrace(`│             EVENT: ${scenarioName}             │`);
    logTrace(`└────────────────────────────────────────────────────────┘`);
    logTrace(`Order ID: ${order._id}, Invoice Type: ${order.invoiceType}, Status: ${order.status}`);
    logTrace(`Current Order Correlative: Prefix: ${order.fiscalDocumentPrefix || "NONE"}, Number: ${order.fiscalDocumentNumber || "NONE"}`);
    if (order.fiscalStatus) {
      logTrace(`Current Fiscal Status in DB: Status: ${order.fiscalStatus.status}, Provider: ${order.fiscalStatus.provider}, ErrorCode: ${order.fiscalStatus.errorCode || "NONE"}, ErrorMessage: ${order.fiscalStatus.errorMessage || "NONE"}`);
    } else {
      logTrace(`Current Fiscal Status in DB: NULL`);
    }

    // Only allow electronic emission for PAID orders
    if (order.status !== "paid") {
      logTrace(`Order status is "${order.status}". Must be "paid" to emit electronic invoice.`, "error");
      return NextResponse.json(
        { error: "La orden debe estar pagada para poder emitir un comprobante fiscal.", trace },
        { status: 400 },
      );
    }

    // nota_venta is local internal ticket, not processed by SUNAT
    if (order.invoiceType === "nota_venta") {
      logTrace(`Cannot emit local internal note_venta to SUNAT.`, "error");
      return NextResponse.json(
        { error: "Las notas de venta no se emiten fiscalmente a la SUNAT.", trace },
        { status: 400 },
      );
    }

    if (assignNewNumber) {
      logTrace(`[NEW NUMBER ASSIGNMENT] Starting dynamic sequence increment...`);
      const prevRestaurant = await Restaurant.findById(session.user.restaurantId);
      const prevInvoiceNum = prevRestaurant?.fiscal?.currentInvoiceNumber || 0;
      const prevReceiptNum = prevRestaurant?.fiscal?.currentReceiptNumber || 0;
      logTrace(`[NEW NUMBER ASSIGNMENT] Restaurant settings BEFORE increment: currentInvoiceNumber: ${prevInvoiceNum}, currentReceiptNumber: ${prevReceiptNum}`);

      const invoiceType = order.invoiceType || "nota_venta";
      let updateQuery = {};
      if (invoiceType === "factura") updateQuery = { $inc: { "fiscal.currentInvoiceNumber": 1 } };
      else if (invoiceType === "boleta") updateQuery = { $inc: { "fiscal.currentReceiptNumber": 1 } };
      
      logTrace(`[NEW NUMBER ASSIGNMENT] DB Increment Query: ${JSON.stringify(updateQuery)}`);

      if (Object.keys(updateQuery).length > 0) {
        const updatedRestaurant = await Restaurant.findOneAndUpdate(
          { _id: session.user.restaurantId },
          updateQuery,
          { new: true }
        );

        if (updatedRestaurant && updatedRestaurant.fiscal) {
          const newInvoiceNum = updatedRestaurant.fiscal.currentInvoiceNumber || 0;
          const newReceiptNum = updatedRestaurant.fiscal.currentReceiptNumber || 0;
          logTrace(`[NEW NUMBER ASSIGNMENT] Restaurant settings AFTER increment: currentInvoiceNumber: ${newInvoiceNum}, currentReceiptNumber: ${newReceiptNum}`);
          
          const oldPrefix = order.fiscalDocumentPrefix;
          const oldNum = order.fiscalDocumentNumber;

          if (invoiceType === "factura") {
            order.fiscalDocumentNumber = updatedRestaurant.fiscal.currentInvoiceNumber;
            order.fiscalDocumentPrefix = updatedRestaurant.fiscal.invoiceSeries || "F001";
          } else if (invoiceType === "boleta") {
            order.fiscalDocumentNumber = updatedRestaurant.fiscal.currentReceiptNumber;
            order.fiscalDocumentPrefix = updatedRestaurant.fiscal.receiptSeries || "B001";
          }
          await order.save();
          logTrace(`[NEW NUMBER ASSIGNMENT SUCCESS] Order correlative updated: ${oldPrefix}-${oldNum} ➔ ${order.fiscalDocumentPrefix}-${order.fiscalDocumentNumber}`);
        } else {
          logTrace(`[NEW NUMBER ASSIGNMENT ERROR] Restaurant or restaurant.fiscal undefined in DB.`, "error");
        }
      }
    }

    if (!order.fiscalDocumentPrefix || !order.fiscalDocumentNumber) {
      logTrace(`Missing serial document prefix/number after assignment. Prefix: ${order.fiscalDocumentPrefix}, Number: ${order.fiscalDocumentNumber}`, "error");
      return NextResponse.json(
        { error: "La orden no cuenta con un correlativo fiscal asignado.", trace },
        { status: 400 },
      );
    }

    const restaurant = await Restaurant.findById(session.user.restaurantId);
    if (!restaurant) {
      logTrace(`Restaurant not found for ID: ${session.user.restaurantId}`, "error");
      return NextResponse.json(
        { error: "Restaurante no encontrado.", trace },
        { status: 404 },
      );
    }

    // Active Sandbox fallback values for frictionless developer/client testing
    const providerName = restaurant.fiscal?.provider || "nubefact";
    const apiEndpoint =
      restaurant.fiscal?.apiEndpoint ||
      process.env.NUBEFACT_DEFAULT_ENDPOINT ||
      "https://api.nubefact.com/api/v1/79e79e3e-aefd-4584-9b42-661ee884cf46";
    const apiKey =
      restaurant.fiscal?.apiKey ||
      process.env.NUBEFACT_DEFAULT_TOKEN ||
      "b3a86a6c3d1b4de281a3be66ba2c72532f8ec95e72a54492bfb3d69a61418ad0";

    logTrace(`Provider configured: ${providerName}`);
    logTrace(`API Endpoint: ${apiEndpoint}`);
    logTrace(`API Key (truncated): ${apiKey ? apiKey.substring(0, 8) + "..." : "MISSING"}`);

    const billingProvider = getBillingProvider({
      provider: providerName,
      endpoint: apiEndpoint,
      token: apiKey,
    });

    // Determine type (BOLETA or FACTURA)
    const invoiceType = order.invoiceType === "factura" ? "FACTURA" : "BOLETA";

    // Proportional adjustment application (surcharge or discount) over items
    const adjustmentPercent = order.adjustment ? order.adjustment.percent : 0;
    const adjustmentKind = order.adjustment ? order.adjustment.kind : "discount";

    interface SchemaOrderItem {
      mealId: string;
      code?: string;
      name: string;
      unitPrice: number;
      qty: number;
    }

    const orderItems = (order.items || []) as unknown as SchemaOrderItem[];

    // Realizar consulta masiva de códigos como fallback para compatibilidad con órdenes antiguas
    const mealIds = orderItems.map((item) => item.mealId);
    const dbMeals = await Meal.find({ _id: { $in: mealIds } }).select("code");
    const mealCodeMap = new Map(dbMeals.map((m) => [m._id.toString(), (m as { code?: string }).code || ""]));

    const items = orderItems.map((item) => {
      const baseItemPrice = item.unitPrice;
      let itemPrice = baseItemPrice;

      if (adjustmentPercent > 0) {
        const diff = baseItemPrice * (adjustmentPercent / 100);
        itemPrice = adjustmentKind === "discount" ? baseItemPrice - diff : baseItemPrice + diff;
      }
      itemPrice = round2(itemPrice);

      const total = round2(itemPrice * item.qty);
      const subtotal = round2(total / 1.18); // Igv = 18% in Peru
      const tax = round2(total - subtotal);

      const customCode = item.code || mealCodeMap.get(item.mealId) || item.mealId;

      return {
        code: customCode,
        description: item.name,
        quantity: item.qty,
        unitPrice: itemPrice,
        subtotal: subtotal,
        total: total,
        taxes: [
          {
            name: "IGV",
            code: "1000",
            rate: 18.00,
            amount: tax,
          },
        ],
      };
    });

    // Grand totals based on items sum to secure exact mathematical consistency
    const total = items.reduce((acc, item) => round2(acc + item.total), 0);
    const subtotal = items.reduce((acc, item) => round2(acc + item.subtotal), 0);
    const taxTotal = items.reduce((acc, item) => round2(acc + item.total - item.subtotal), 0);

    const docType = mapCustomerDocType(order.customer?.documentType || "none");
    const rawDocNum = order.customer?.documentNumber || "";
    
    // Strip non-digit characters to be robust against spacing, dots, or typographical input markers
    const docNum = rawDocNum.replace(/\D/g, "") || "00000000";
    
    // In Peru, DNI documents must be exactly 8 digits, RUC exactly 11 digits.
    // If not valid, default to VARIOS/00000000 to prevent OSE/SUNAT rejections.
    let cleanDocType = docType;
    let cleanDocNum = docNum;
    if (docType === "DNI" && docNum.length !== 8) {
      cleanDocType = "VARIOS";
      cleanDocNum = "00000000";
    } else if (docType === "RUC" && docNum.length !== 11) {
      cleanDocType = "VARIOS";
      cleanDocNum = "00000000";
    }

    logTrace(`Customer original document type: "${order.customer?.documentType || "none"}", Original Number: "${rawDocNum}"`);
    logTrace(`Sanitized Document type: "${cleanDocType}", Sanitized Number: "${cleanDocNum}"`);
    logTrace(`Customer Name: "${order.customer?.name?.trim() || "Público en General"}"`);

    const invoiceRequest: InvoiceRequest = {
      externalId: String(order._id),
      invoiceType,
      serie: order.fiscalDocumentPrefix,
      correlativo: order.fiscalDocumentNumber,
      issueDate: new Date(),
      customer: {
        documentType: cleanDocType,
        documentNumber: cleanDocNum,
        name: [order.customer?.name?.trim(), order.customer?.surname?.trim()].filter(Boolean).join(" ") || "Público en General",
        address: order.customer?.address?.trim() || undefined,
        email: order.customer?.email?.trim() || undefined,
      },
      items,
      subtotal,
      taxTotal,
      total,
    };

    logTrace(`Order Items count: ${items.length}`);
    items.forEach((item, idx) => {
      logTrace(`  Item [${idx + 1}]: ID: ${item.code}, Description: "${item.description}", Qty: ${item.quantity}, Price: S/. ${item.unitPrice}, Total: S/. ${item.total}`);
    });
    logTrace(`Totals validation: Subtotal: S/. ${subtotal}, IGV: S/. ${taxTotal}, Total: S/. ${total}`);

    // Call electronic invoicing adapter
    logTrace(`[DISPATCH] Dispatching to Provider: ${providerName}. Endpoint: ${apiEndpoint}. Series: ${invoiceRequest.serie}, Correlativo: ${invoiceRequest.correlativo}. Customer: ${invoiceRequest.customer.documentType} / ${invoiceRequest.customer.documentNumber}`);
    
    const invoiceResponse = await billingProvider.emitInvoice(invoiceRequest);
    
    logTrace(`[RESPONSE] success: ${invoiceResponse.success}. ErrorCode: ${invoiceResponse.errorCode || 'NONE'}. ErrorMessage: ${invoiceResponse.errorMessage || 'NONE'}`);
    if (invoiceResponse.rawResponse) {
      logTrace(`[RESPONSE RAW] ${JSON.stringify(invoiceResponse.rawResponse)}`);
    }

    if (invoiceResponse.success) {
      order.fiscalStatus = {
        status: "emitted",
        provider: providerName as "nubefact" | "efact",
        pdfUrl: invoiceResponse.pdfUrl || "",
        xmlUrl: invoiceResponse.xmlUrl || "",
        cdrUrl: invoiceResponse.cdrUrl || "",
        errorCode: "",
        errorMessage: "",
        emittedAt: new Date(),
        cancelledAt: null,
        cancellationReason: "",
        rawResponse: invoiceResponse.rawResponse,
      };
      logTrace(`[FISCAL EMISSION SUCCESS] Order ${order._id} successfully stamped as ${invoiceRequest.serie}-${invoiceRequest.correlativo}!`);
    } else {
      order.fiscalStatus = {
        status: "failed",
        provider: providerName as "nubefact" | "efact",
        pdfUrl: "",
        xmlUrl: "",
        cdrUrl: "",
        errorCode: invoiceResponse.errorCode || "PSE_ERROR",
        errorMessage: invoiceResponse.errorMessage || "Error al emitir comprobante",
        emittedAt: null,
        cancelledAt: null,
        cancellationReason: "",
        rawResponse: invoiceResponse.rawResponse,
      };
      logTrace(`[FISCAL EMISSION FAILED] Stamping failed for ${invoiceRequest.serie}-${invoiceRequest.correlativo}. Error: "${invoiceResponse.errorMessage || "UNKNOWN ERROR"}"`, "error");
      if (invoiceResponse.errorMessage?.includes("existe")) {
        logTrace(`[COLLISION DETECTED] This correlative ${invoiceRequest.serie}-${invoiceRequest.correlativo} already exists in Nubefact. Suggestions: 1. Click "Asignar Nuevo Nº" in Finances to automatically increment and retry, OR 2. Manually align the database counters in Restaurant Settings.`, "warn");
      }
    }

    await order.save();
    logTrace(`Order database status updated and saved.`);

    return NextResponse.json(
      {
        success: invoiceResponse.success,
        fiscalStatus: order.fiscalStatus,
        trace,
      },
      { status: 200 },
    );
  } catch (error) {
    const timestamp = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[${timestamp}] [FISCAL EMISSION - CRITICAL CRASH ERROR]:`, error);
    trace.push(`[${timestamp}] [CRITICAL_CRASH] Error: ${errorMsg}`);
    try {
      return handleAuthError(error);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Error interno o de autorización al procesar la facturación electrónica.",
          details: errorMsg,
          trace,
        },
        { status: 500 },
      );
    }
  }
}
