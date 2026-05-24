export type InvoiceType = 'FACTURA' | 'BOLETA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';

export interface BillingTax {
  name: string;      // Ej: 'IGV'
  code: string;      // Código oficial SUNAT (ej. '1000' para IGV)
  rate: number;      // Tasa en decimal o porcentaje (ej. 18 o 0.18)
  amount: number;    // Monto calculado de impuesto
}

export interface BillingItem {
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;    // Precio unitario con IGV/impuestos incluidos
  subtotal: number;     // Subtotal sin IGV (valor de venta unitario * cantidad)
  total: number;        // Total con IGV incluido (precio unitario * cantidad)
  taxes: BillingTax[];
}

export interface CustomerBillingDetails {
  documentType: 'DNI' | 'RUC' | 'PASAPORTE' | 'CE' | 'VARIOS';
  documentNumber: string;
  name: string;
  address?: string;
  email?: string;
}

export interface InvoiceRequest {
  externalId: string;   // ID de la orden en la base de datos de Viw-Carta
  invoiceType: InvoiceType;
  serie: string;        // Ej: 'F001' o 'B001'
  correlativo: number;  // Número correlativo de comprobante
  issueDate: Date;      // Fecha de emisión compensando GMT-05:00
  customer: CustomerBillingDetails;
  items: BillingItem[];
  subtotal: number;     // Suma de valor de venta (total gravado sin impuestos)
  taxTotal: number;     // Suma de todos los impuestos (ej. IGV total)
  total: number;        // Suma total (subtotal + taxTotal)
}

export interface InvoiceResponse {
  success: boolean;
  invoiceId?: string;      // ID único retornado por el OSE/PSE
  xmlUrl?: string;         // Enlace para descarga del XML timbrado
  pdfUrl?: string;         // Enlace de descarga de la representación impresa en PDF
  cdrUrl?: string;         // Enlace para descargar el CDR (Constancia de Recepción de la SUNAT)
  errorCode?: string;
  errorMessage?: string;
  rawResponse: Record<string, unknown>; // Cero tolerancia a 'any'
}

/**
 * Contrato Abstracto que todo proveedor de facturación en Viw-Carta debe implementar
 */
export interface IBillingProvider {
  providerName: string;
  emitInvoice(request: InvoiceRequest): Promise<InvoiceResponse>;
  cancelInvoice(invoiceId: string, reason: string): Promise<InvoiceResponse>;
  getInvoiceStatus(invoiceId: string): Promise<InvoiceResponse>;
}
