import {
  Order,
  //   OrderCustomer,
  DocumentType,
  PaymentType,
  TicketBrand,
  TicketMode,
} from "@/types/order";
import { toast } from "sonner";

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSubtotal(order: Pick<Order, "items">): number {
  return round2(
    order.items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0),
  );
}

export function calculateAdjustmentAmount(
  order: Pick<Order, "items" | "adjustment">,
): number {
  const subtotal = calculateSubtotal(order);
  const adj = order.adjustment;
  if (!adj) return 0;
  const percent = Number.isFinite(adj.percent) ? adj.percent : 0;
  if (percent <= 0) return 0;

  const amount = round2((subtotal * percent) / 100);
  return adj.kind === "discount" ? -amount : amount;
}

export function calculateOrderTotal(
  order: Pick<Order, "items" | "adjustment">,
): number {
  const subtotal = calculateSubtotal(order);
  const adjustment = calculateAdjustmentAmount(order);
  return round2(subtotal + adjustment);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function paymentLabel(type: PaymentType): string {
  switch (type) {
    case "cash":
      return "Efectivo";
    case "card":
      return "Tarjeta";
    case "transfer":
      return "Transferencia";
    default:
      return "Otro";
  }
}

export function buildKitchenOrderHtml(
  order: Order,
  brand?: TicketBrand,
): string {
  const createdAt = new Date();
  const dateStr = createdAt.toLocaleString("es-PE");

  const customerName = order.customer?.name?.trim() ?? "";
  const tableNumber = order.tableNumber?.trim() ?? "";

  const itemsHtml = order.items
    .map((i) => {
      const name = escapeHtml(i.name);
      const qty = Number.isFinite(i.qty) ? i.qty : 0;
      const notes = i.notes?.trim() ? escapeHtml(i.notes) : "";
      return `
        <tr>
          <td class="qty">${qty}x</td>
          <td class="name">
            <div class="item-name">${name}</div>
            ${notes ? `<div class="item-notes">→ ${notes}</div>` : ""}
          </td>
        </tr>
      `;
    })
    .join("");

  const brandName = brand?.name?.trim() ?? "";
  const brandLogoUrl = brand?.image?.trim() ?? "";

  const brandHtml =
    brandName || brandLogoUrl
      ? `
          <div class="brand">
            ${
              brandLogoUrl
                ? `<img class="brand-logo" src="${escapeHtml(
                    brandLogoUrl,
                  )}" alt="${escapeHtml(brandName || "Logo")}" />`
                : ""
            }
            ${
              brandName
                ? `<div class="brand-name">${escapeHtml(brandName)}</div>`
                : ""
            }
          </div>
        `
      : "";

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Orden #${order.orderNumber} - Cocina</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        html, body { padding: 0; margin: 0; }
        body { width: 72mm; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #000; }
        .center { text-align: center; }
        .muted { opacity: 0.75; }
        .hr { border-top: 1px dashed #000; margin: 6px 0; }
        h1 { font-size: 16px; margin: 0; font-weight: 700; }
        .brand { display: flex; flex-direction: column; align-items: center; gap: 2px; margin-bottom: 4px; }
        .brand-logo { max-width: 48mm; max-height: 18mm; object-fit: contain; }
        .brand-name { font-size: 12px; font-weight: 700; }
        .meta { font-size: 11px; line-height: 1.3; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        td { padding: 4px 0; vertical-align: top; }
        .qty { width: 15mm; font-weight: 700; font-size: 15px; }
        .name { width: 57mm; }
        .item-name { font-weight: 600; margin-bottom: 2px; }
        .item-notes { font-size: 11px; color: #444; font-style: italic; margin-top: 2px; padding-left: 4px; white-space: pre-wrap; }
        .wrap { word-break: break-word; }
        .big-text { font-size: 14px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="center">
        ${brandHtml}
        <h1>ORDEN DE COCINA</h1>
        <div class="meta"><strong>Orden #${order.orderNumber}</strong></div>
        <div class="meta muted">${escapeHtml(dateStr)}</div>
      </div>

      <div class="hr"></div>

      <div class="meta">
        ${
          tableNumber
            ? `<div class="big-text">🍽️ Mesa: ${escapeHtml(tableNumber)}</div>`
            : ""
        }
        ${
          customerName
            ? `<div class="wrap"><strong>Cliente:</strong> ${escapeHtml(
                customerName,
              )}</div>`
            : ""
        }
      </div>

      <div class="hr"></div>

      <table>
        <tbody>
          ${
            itemsHtml ||
            `<tr><td class="muted" colspan="2">(Sin productos)</td></tr>`
          }
        </tbody>
      </table>

      <div class="hr"></div>
      <div class="center meta muted">Preparar con cuidado</div>
    </body>
  </html>`;
}

