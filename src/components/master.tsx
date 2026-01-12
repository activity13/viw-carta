"use client";

import { useEffect, useMemo, useRef, useState, memo } from "react";
import Axios from "axios";
import { Reorder, useDragControls } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateMealForm from "@/components/createMeal";
import {
  ArrowUpDown,
  ClipboardList,
  Search,
  Edit3,
  Check,
  X,
  GripVertical,
  Loader2,
  Minus,
  PlusCircle,
  ShoppingCart,
  Settings2,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { useFab } from "@/providers/ActionProvider";

interface Category {
  _id: string;
  name: string;
}

interface Meal {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  restaurantId: string;
  display: {
    showInMenu: boolean;
    order: number;
  };
}

type OrderStatus = "active" | "on_hold" | "paid";

type DocumentType =
  | "none"
  | "passport"
  | "dni"
  | "ci"
  | "drivers_license"
  | "ce";

type PaymentType = "cash" | "card" | "transfer" | "other";

type AdjustmentKind = "discount" | "surcharge";

type OrderAdjustment = {
  kind: AdjustmentKind;
  percent: number;
  note?: string;
};

interface OrderItem {
  mealId: string;
  name: string;
  unitPrice: number;
  qty: number;
}

interface OrderCustomer {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
}

interface OrderPayment {
  type: PaymentType;
  amount: number;
}

interface Order {
  _id: string;
  orderNumber: number;
  status: OrderStatus;
  tableNumber?: string;
  customer?: Partial<OrderCustomer>;
  items: OrderItem[];
  adjustment?: OrderAdjustment | null;
  payments?: OrderPayment[];
  createdAt?: string;
  updatedAt?: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateSubtotal(order: Pick<Order, "items">): number {
  return round2(
    order.items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0)
  );
}

function calculateAdjustmentAmount(
  order: Pick<Order, "items" | "adjustment">
): number {
  const subtotal = calculateSubtotal(order);
  const adj = order.adjustment;
  if (!adj) return 0;
  const percent = Number.isFinite(adj.percent) ? adj.percent : 0;
  if (percent <= 0) return 0;

  const amount = round2((subtotal * percent) / 100);
  return adj.kind === "discount" ? -amount : amount;
}

function calculateOrderTotal(
  order: Pick<Order, "items" | "adjustment">
): number {
  const subtotal = calculateSubtotal(order);
  const adjustment = calculateAdjustmentAmount(order);
  return round2(subtotal + adjustment);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paymentLabel(type: PaymentType): string {
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

type TicketMode = "prebill" | "paid";

type TicketBrand = {
  name?: string;
  image?: string;
};

function buildTicketHtml(
  order: Order,
  mode: TicketMode,
  brand?: TicketBrand
): string {
  const createdAt = new Date();
  const dateStr = createdAt.toLocaleString("es-PE");

  const customerName = order.customer?.name?.trim() ?? "";
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
            2
          )}</td>
        </tr>
      `
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
                    brandLogoUrl
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
          customerName || "Sin cliente"
        )}</div>
        ${
          tableNumber
            ? `<div class="wrap"><strong>Mesa:</strong> ${escapeHtml(
                tableNumber
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
              adjustmentLabel.toUpperCase()
            )}</td>
            <td class="money" colspan="3">S/. ${adjustmentAmount.toFixed(
              2
            )}</td>
          </tr>
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

type PrintTicketOptions = {
  preOpenedWindow?: Window | null;
};

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function injectAutoPrint(html: string): string {
  const script = `
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          try { window.focus(); } catch (e) {}
          try { window.print(); } catch (e) {}
        }, 150);
      });
      window.onafterprint = () => {
        try { window.close(); } catch (e) {}
      };
    </script>
  `;

  if (html.includes("</body>"))
    return html.replace("</body>", `${script}</body>`);
  return html + script;
}

function printHtmlTicket(html: string, opts?: PrintTicketOptions) {
  // Mobile browsers often ignore iframe printing and show preview for the whole app page.
  // For mobile, print from a standalone document instead.
  if (isMobileUserAgent()) {
    const htmlWithPrint = injectAutoPrint(html);
    const blob = new Blob([htmlWithPrint], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const win = opts?.preOpenedWindow ?? window.open("", "_blank");
    if (!win) {
      toast.error("El navegador bloqueó la ventana de impresión");
      URL.revokeObjectURL(url);
      return;
    }

    // Navigate the pre-opened tab/window to the printable document.
    win.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";

  iframe.onload = () => {
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;

    const waitForImages = async () => {
      const images = Array.from(doc?.images ?? []);
      if (images.length === 0) return;

      await Promise.race([
        Promise.all(
          images.map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete) return resolve();
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
          )
        ),
        new Promise<void>((resolve) => setTimeout(resolve, 900)),
      ]);
    };

    (async () => {
      try {
        await waitForImages();
        win?.focus();
        win?.print();
      } catch {
        // ignore
      } finally {
        // Cleanup after the print dialog is triggered.
        setTimeout(() => iframe.remove(), 1000);
      }
    })();
  };

  // Use srcdoc to avoid document.write restrictions/popup blockers.
  // Some browsers require the iframe in DOM before load triggers.
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}

function getAxiosStatus(error: unknown): number | undefined {
  return Axios.isAxiosError(error) ? error.response?.status : undefined;
}

// Componente para edición rápida
const EditableCell = ({
  value,
  onSave,
  type = "text",
  className = "",
}: {
  value: string | number;
  onSave: (val: string | number) => void;
  type?: "text" | "number" | "textarea";
  className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (type === "textarea") {
      return (
        <div className="relative w-full">
          <Textarea
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="min-h-20 pr-8"
          />
          <div className="absolute right-1 top-1 flex flex-col gap-1">
            <button
              onMouseDown={handleSave}
              className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onMouseDown={() => {
                setCurrentValue(value);
                setIsEditing(false);
              }}
              className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="relative w-full">
        <Input
          type={type}
          value={currentValue}
          onChange={(e) =>
            setCurrentValue(
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="pr-8"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-muted/50 p-2 rounded border border-transparent hover:border-muted-foreground/20 transition-all group w-full overflow-hidden ${className}`}
      title="Click para editar"
    >
      {type === "number" && typeof value === "number"
        ? `S/. ${value.toFixed(2)}`
        : value || (
            <span className="text-muted-foreground italic text-xs">
              Sin contenido
            </span>
          )}
      <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-50 inline-block ml-2 align-middle" />
    </div>
  );
};

const DraggableMobileCard = memo(
  ({
    meal,
    handleQuickUpdate,
    handleToggleAvailable,
    handleAddToOrder,
    openFullEdit,
    loadingId,
    canDrag,
  }: {
    meal: Meal;
    handleQuickUpdate: (
      id: string,
      field: string,
      value: string | number
    ) => void;
    handleToggleAvailable: (id: string, state: boolean) => void;
    handleAddToOrder: (mealId: string) => void;
    openFullEdit: (id: string) => void;
    loadingId: string | null;
    canDrag: boolean;
  }) => {
    const controls = useDragControls();

    return (
      <Reorder.Item
        value={meal}
        dragListener={false}
        dragControls={controls}
        className="bg-card border rounded-lg shadow-sm flex overflow-hidden touch-none"
      >
        {/* Left: Big Drag Handle */}
        {canDrag && (
          <div
            onPointerDown={(e) => controls.start(e)}
            className="w-14 bg-muted/30 flex items-center justify-center cursor-grab active:cursor-grabbing border-r border-border/50"
          >
            <GripVertical className="w-8 h-8 text-muted-foreground/70" />
          </div>
        )}

        {/* Right: Content */}
        <div className="flex-1 p-3 flex flex-col gap-3">
          {/* Row 1: Name */}
          <div className="w-full">
            <EditableCell
              value={meal.name}
              onSave={(val) => handleQuickUpdate(meal._id, "name", val)}
              className="font-medium text-lg whitespace-normal wrap-break-word"
            />
          </div>

          {/* Row 2: Price + Actions */}
          <div className="flex flex-col gap-2">
            {/* Price */}
            <div className="flex items-center gap-2">
              <EditableCell
                type="number"
                value={meal.basePrice}
                onSave={(val) => handleQuickUpdate(meal._id, "basePrice", val)}
                className="font-bold text-lg w-24"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch
                  checked={meal.display?.showInMenu}
                  onCheckedChange={() =>
                    handleToggleAvailable(meal._id, meal.display?.showInMenu)
                  }
                  disabled={loadingId === meal._id}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAddToOrder(meal._id)}
                  className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary"
                  title="Agregar al pedido"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openFullEdit(meal._id)}
                  className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Reorder.Item>
    );
  }
);

DraggableMobileCard.displayName = "DraggableMobileCard";

const DraggableRow = memo(
  ({
    meal,
    handleQuickUpdate,
    handleToggleAvailable,
    handleAddToOrder,
    openFullEdit,
    loadingId,
    canDrag,
  }: {
    meal: Meal;
    handleQuickUpdate: (
      id: string,
      field: string,
      value: string | number
    ) => void;
    handleToggleAvailable: (id: string, state: boolean) => void;
    handleAddToOrder: (mealId: string) => void;
    openFullEdit: (id: string) => void;
    loadingId: string | null;
    canDrag: boolean;
  }) => {
    const controls = useDragControls();

    return (
      <Reorder.Item
        value={meal}
        as="div"
        dragListener={false}
        dragControls={controls}
        className="grid grid-cols-[5%_55%_20%_20%] items-center p-2 border-b bg-background hover:bg-muted/20 transition-colors"
      >
        <div className="flex justify-center">
          {canDrag ? (
            <div
              onPointerDown={(e) => controls.start(e)}
              className="cursor-grab active:cursor-grabbing p-1 touch-none"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>
        <div className="px-2 overflow-hidden">
          <EditableCell
            value={meal.name}
            onSave={(val) => handleQuickUpdate(meal._id, "name", val)}
            className="truncate block"
          />
        </div>
        <div className="px-2">
          <EditableCell
            type="number"
            value={meal.basePrice}
            onSave={(val) => handleQuickUpdate(meal._id, "basePrice", val)}
          />
        </div>
        <div className="px-2 flex justify-center items-center gap-2">
          <div className="flex flex-col items-center">
            <Switch
              checked={meal.display?.showInMenu}
              onCheckedChange={() =>
                handleToggleAvailable(meal._id, meal.display?.showInMenu)
              }
              disabled={loadingId === meal._id}
            />
          </div>
          <button
            onClick={() => handleAddToOrder(meal._id)}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary"
            title="Agregar al pedido"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => openFullEdit(meal._id)}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary"
            title="Edición completa"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </Reorder.Item>
    );
  }
);

DraggableRow.displayName = "DraggableRow";

export default function Master() {
  const { setActions } = useFab();
  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;
  const userId = session?.user?.id;

  const [ticketBrand, setTicketBrand] = useState<TicketBrand | null>(null);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [isDialogEditing, setIsDialogEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [reorderTimer, setReorderTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [lastReorderTime, setLastReorderTime] = useState<number>(0);

  // Orders/Sales (Pedidos)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [holdOrders, setHoldOrders] = useState<Order[]>([]);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrdersListModalOpen, setIsOrdersListModalOpen] = useState(false);
  const [isOrderBusy, setIsOrderBusy] = useState(false);
  const [isOrdersBusy, setIsOrdersBusy] = useState(false);

  const lastOrdersRefetchAtRef = useRef(0);

  const [customerDraft, setCustomerDraft] = useState<OrderCustomer>({
    name: "",
    documentType: "none",
    documentNumber: "",
  });
  const [tableNumberDraft, setTableNumberDraft] = useState<string>("");
  const [adjustmentDraft, setAdjustmentDraft] = useState<OrderAdjustment>({
    kind: "discount",
    percent: 0,
    note: "",
  });
  const [paymentsDraft, setPaymentsDraft] = useState<OrderPayment[]>([
    { type: "cash", amount: 0 },
  ]);

  useEffect(() => {
    let cancelled = false;

    const fetchBrand = async () => {
      if (!restaurantId) return;
      try {
        const res = await Axios.get<{ name?: string; image?: string }>(
          `/api/settings/${restaurantId}`
        );
        if (cancelled) return;
        setTicketBrand({
          name: res.data?.name,
          image: res.data?.image,
        });
      } catch {
        if (cancelled) return;
        setTicketBrand(null);
      }
    };

    fetchBrand();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const syncDraftsFromOrder = (order: Order) => {
    setCustomerDraft({
      name: order.customer?.name ?? "",
      documentType: (order.customer?.documentType as DocumentType) ?? "none",
      documentNumber: order.customer?.documentNumber ?? "",
    });

    setTableNumberDraft(order.tableNumber ?? "");
    setAdjustmentDraft(
      order.adjustment ?? { kind: "discount", percent: 0, note: "" }
    );

    const existingPayments = order.payments ?? [];
    setPaymentsDraft(
      existingPayments.length > 0
        ? existingPayments
        : [{ type: "cash", amount: 0 }]
    );
  };

  const fetchActiveOrder = async () => {
    if (!restaurantId) return;
    try {
      const res = await Axios.get<Order[]>("/api/orders", {
        params: { status: "active", mine: "true" },
      });

      const nextActive = res.data?.[0] ?? null;
      setActiveOrder(nextActive);
      if (nextActive) syncDraftsFromOrder(nextActive);
    } catch (error) {
      console.error("Error fetching active order:", error);
    }
  };

  const fetchHoldOrders = async () => {
    if (!restaurantId) return;
    try {
      const res = await Axios.get<Order[]>("/api/orders", {
        params: { status: "on_hold" },
      });
      setHoldOrders(res.data ?? []);
    } catch (error) {
      console.error("Error fetching hold orders:", error);
    }
  };

  const handleNewOrder = async () => {
    setIsOrderBusy(true);
    try {
      const res = await Axios.post<Order>("/api/orders", {});
      setActiveOrder(res.data);
      syncDraftsFromOrder(res.data);
      setIsOrderModalOpen(true);
      toast.success(`Orden #${res.data.orderNumber} creada`);
      await fetchHoldOrders();
    } catch (error: unknown) {
      const status = getAxiosStatus(error);
      if (status === 409) {
        toast.error("Ya tienes una orden activa");
        await fetchActiveOrder();
        setIsOrderModalOpen(true);
        return;
      }
      console.error("Error creating order:", error);
      toast.error("No se pudo crear la orden");
    } finally {
      setIsOrderBusy(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!activeOrder) return;
    setIsOrderBusy(true);
    try {
      const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "setCustomer",
        customer: customerDraft,
        tableNumber: tableNumberDraft,
      });
      setActiveOrder(res.data);
      syncDraftsFromOrder(res.data);
      toast.success("Datos del cliente guardados");
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("No se pudo guardar el cliente");
    } finally {
      setIsOrderBusy(false);
    }
  };

  const handleSaveAdjustment = async () => {
    if (!activeOrder) return;
    setIsOrderBusy(true);
    try {
      const adjustmentToSend =
        Number.isFinite(adjustmentDraft.percent) && adjustmentDraft.percent > 0
          ? adjustmentDraft
          : null;

      const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "setAdjustment",
        adjustment: adjustmentToSend,
      });

      setActiveOrder(res.data);
      syncDraftsFromOrder(res.data);
      toast.success("Ajuste guardado");
    } catch (error) {
      console.error("Error saving adjustment:", error);
      toast.error("No se pudo guardar el ajuste");
    } finally {
      setIsOrderBusy(false);
    }
  };

  const handleRemoveAdjustment = async () => {
    if (!activeOrder) return;
    setIsOrderBusy(true);
    try {
      const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "setAdjustment",
        adjustment: null,
      });

      setActiveOrder(res.data);
      syncDraftsFromOrder(res.data);
      toast.success("Ajuste eliminado");
    } catch (error) {
      console.error("Error removing adjustment:", error);
      toast.error("No se pudo eliminar el ajuste");
    } finally {
      setIsOrderBusy(false);
    }
  };

  const handleAddToOrder = async (mealId: string) => {
    if (!activeOrder) {
      toast.error("No hay orden activa. Abre el FAB → Nueva Orden");
      return;
    }
    setIsOrderBusy(true);
    try {
      const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "addItem",
        mealId,
        qtyDelta: 1,
      });
      setActiveOrder(res.data);
      toast.success("Agregado al pedido");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("No se pudo agregar al pedido");
    } finally {
      setIsOrderBusy(false);
    }
  };

  const handleSetItemQty = async (mealId: string, qty: number) => {
    if (!activeOrder) return;

    setIsOrderBusy(true);
    try {
      const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "setQty",
        mealId,
        qty,
      });
      setActiveOrder(res.data);
    } catch (error) {
      console.error("Error setting qty:", error);
      toast.error("No se pudo actualizar cantidad");
    } finally {
      setIsOrderBusy(false);
    }
  };

  const handleHoldOrder = async () => {
    if (!activeOrder) return;

    setIsOrderBusy(true);
    try {
      await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "hold",
      });
      toast.success("Orden en espera");
      setIsOrderModalOpen(false);
      setActiveOrder(null);
      await fetchHoldOrders();
    } catch (error) {
      console.error("Error holding order:", error);
      toast.error("No se pudo poner en espera");
    } finally {
      setIsOrderBusy(false);
    }
  };

  const handlePrintPrebill = () => {
    if (!activeOrder) {
      toast.error("No hay orden activa");
      return;
    }
    const html = buildTicketHtml(
      activeOrder,
      "prebill",
      ticketBrand ?? undefined
    );
    printHtmlTicket(html);
  };

  const handlePayOrder = async () => {
    if (!activeOrder) return;

    const subtotal = calculateSubtotal(activeOrder);
    const total = calculateOrderTotal(activeOrder);
    const paymentSum = paymentsDraft.reduce(
      (acc, p) => acc + (Number.isFinite(p.amount) ? p.amount : 0),
      0
    );

    if (subtotal <= 0) {
      toast.error("La orden está vacía");
      return;
    }

    const roundedTotal = round2(total);
    const roundedPayment = round2(paymentSum);

    if (roundedPayment !== roundedTotal) {
      toast.error("El pago debe igualar el total");
      return;
    }

    // On mobile, opening a print window after an async request can be blocked.
    const mobilePrintWindow = isMobileUserAgent()
      ? window.open("", "_blank")
      : null;
    setIsOrderBusy(true);
    try {
      const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "pay",
        payments: paymentsDraft,
      });

      const paidOrder: Order = {
        ...res.data,
        customer: res.data.customer ?? activeOrder.customer,
        items: res.data.items ?? activeOrder.items,
        payments: res.data.payments ?? paymentsDraft,
      };

      const html = buildTicketHtml(paidOrder, "paid", ticketBrand ?? undefined);
      printHtmlTicket(html, { preOpenedWindow: mobilePrintWindow });

      toast.success("Orden pagada");
      setIsOrderModalOpen(false);
      setActiveOrder(null);
      await fetchHoldOrders();
    } catch (error) {
      if (mobilePrintWindow) mobilePrintWindow.close();
      console.error("Error paying order:", error);
      toast.error("No se pudo registrar el pago");
    } finally {
      setIsOrderBusy(false);
    }
  };

  const handleOpenOrdersList = async () => {
    setIsOrdersListModalOpen(true);
    setIsOrdersBusy(true);
    try {
      await fetchHoldOrders();
    } finally {
      setIsOrdersBusy(false);
    }
  };

  const handleActivateOrder = async (orderId: string) => {
    setIsOrdersBusy(true);
    try {
      const res = await Axios.patch<Order>(`/api/orders/${orderId}`, {
        action: "activate",
      });

      // Update UI immediately so the FAB switches to "Ver Orden" without requiring refresh.
      setActiveOrder(res.data);
      syncDraftsFromOrder(res.data);
      setHoldOrders((prev) => prev.filter((o) => o._id !== orderId));
      setIsOrdersListModalOpen(false);
      setIsOrderModalOpen(true);

      await fetchHoldOrders();
    } catch (error: unknown) {
      const status = getAxiosStatus(error);
      if (status === 409) {
        toast.error("Ya tienes una orden activa");
        await fetchActiveOrder();
        return;
      }
      console.error("Error activating order:", error);
      toast.error("No se pudo activar la orden");
    } finally {
      setIsOrdersBusy(false);
    }
  };

  // Register FAB Actions
  useEffect(() => {
    const actions = [
      {
        label: "Nuevo Plato",
        icon: Plus,
        onClick: () => {
          setProductId(null);
          setIsDialogEditing(true);
        },
      },
      {
        label: "Nueva Orden",
        icon: ShoppingCart,
        onClick: handleNewOrder,
      },
    ];

    if (activeOrder) {
      actions.push({
        label: `Ver Orden #${activeOrder.orderNumber}`,
        icon: ClipboardList,
        onClick: () => setIsOrderModalOpen(true),
      });
    } else if (holdOrders.length > 0) {
      actions.push({
        label: `Órdenes (${holdOrders.length})`,
        icon: ClipboardList,
        onClick: handleOpenOrdersList,
      });
    }

    setActions(actions);
    return () => setActions([]);
  }, [
    setActions,
    activeOrder?._id,
    activeOrder?.orderNumber,
    holdOrders.length,
  ]);

  // Fetch Data
  const fetchData = async () => {
    if (!restaurantId) return;
    try {
      const [mealsRes, catsRes] = await Promise.all([
        Axios.get("/api/master/get", { params: { restaurantId } }),
        Axios.get("/api/categories/get", { params: { restaurantId } }),
      ]);

      setMeals(mealsRes.data);
      setCategories(catsRes.data);

      // Inicialmente todas las categorías seleccionadas
      if (selectedCategories.size === 0 && catsRes.data.length > 0) {
        setSelectedCategories(
          new Set(catsRes.data.map((c: Category) => c._id))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId || !userId) return;
    fetchActiveOrder();
    fetchHoldOrders();
  }, [restaurantId, userId]);

  // Refetch orders on focus / tab visibility and when modals open.
  useEffect(() => {
    if (!restaurantId || !userId) return;

    const maybeRefetchOrders = () => {
      // Avoid spamming when switching Windows virtual desktops (multiple focus events).
      const now = Date.now();
      const cooldownMs = 15_000;
      if (now - lastOrdersRefetchAtRef.current < cooldownMs) return;
      lastOrdersRefetchAtRef.current = now;

      fetchActiveOrder();
      fetchHoldOrders();
    };

    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      maybeRefetchOrders();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        maybeRefetchOrders();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [restaurantId, userId]);

  useEffect(() => {
    if (!restaurantId || !userId) return;
    if (!isOrderModalOpen) return;
    fetchActiveOrder();
  }, [isOrderModalOpen, restaurantId, userId]);

  useEffect(() => {
    if (!restaurantId || !userId) return;
    if (!isOrdersListModalOpen) return;
    fetchHoldOrders();
  }, [isOrdersListModalOpen, restaurantId, userId]);

  // Category Logic
  const toggleCategory = (id: string) => {
    if (categories.length === 0) return;

    // Si todas están seleccionadas, seleccionar solo la clickeada
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set([id]));
      return;
    }

    // Si el usuario hace click en la ÚNICA categoría seleccionada,
    // en vez de quedar en 0 seleccionadas, seleccionamos todas.
    if (selectedCategories.size === 1 && selectedCategories.has(id)) {
      setSelectedCategories(new Set(categories.map((c) => c._id)));
      return;
    }

    const newSet = new Set(selectedCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }

    // Safety net: si por alguna razón quedamos con 0, seleccionamos todas.
    if (newSet.size === 0) {
      setSelectedCategories(new Set(categories.map((c) => c._id)));
      return;
    }

    setSelectedCategories(newSet);
  };

  const toggleAllCategories = () => {
    // Solo habilitar todas, no deshabilitar
    setSelectedCategories(new Set(categories.map((c) => c._id)));
  };

  // Quick Update Logic
  const handleQuickUpdate = async (
    id: string,
    field: string,
    value: string | number
  ) => {
    // Optimistic update
    setMeals((prev) =>
      prev.map((m) => (m._id === id ? { ...m, [field]: value } : m))
    );

    try {
      await Axios.post("/api/master/quick-update", { id, field, value });
      toast.success("Actualizado");
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Error al guardar cambios");
      fetchData(); // Revert on error
    }
  };

  const handleToggleAvailable = async (
    mealId: string,
    currentState: boolean
  ) => {
    setLoadingId(mealId);
    // Optimistic
    setMeals((prev) =>
      prev.map((m) =>
        m._id === mealId
          ? { ...m, display: { ...m.display, showInMenu: !currentState } }
          : m
      )
    );

    try {
      await Axios.put("/api/master/update-availability", {
        mealId,
        isAvailable: !currentState,
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      fetchData(); // Revert
    } finally {
      setLoadingId(null);
    }
  };

  const openFullEdit = (id: string) => {
    setProductId(id);
    setIsDialogEditing(true);
  };

  // Reorder Logic
  const canReorder =
    selectedCategories.size === 1 &&
    searchTerm === "" &&
    filterStatus === "all" &&
    sortOrder === null;

  const handleReorder = (newOrder: Meal[]) => {
    if (!canReorder) return;

    // 1. Identify indices of the items currently in the view (the ones being reordered)
    const indicesToUpdate: number[] = [];
    meals.forEach((meal, index) => {
      if (selectedCategories.has(meal.categoryId)) {
        indicesToUpdate.push(index);
      }
    });

    // 2. Create new meals array
    const updatedMeals = [...meals];

    // 3. Place the items from newOrder into the slots
    indicesToUpdate.forEach((originalIndex, i) => {
      updatedMeals[originalIndex] = newOrder[i];
    });

    // 4. Update display.order for ALL items to match their new array index
    const finalMeals = updatedMeals.map((meal, index) => ({
      ...meal,
      display: { ...meal.display, order: index },
    }));

    setMeals(finalMeals);
    setLastReorderTime(Date.now());
  };

  useEffect(() => {
    if (lastReorderTime === 0) return;

    if (reorderTimer) clearTimeout(reorderTimer);
    setIsSavingOrder(true);

    const timer = setTimeout(async () => {
      const updatedItems = meals.map((item, index) => ({
        _id: item._id,
        order: index,
      }));

      try {
        await Axios.put("/api/master/reorder", {
          items: updatedItems,
        });
        // No need to update local state here as we did it optimistically in handleReorder
      } catch (err) {
        console.error("Reorder failed", err);
        toast.error("Error al guardar el orden");
        fetchData(); // Revert
      } finally {
        setIsSavingOrder(false);
      }
    }, 2000);

    setReorderTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [lastReorderTime]);

  // Filter & Sort
  const filteredMeals = useMemo(() => {
    return meals
      .filter((meal) => {
        const matchesCategory = selectedCategories.has(meal.categoryId);
        const matchesSearch = meal.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        const matchesStatus =
          filterStatus === "all"
            ? true
            : filterStatus === "active"
            ? meal.display?.showInMenu
            : !meal.display?.showInMenu;

        return matchesCategory && matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortOrder) {
          return sortOrder === "asc"
            ? a.basePrice - b.basePrice
            : b.basePrice - a.basePrice;
        }
        return (a.display?.order || 0) - (b.display?.order || 0);
      });
  }, [meals, selectedCategories, searchTerm, sortOrder, filterStatus]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Category Filter */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Categorías</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {selectedCategories.size} de {categories.length} visibles
            </span>
            <Link
              href="/backoffice/categories"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Editar
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-xl border border-border/50">
          {categories.map((cat) => {
            const isSelected = selectedCategories.has(cat._id);
            return (
              <Badge
                key={cat._id}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer select-none transition-all hover:scale-105 px-3 py-1.5 text-sm ${
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-background hover:bg-muted text-muted-foreground"
                }`}
                onClick={() => toggleCategory(cat._id)}
                onDoubleClick={toggleAllCategories}
              >
                {cat.name}
              </Badge>
            );
          })}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay categorías.</p>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground text-right">
          * Doble click para seleccionar todas
        </p>
      </div>

      {/* Product List */}
      <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center md:justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Productos
            {isSavingOrder && (
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Guardando orden...
              </span>
            )}
          </CardTitle>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <Select
              value={filterStatus}
              onValueChange={(val: "all" | "active" | "inactive") =>
                setFilterStatus(val)
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-background">
            {/* Desktop View (Table-like Grid) */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[5%_55%_20%_20%] bg-muted/50 p-3 font-medium text-sm text-muted-foreground border-b">
                <div className="text-center">#</div>
                <div>Nombre</div>
                <div
                  className="cursor-pointer hover:text-primary flex items-center gap-1"
                  onClick={() =>
                    setSortOrder((prev) =>
                      prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
                    )
                  }
                >
                  Precio
                  <ArrowUpDown
                    className={`h-3 w-3 ${
                      sortOrder ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="text-center">Acciones</div>
              </div>

              <Reorder.Group
                axis="y"
                values={filteredMeals}
                onReorder={handleReorder}
                className="divide-y"
              >
                {filteredMeals.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No se encontraron productos.
                  </div>
                ) : (
                  filteredMeals.map((meal) => (
                    <DraggableRow
                      key={meal._id}
                      meal={meal}
                      handleQuickUpdate={handleQuickUpdate}
                      handleToggleAvailable={handleToggleAvailable}
                      handleAddToOrder={handleAddToOrder}
                      openFullEdit={openFullEdit}
                      loadingId={loadingId}
                      canDrag={canReorder}
                    />
                  ))
                )}
              </Reorder.Group>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden p-4 bg-muted/10">
              <Reorder.Group
                axis="y"
                values={filteredMeals}
                onReorder={handleReorder}
                className="space-y-3"
              >
                {filteredMeals.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No se encontraron productos.
                  </div>
                ) : (
                  filteredMeals.map((meal) => (
                    <DraggableMobileCard
                      key={meal._id}
                      meal={meal}
                      handleQuickUpdate={handleQuickUpdate}
                      handleToggleAvailable={handleToggleAvailable}
                      handleAddToOrder={handleAddToOrder}
                      openFullEdit={openFullEdit}
                      loadingId={loadingId}
                      canDrag={canReorder}
                    />
                  ))
                )}
              </Reorder.Group>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {activeOrder ? `Orden #${activeOrder.orderNumber}` : "Orden"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            {!activeOrder ? (
              <div className="text-sm text-muted-foreground">
                No hay una orden activa.
              </div>
            ) : (
              <div className="space-y-5">
                {/* Customer */}
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="text-sm font-medium">Cliente</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <Input
                        placeholder="Nombre del cliente"
                        value={customerDraft.name}
                        onChange={(e) =>
                          setCustomerDraft((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Select
                        value={customerDraft.documentType}
                        onValueChange={(val: DocumentType) =>
                          setCustomerDraft((prev) => ({
                            ...prev,
                            documentType: val,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Documento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No requiere</SelectItem>
                          <SelectItem value="passport">Pasaporte</SelectItem>
                          <SelectItem value="dni">DNI</SelectItem>
                          <SelectItem value="ci">CI</SelectItem>
                          <SelectItem value="drivers_license">
                            Carné conducir
                          </SelectItem>
                          <SelectItem value="ce">CE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder="Mesa"
                        value={tableNumberDraft}
                        onChange={(e) => setTableNumberDraft(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Input
                        placeholder="Número de documento"
                        value={customerDraft.documentNumber}
                        onChange={(e) =>
                          setCustomerDraft((prev) => ({
                            ...prev,
                            documentNumber: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveCustomer}
                      disabled={isOrderBusy}
                      className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      {isOrderBusy ? "Guardando..." : "Guardar datos"}
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="text-sm font-medium">Productos</div>

                  {activeOrder.items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Agrega productos desde la lista.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeOrder.items.map((item) => (
                        <div
                          key={item.mealId}
                          className="flex items-center justify-between gap-3 border rounded-md p-3 bg-accent/80"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {item.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              S/. {item.unitPrice.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleSetItemQty(item.mealId, item.qty - 1)
                              }
                              disabled={isOrderBusy}
                              className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary disabled:opacity-60"
                              title="Quitar"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <Input
                              type="number"
                              value={item.qty}
                              min={0}
                              onChange={(e) =>
                                handleSetItemQty(
                                  item.mealId,
                                  Number(e.target.value)
                                )
                              }
                              className="w-20"
                            />
                            <button
                              onClick={() => handleAddToOrder(item.mealId)}
                              disabled={isOrderBusy}
                              className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary disabled:opacity-60"
                              title="Agregar"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prices */}
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="text-sm font-medium">Precios</div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      S/. {calculateSubtotal(activeOrder).toFixed(2)}
                    </span>
                  </div>

                  {activeOrder.adjustment ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {activeOrder.adjustment.kind === "discount"
                          ? "Descuento"
                          : "Recargo"}{" "}
                        ({activeOrder.adjustment.percent}%)
                      </span>
                      <span className="font-medium">
                        S/. {calculateAdjustmentAmount(activeOrder).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Sin descuento/recargo
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <Select
                      value={adjustmentDraft.kind}
                      onValueChange={(val: AdjustmentKind) =>
                        setAdjustmentDraft((prev) => ({ ...prev, kind: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Descuento</SelectItem>
                        <SelectItem value="surcharge">Recargo</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="col-span-2 flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="%"
                        min={0}
                        max={100}
                        step={0.01}
                        value={adjustmentDraft.percent}
                        onChange={(e) =>
                          setAdjustmentDraft((prev) => ({
                            ...prev,
                            percent: Number(e.target.value),
                          }))
                        }
                      />
                      <Input
                        placeholder="Observación"
                        value={adjustmentDraft.note ?? ""}
                        onChange={(e) =>
                          setAdjustmentDraft((prev) => ({
                            ...prev,
                            note: e.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={handleSaveAdjustment}
                        disabled={isOrderBusy}
                        className="px-3 py-2 text-xs rounded-md border hover:bg-muted disabled:opacity-60"
                        title="Guardar descuento/recargo"
                      >
                        Guardar
                      </button>
                      {activeOrder.adjustment && (
                        <button
                          onClick={handleRemoveAdjustment}
                          disabled={isOrderBusy}
                          className="px-3 py-2 text-xs rounded-md border hover:bg-muted disabled:opacity-60"
                          title="Quitar descuento/recargo"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-border/50">
                    <span>Total</span>
                    <span>
                      S/. {calculateOrderTotal(activeOrder).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payments */}
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  <div className="text-sm font-medium">Pago</div>
                  <div className="space-y-2">
                    {paymentsDraft.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2">
                        <Select
                          value={p.type}
                          onValueChange={(val: PaymentType) =>
                            setPaymentsDraft((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, type: val } : x
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                            <SelectItem value="transfer">
                              Transferencia
                            </SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="col-span-2 flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Monto"
                            value={p.amount}
                            onChange={(e) =>
                              setPaymentsDraft((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, amount: Number(e.target.value) }
                                    : x
                                )
                              )
                            }
                          />
                          {paymentsDraft.length > 1 && (
                            <button
                              onClick={() =>
                                setPaymentsDraft((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              disabled={isOrderBusy}
                              className="px-2 py-2 text-xs rounded-md border hover:bg-muted disabled:opacity-60"
                              title="Quitar forma de pago"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        setPaymentsDraft((prev) => [
                          ...prev,
                          { type: "cash", amount: 0 },
                        ])
                      }
                      disabled={isOrderBusy}
                      className="px-3 py-2 text-sm rounded-md border hover:bg-muted disabled:opacity-60"
                    >
                      + Añadir forma de pago
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0">
            <div className="flex w-full flex-col-reverse sm:flex-row sm:justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handlePrintPrebill}
                  disabled={!activeOrder || isOrderBusy}
                  className="px-3 py-2 text-sm rounded-md border bg-background hover:bg-muted disabled:opacity-60"
                >
                  Precuenta
                </button>
                <button
                  onClick={handleHoldOrder}
                  disabled={!activeOrder || isOrderBusy}
                  className="px-3 py-2 text-sm rounded-md border bg-background hover:bg-muted disabled:opacity-60"
                >
                  Poner en espera
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handlePayOrder}
                  disabled={!activeOrder || isOrderBusy}
                  className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isOrderBusy ? "Procesando..." : "Pagar"}
                </button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orders List Modal */}
      <Dialog
        open={isOrdersListModalOpen}
        onOpenChange={setIsOrdersListModalOpen}
      >
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Órdenes en espera</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            {isOrdersBusy ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando...
              </div>
            ) : holdOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No hay órdenes en espera.
              </div>
            ) : (
              <div className="space-y-2">
                {holdOrders.map((o) => {
                  const total = calculateOrderTotal(o);
                  return (
                    <div
                      key={o._id}
                      className="flex items-center justify-between gap-3 border rounded-md p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          Orden #{o.orderNumber}
                        </div>
                        <div className="text-sm font-medium truncate">
                          Mesa #{o.tableNumber}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {o.customer?.name ? o.customer.name : "Sin cliente"} ·
                          Total S/. {total.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleActivateOrder(o._id)}
                        disabled={isOrdersBusy}
                        className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        Activar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateMealForm
        restaurantId={restaurantId}
        isOpen={isDialogEditing}
        onClose={() => {
          setIsDialogEditing(false);
          setProductId(null);
        }}
        fetchMeals={fetchData}
        mealId={productId}
      />
    </div>
  );
}
