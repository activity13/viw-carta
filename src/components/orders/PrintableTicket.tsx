"use client";

import React, { forwardRef } from "react";
import { Order, TicketBrand, TicketMode, DocumentType } from "@/types/order";
import {
  calculateAdjustmentAmount,
  calculateOrderTotal,
  paymentLabel,
} from "@/lib/order-utils";

interface PrintableTicketProps {
  order: Order;
  mode: TicketMode | "kitchen";
  brand?: TicketBrand;
  printedBy?: string;
  isCopy?: boolean;
}

export const PrintableTicket = forwardRef<HTMLDivElement, PrintableTicketProps>(
  ({ order, mode, brand, printedBy, isCopy }, ref) => {
    const createdAt = new Date(order.createdAt || Date.now());
    const waiterName =
      printedBy ||
      (typeof order.createdByUserId === "object"
        ? order.createdByUserId?.fullName
        : undefined);

    const customerName = order.customer?.name?.trim() ?? "";
    const customerSurname = order.customer?.surname?.trim() ?? "";
    const fullCustomerName = [customerName, customerSurname]
      .filter(Boolean)
      .join(" ");

    const docType =
      (order.customer?.documentType as DocumentType | undefined) ?? "none";
    const docNumber = order.customer?.documentNumber?.trim() ?? "";
    const isFactura = order.invoiceType === "factura";
    const isBoleta = order.invoiceType === "boleta";

    // Fiscal info from brand
    const taxPercentage = brand?.fiscal?.taxPercentage ?? 18;
    const taxName = brand?.fiscal?.taxName || "IGV";

    const tableNumber = order.tableNumber?.trim() ?? "";

    const rawTotal = calculateOrderTotal(order);

    // Calculate Base Imponible and IGV mathematically
    // Formula: Total = Base * (1 + Tax/100) => Base = Total / (1 + Tax/100)
    const baseImponible = rawTotal / (1 + taxPercentage / 100);
    const igvAmount = rawTotal - baseImponible;

    const adjustmentAmount = calculateAdjustmentAmount(order);
    const payments = mode === "paid" ? (order.payments ?? []) : [];
    const paidSum = payments.reduce(
      (acc, p) => acc + (Number.isFinite(p.amount) ? p.amount : 0),
      0,
    );

    const adj = order.adjustment;
    const adjustmentNote = adj?.note?.trim() ?? "";
    const adjustmentLabel =
      adj && Number.isFinite(adj.percent) && adj.percent > 0
        ? `${adj.kind === "discount" ? "DESC." : "RECARGO"} (${adj.percent}%)`
        : "";

    let title = "";
    if (mode === "kitchen") {
      title = "ORDEN DE COCINA";
    } else {
      title = isFactura
        ? "FACTURA ELECTRÓNICA"
        : isBoleta
          ? "BOLETA ELECTRÓNICA"
          : "NOTA DE VENTA";
      if (mode === "prebill") title = "PRE-CUENTA";
    }

    // Number generation from backend fiscalDocument data or fallback
    const documentId =
      mode === "kitchen"
        ? `#${order.orderNumber}`
        : order.fiscalDocumentPrefix && order.fiscalDocumentNumber
          ? `${order.fiscalDocumentPrefix}-${String(order.fiscalDocumentNumber).padStart(6, "0")}`
          : `ORD-${order.orderNumber}`;

    const subtitle =
      mode === "paid"
        ? "PAGADO"
        : mode === "prebill"
          ? "DOCUMENTO NO VÁLIDO COMO COMPROBANTE DE PAGO"
          : "PREPARAR CON CUIDADO";

    const dashedLine = (
      <div className="border-b border-dashed border-black my-2"></div>
    );
    const solidLine = <div className="border-b-2 border-black my-2"></div>;
    const doubleLine = (
      <div className="border-b-4 border-double border-black my-2"></div>
    );

    return (
      <div
        ref={ref}
        className="w-[80mm] mx-auto p-4 bg-white text-black font-['Courier_New',Courier,monospace] text-[12px] leading-[1.3]"
      >
        {/* Header - Classic Style */}
        <div className="flex flex-col items-center mb-3 text-center">
          {brand?.image && (
            <img
              src={brand.image}
              alt="Logo"
              className="max-w-[48mm] max-h-[22mm] object-contain mb-3 grayscale"
            />
          )}
          {brand?.name && (
            <div className="text-[18px] font-serif font-bold uppercase tracking-wide leading-tight mb-1">
              {brand.name}
            </div>
          )}

          <div className="text-[10px] uppercase font-mono mt-1 space-y-0.5">
            {brand?.fiscal?.legalName && <div>{brand.fiscal.legalName}</div>}
            {brand?.fiscal?.ruc && <div>RUC: {brand.fiscal.ruc}</div>}
            {brand?.direction && <div>{brand.direction}</div>}
            {brand?.phone && <div>TEL: {brand.phone}</div>}
          </div>
        </div>

        {doubleLine}

        {/* Title */}
        <div className="text-center my-3">
          <div className="text-[15px] font-bold tracking-widest">{title}</div>
          <div className="text-[10px] mt-1">{subtitle}</div>
        </div>

        {/* Info Area */}
        <div className="text-[11px] font-mono mb-2">
          <div className="flex justify-between">
            <span>Ticket #:</span>
            <span>{documentId}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{createdAt.toLocaleString("es-PE")}</span>
          </div>
          {waiterName && (
            <div className="flex justify-between">
              <span>Atendido por:</span>
              <span className="uppercase">{waiterName}</span>
            </div>
          )}
          {tableNumber && (
            <div className="flex justify-between font-bold text-[13px] mt-1 border-y border-dotted border-gray-400 py-1">
              <span>MESA:</span>
              <span>{tableNumber}</span>
            </div>
          )}
        </div>

        {dashedLine}

        {/* Customer Data */}
        {mode !== "kitchen" && (
          <>
            <div className="my-2 text-[10px] font-mono space-y-0.5 uppercase">
              {fullCustomerName ? (
                <div>CLIENTE: {fullCustomerName}</div>
              ) : (
                <div>CLIENTE: GENERAL</div>
              )}

              {docType !== "none" && docNumber && (
                <div>
                  {docType}: {docNumber}
                </div>
              )}
            </div>
            {dashedLine}
          </>
        )}

        {/* Items Table - Dotted Leaders */}
        <div className="my-3 text-[11px] font-mono">
          {order.items.length === 0 && (
            <div className="text-center italic py-2">(Sin productos)</div>
          )}

          <div className="space-y-1.5">
            {order.items.map((i, idx) => {
              const qty = Number.isFinite(i.qty) ? i.qty : 0;
              const unit = Number.isFinite(i.unitPrice) ? i.unitPrice : 0;
              const line = unit * qty;

              if (mode === "kitchen") {
                return (
                  <div
                    key={idx}
                    className="border-b border-dashed border-gray-300 pb-1.5"
                  >
                    <div className="font-bold text-[14px]">
                      {qty}x {i.name.toUpperCase()}
                    </div>
                    {i.notes && (
                      <div className="text-[12px] italic ml-4 mt-0.5 font-sans">
                        &rarr; {i.notes.toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={idx} className="flex flex-col">
                  {/* Item Line with Dotted Leader */}
                  <div className="flex justify-between items-baseline w-full">
                    <div className="flex-none pr-1">
                      {qty}x {i.name.toUpperCase()}
                    </div>
                    <div className="flex-grow border-b-[2px] border-dotted border-black opacity-30 relative -top-1"></div>
                    <div className="flex-none pl-1 font-bold">
                      {line.toFixed(2)}
                    </div>
                  </div>
                  {/* Notes below item */}
                  {i.notes && (
                    <div className="text-[9px] italic text-gray-700 ml-4">
                      &rarr; {i.notes.toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {mode !== "kitchen" && (
          <>
            {dashedLine}

            {/* Totals Area */}
            <div className="my-2 text-[11px] font-mono space-y-1">
              <div className="flex justify-between items-baseline w-full">
                <span className="flex-none pr-1">OP. GRAVADAS</span>
                <div className="flex-grow border-b border-dotted border-black opacity-30 relative -top-1"></div>
                <span className="flex-none pl-1">
                  S/ {baseImponible.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-baseline w-full">
                <span className="flex-none pr-1">
                  {taxName} ({taxPercentage}%)
                </span>
                <div className="flex-grow border-b border-dotted border-black opacity-30 relative -top-1"></div>
                <span className="flex-none pl-1">
                  S/ {igvAmount.toFixed(2)}
                </span>
              </div>

              {adjustmentLabel && (
                <div className="flex justify-between items-baseline w-full">
                  <span className="flex-none pr-1">{adjustmentLabel}</span>
                  <div className="flex-grow border-b border-dotted border-black opacity-30 relative -top-1"></div>
                  <span className="flex-none pl-1">
                    S/ {adjustmentAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {adjustmentNote && (
                <div className="text-[9px] italic ml-2">
                  &rarr; {adjustmentNote.toUpperCase()}
                </div>
              )}

              {solidLine}

              <div className="flex justify-between items-end font-bold text-[15px] mt-2 mb-1">
                <span>TOTAL A PAGAR</span>
                <span>S/ {rawTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payments */}
            {payments.length > 0 && (
              <div className="mt-4 mb-2 text-[10px] font-mono bg-gray-50 p-2 rounded border border-dashed border-gray-300">
                <div className="font-bold mb-1 text-[11px]">MEDIO DE PAGO</div>
                {payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="uppercase">{paymentLabel(p.type)}</span>
                    <span>S/ {Number(p.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between mt-1 pt-1 border-t border-gray-300 font-bold">
                  <span>TOTAL RECIBIDO</span>
                  <span>S/ {paidSum.toFixed(2)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {doubleLine}

        {/* Footer */}
        <div className="text-center mt-3 text-[10px] font-serif space-y-1">
          {mode === "kitchen" ? (
            <div className="font-bold text-[12px]">*** FIN DE ORDEN ***</div>
          ) : (
            <>
              <div className="font-bold text-[13px] italic tracking-wide">
                ¡Gracias por su preferencia!
              </div>
              <div className="text-[9px] uppercase tracking-wider opacity-80 pt-1">
                -- Vuelve pronto --
              </div>
              {isCopy && (
                <div className="text-[9px] font-bold mt-2 uppercase border-t border-dashed border-gray-400 pt-1">
                  *** Copia de Sistema ***
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  },
);

PrintableTicket.displayName = "PrintableTicket";