export function buildTicketHtml(
  order: Order,
  mode: TicketMode,
  brand?: TicketBrand,
): string {
  const createdAt = new Date();
  const dateStr = createdAt.toLocaleString("es-PE");

  const customerName = order.customer?.name?.trim() ?? "";
  const customerSurname = order.customer?.surname?.trim() ?? "";
  const fullCustomerName = [customerName, customerSurname]
    .filter(Boolean)
    .join(" ");
  const docType =
    (order.customer?.documentType as DocumentType | undefined) ?? "none";
  const docNumber = order.customer?.documentNumber?.trim() ?? "";

  const tableNumber = order.tableNumber?.trim() ?? "";

  const subtotal = calculateSubtotal(order);
  const adjustmentAmount = calculateAdjustmentAmount(order);
  const total = calculateOrderTotal(order);
  const payments = mode === "paid" ? (order.payments ?? []) : [];
  const paidSum = payments.reduce(
    (acc, p) => acc + (Number.isFinite(p.amount) ? p.amount : 0),
    0,
  );

  const adj = order.adjustment;
  const adjustmentNote = adj?.note?.trim() ?? "";
  const adjustmentLabel =
    adj && Number.isFinite(adj.percent) && adj.percent > 0
      ? `${adj.kind === "discount" ? "Descuento" : "Recargo"} (${adj.percent}%)`
      : "";

  const itemsHtml = order.items
    .map((i) => {
      const name = escapeHtml(i.name);
      const qty = Number.isFinite(i.qty) ? i.qty : 0;
      const unit = Number.isFinite(i.unitPrice) ? i.unitPrice : 0;
      const line = unit * qty;
      return `
        <tr>
          <td class="name">${name}</td>
          <td class="qty">${qty}</td>
          <td class="money">S/. ${unit.toFixed(2)}</td>
          <td class="money">S/. ${line.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const paymentsHtml = payments.length
    ? payments
        .map(
          (p) => `
        <tr>
          <td class="name">${escapeHtml(paymentLabel(p.type))}</td>
          <td class="money" colspan="3">S/. ${Number(p.amount || 0).toFixed(
            2,
          )}</td>
        </tr>
      `,
        )
        .join("")
    : "";

  const docLine =
    docType !== "none" && docNumber
      ? `${escapeHtml(docType.toUpperCase())}: ${escapeHtml(docNumber)}`
      : "";

  const title = mode === "paid" ? "Comprobante interno" : "Precuenta";
  const subtitle = mode === "paid" ? "PAGADO" : "NO PAGADO";

  const brandName = brand?.name?.trim() ?? "";
  const brandLogoUrl = brand?.image?.trim() ?? "";

  const brandHtml =
    brandName || brandLogoUrl
      ? `
          <div class="brand">
            ${
              brandLogoUrl
                ? `<img class="brand-logo" src="${escapeHtml(
                    brandLogoUrl,
                  )}" alt="${escapeHtml(brandName || "Logo")}" />`
                : ""
            }
            ${
              brandName
                ? `<div class="brand-name">${escapeHtml(brandName)}</div>`
                : ""
            }
          </div>
        `
      : "";

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Orden #${order.orderNumber}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        html, body { padding: 0; margin: 0; }
        body { width: 72mm; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #000; }
        .center { text-align: center; }
        .muted { opacity: 0.75; }
        .hr { border-top: 1px dashed #000; margin: 6px 0; }
        h1 { font-size: 14px; margin: 0; }
        .brand { display: flex; flex-direction: column; align-items: center; gap: 2px; margin-bottom: 4px; }
        .brand-logo { max-width: 48mm; max-height: 18mm; object-fit: contain; }
        .brand-name { font-size: 12px; font-weight: 700; }
        .meta { font-size: 11px; line-height: 1.3; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        td { padding: 2px 0; vertical-align: top; }
        .name { width: 44mm; }
        .qty { width: 6mm; text-align: right; padding-right: 2mm; }
        .money { width: 22mm; text-align: right; white-space: nowrap; }
        .total { font-size: 12px; font-weight: 700; }
        .wrap { word-break: break-word; }
      </style>
    </head>
    <body>
      <div class="center">
        ${brandHtml}
        <h1>${escapeHtml(title)}</h1>
        <div class="meta muted">Orden #${order.orderNumber}</div>
        <div class="meta"><strong>${escapeHtml(subtitle)}</strong></div>
        <div class="meta muted">${escapeHtml(dateStr)}</div>
      </div>

      <div class="hr"></div>

      <div class="meta">
        <div class="wrap"><strong>Cliente:</strong> ${escapeHtml(
          fullCustomerName || "Sin cliente",
        )}</div>
        ${
          tableNumber
            ? `<div class="wrap"><strong>Mesa:</strong> ${escapeHtml(
                tableNumber,
              )}</div>`
            : ""
        }
        ${
          docLine
            ? `<div class="wrap"><strong>Doc:</strong> ${docLine}</div>`
            : ""
        }
      </div>

      <div class="hr"></div>

      <table>
        <thead>
          <tr>
            <td class="name muted">Producto</td>
            <td class="qty muted">Cant</td>
            <td class="money muted">PU</td>
            <td class="money muted">Imp</td>
          </tr>
        </thead>
        <tbody>
          ${
            itemsHtml ||
            `<tr><td class="muted" colspan="4">(Sin productos)</td></tr>`
          }
        </tbody>
      </table>

      <div class="hr"></div>

      <table>
        <tbody>
          <tr>
            <td class="name muted">SUBTOTAL</td>
            <td class="money" colspan="3">S/. ${subtotal.toFixed(2)}</td>
          </tr>
          ${
            adjustmentLabel
              ? `
          <tr>
            <td class="name muted">${escapeHtml(
              adjustmentLabel.toUpperCase(),
            )}</td>
            <td class="money" colspan="3">S/. ${adjustmentAmount.toFixed(
              2,
            )}</td>
          </tr>
          ${
            adjustmentNote
              ? `
          <tr>
            <td class="name muted wrap" colspan="4" style="font-size: 10px; font-style: italic; padding-left: 4px;">
              → ${escapeHtml(adjustmentNote)}
            </td>
          </tr>
          `
              : ""
          }
          `
              : ""
          }
          <tr>
            <td class="name total">TOTAL</td>
            <td class="money total" colspan="3">S/. ${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      ${
        paymentsHtml
          ? `
          <div class="hr"></div>
          <div class="meta"><strong>Pagos</strong></div>
          <table><tbody>${paymentsHtml}</tbody></table>
          <table><tbody>
            <tr>
              <td class="name muted">Pagado</td>
              <td class="money" colspan="3">S/. ${paidSum.toFixed(2)}</td>
            </tr>
          </tbody></table>
        `
          : ""
      }

      <div class="hr"></div>
      <div class="center meta muted">Gracias</div>
    </body>
  </html>`;
}

export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function printHtmlTicket(
  html: string,
  options?: { preOpenedWindow?: Window | null },
) {
  const printWindow = options?.preOpenedWindow || window.open("", "_blank");

  if (!printWindow) {
    toast.error("No se pudo abrir ventana de impresión");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Imprimir</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
          }
          @media screen {
            body { 
              padding: 20px;
              max-width: 80mm;
              margin: 0 auto;
            }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Esperar a que el contenido se cargue completamente
  // En móviles es crítico esperar a que las imágenes y el DOM estén listos
  if (printWindow.document.readyState === "complete") {
    // Ya está listo
    setTimeout(() => {
      printWindow.print();
    }, 500); // Pequeño delay adicional para móviles
  } else {
    // Esperar al evento load
    printWindow.addEventListener("load", () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    });
  }
}
