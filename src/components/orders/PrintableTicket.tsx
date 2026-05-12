"use client";

import React, { forwardRef } from "react";
import { Order, TicketBrand, TicketMode, DocumentType } from "@/types/order";
import {
  calculateSubtotal,
  calculateAdjustmentAmount,
  calculateOrderTotal,
  paymentLabel,
} from "@/lib/order-utils";

interface PrintableTicketProps {
  order: Order;
  mode: TicketMode | "kitchen";
  brand?: TicketBrand;
  printedBy?: string; // Nombre del mozo/admin
}

export const PrintableTicket = forwardRef<HTMLDivElement, PrintableTicketProps>(
  ({ order, mode, brand, printedBy }, ref) => {
    const createdAt = new Date(order.createdAt || Date.now());
    const printedAt = new Date();

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
    const payments = mode === "paid" ? order.payments ?? [] : [];
    const paidSum = payments.reduce(
      (acc, p) => acc + (Number.isFinite(p.amount) ? p.amount : 0),
      0
    );

    const adj = order.adjustment;
    const adjustmentNote = adj?.note?.trim() ?? "";
    const adjustmentLabel =
      adj && Number.isFinite(adj.percent) && adj.percent > 0
        ? `${adj.kind === "discount" ? "DESC." : "RECARGO"} (${adj.percent}%)`
        : "";

    const title = mode === "paid" ? "COMPROBANTE INTERNO" : mode === "prebill" ? "PRECUENTA" : "ORDEN DE COCINA";
    const subtitle = mode === "paid" ? "PAGADO" : mode === "prebill" ? "NO PAGADO" : "PREPARAR CON CUIDADO";

    const dashedLine = "------------------------------------------";
    const solidLine = "==========================================";

    return (
      <div
        ref={ref}
        className="w-[80mm] mx-auto p-4 bg-white text-black font-mono text-[11px] leading-[1.3]"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-4 text-center">
          {brand?.image && (
            <img
              src={brand.image}
              alt="Logo"
              className="max-w-[48mm] max-h-[18mm] object-contain mb-2 grayscale"
            />
          )}
          {brand?.name && (
            <div className="text-sm font-bold uppercase">{brand.name}</div>
          )}
          <div className="text-[14px] font-bold mt-2 uppercase">{title}</div>
          <div className="font-bold">{subtitle}</div>
          
          <div className="mt-2 text-[10px]">
            <div>ORDEN #{order.orderNumber}</div>
            <div>Apertura: {createdAt.toLocaleString("es-PE")}</div>
            <div>Impresión: {printedAt.toLocaleString("es-PE")}</div>
            {printedBy && <div>Atendido por: {printedBy}</div>}
          </div>
        </div>

        <div>{solidLine}</div>

        {/* Customer Data */}
        <div className="my-2">
          {fullCustomerName && (
            <div className="uppercase">CLIENTE: {fullCustomerName}</div>
          )}
          {tableNumber && <div className="uppercase font-bold text-[14px]">MESA: {tableNumber}</div>}
          {docType !== "none" && docNumber && mode !== "kitchen" && (
            <div className="uppercase">
              {docType}: {docNumber}
            </div>
          )}
          {!fullCustomerName && !tableNumber && (
            <div className="uppercase">CLIENTE: GENERAL</div>
          )}
        </div>

        <div>{dashedLine}</div>

        {/* Items Table */}
        <div className="my-2">
          <table className="w-full text-left table-fixed">
            {mode !== "kitchen" && (
              <thead>
                <tr className="uppercase text-[10px]">
                  <th className="w-[45%] font-normal">CANT - PROD</th>
                  <th className="w-[25%] font-normal text-right">P.U</th>
                  <th className="w-[30%] font-normal text-right">TOTAL</th>
                </tr>
              </thead>
            )}
            <tbody>
              {order.items.length === 0 && (
                <tr>
                  <td colSpan={mode === "kitchen" ? 1 : 3} className="py-2 text-center">
                    (Sin productos)
                  </td>
                </tr>
              )}
              {order.items.map((i, idx) => {
                const qty = Number.isFinite(i.qty) ? i.qty : 0;
                if (mode === "kitchen") {
                  return (
                    <tr key={idx} className="align-top border-b border-dashed border-gray-300">
                      <td className="py-2">
                        <div className="font-bold text-[13px]">{qty}x {i.name.toUpperCase()}</div>
                        {i.notes && <div className="text-[11px] italic ml-4">-> {i.notes.toUpperCase()}</div>}
                      </td>
                    </tr>
                  );
                }

                const unit = Number.isFinite(i.unitPrice) ? i.unitPrice : 0;
                const line = unit * qty;
                return (
                  <tr key={idx} className="align-top">
                    <td className="pr-1 py-1">
                      {qty}x {i.name.toUpperCase()}
                    </td>
                    <td className="text-right py-1">
                      {unit.toFixed(2)}
                    </td>
                    <td className="text-right py-1">
                      {line.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {mode !== "kitchen" && (
          <>
            <div>{dashedLine}</div>

            {/* Totals */}
            <div className="my-2">
              <div className="flex justify-between">
                <span>SUBTOTAL</span>
                <span>S/. {subtotal.toFixed(2)}</span>
              </div>

              {adjustmentLabel && (
                <div className="flex justify-between">
                  <span>{adjustmentLabel}</span>
                  <span>S/. {adjustmentAmount.toFixed(2)}</span>
                </div>
              )}
              {adjustmentNote && (
                <div className="text-[9px] italic ml-2">-> {adjustmentNote.toUpperCase()}</div>
              )}

              <div className="flex justify-between font-bold text-[13px] mt-1">
                <span>TOTAL</span>
                <span>S/. {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payments */}
            {payments.length > 0 && (
              <>
                <div>{solidLine}</div>
                <div className="my-2">
                  <div className="font-bold mb-1">PAGOS</div>
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="uppercase">{paymentLabel(p.type)}</span>
                      <span>S/. {Number(p.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between mt-1">
                    <span>TOTAL PAGADO</span>
                    <span>S/. {paidSum.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div>{solidLine}</div>
        <div className="text-center mt-2 text-[10px]">
          *** {mode === "kitchen" ? "FIN DE ORDEN" : "GRACIAS POR SU PREFERENCIA"} ***
        </div>
      </div>
    );
  }
);

PrintableTicket.displayName = "PrintableTicket";
