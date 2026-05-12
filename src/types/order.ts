export type OrderStatus = "active" | "on_hold" | "paid";

export type DocumentType =
  | "none"
  | "passport"
  | "dni"
  | "ruc"
  | "ci"
  | "drivers_license"
  | "ce";

export type PaymentType = "cash" | "card" | "transfer" | "other";

export interface OrderPayment {
  type: PaymentType;
  amount: number;
  note?: string;
}

export type AdjustmentKind = "discount" | "surcharge";

export type OrderAdjustment = {
  kind: AdjustmentKind;
  percent: number;
  note?: string;
};

export interface OrderItem {
  mealId: string;
  name: string;
  unitPrice: number;
  qty: number;
  notes?: string;
}

export interface OrderCustomer {
  name: string;
  surname?: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type InvoiceType = "boleta" | "factura" | "nota_venta";

export interface Order {
  _id: string;
  orderNumber: number;
  status: OrderStatus;
  tableNumber?: string;
  customer?: Partial<OrderCustomer>;
  invoiceType?: InvoiceType;
  fiscalDocumentPrefix?: string;
  fiscalDocumentNumber?: number;
  items: OrderItem[];
  adjustment?: OrderAdjustment | null;
  payments?: OrderPayment[];
  createdAt?: string;
  updatedAt?: string;
  createdByUserId?: { fullName: string } | string;
}

export type TicketMode = "prebill" | "paid";

export type TicketBrand = {
  name?: string;
  image?: string;
  direction?: string;
  phone?: string;
  fiscal?: {
    ruc?: string;
    legalName?: string;
    taxName?: string;
    taxPercentage?: number;
    invoiceSeries?: string;
    receiptSeries?: string;
  };
};

export type PrintTicketOptions = {
  preOpenedWindow?: Window | null;
};
