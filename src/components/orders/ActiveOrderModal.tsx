import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Plus,
  Search,
  CreditCard,
  Printer,
  PauseCircle,
  Banknote,
  Utensils,
  User,
  Calculator,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag as ShoppingBagIcon,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import Axios from "axios";
import { toast } from "sonner";

import { OrderItemRow } from "./OrderItemRow";
import {
  calculateSubtotal,
  calculateAdjustmentAmount,
  calculateOrderTotal,
} from "@/lib/order-utils";
import {
  DocumentType,
  AdjustmentKind,
  PaymentType,
  InvoiceType,
} from "@/types/order";
import { useOrderManager } from "@/hooks/use-order-manager";
import { RoleGate } from "@/components/auth/RoleGate";

// Local interface matching master.tsx
export interface Meal {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  categoryId?: string;
}

interface ClientSearchResult {
  _id: string;
  documentType: string;
  documentNumber: string;
  name: string;
  lastName?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  clientType: string;
}

type OrderManager = ReturnType<typeof useOrderManager>;

interface ActiveOrderModalProps {
  manager: OrderManager;
  meals?: Meal[];
}

export function ActiveOrderModal({
  manager,
  meals = [],
}: ActiveOrderModalProps) {
  const {
    activeOrder,
    isOrderModalOpen,
    setIsOrderModalOpen,
    isOrderBusy,
    isCustomerSaving,
    customerDraft,
    setCustomerDraft,
    tableNumberDraft,
    setTableNumberDraft,
    invoiceTypeDraft,
    setInvoiceTypeDraft,
    handleSetItemQty,
    handleAddToOrder,
    handleUpdateItemNotes,
    adjustmentDraft,
    setAdjustmentDraft,
    handleSaveAdjustment,
    handleRemoveAdjustment,
    paymentsDraft,
    setPaymentsDraft,
    handlePrintKitchenOrder,
    handlePrintPrebill,
    handleHoldOrder,
    handlePayOrder,
    handleSaveCustomer,
  } = manager;

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [clientSearchStatus, setClientSearchStatus] = useState<"idle" | "searching" | "found" | "not_found">("idle");
  const [clientSearchResults, setClientSearchResults] = useState<ClientSearchResult[]>([]);
  const [showClientResults, setShowClientResults] = useState(false);
  const [isClientLocked, setIsClientLocked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const isCustomerValid = useMemo(() => {
    if (invoiceTypeDraft === "factura") {
      if (customerDraft.documentType !== "ruc") return false;
      if (customerDraft.documentNumber?.length !== 11) return false;
    }
    if (invoiceTypeDraft === "boleta" && customerDraft.documentType === "dni") {
      if (customerDraft.documentNumber?.length !== 8) return false;
    }
    return true;
  }, [customerDraft, invoiceTypeDraft]);

  const isCustomerDirty = useMemo(() => {
    if (!activeOrder) return false;
    // Check if dirty (same logic as hook)
    return (
      (activeOrder.invoiceType || "boleta") !==
        (invoiceTypeDraft || "boleta") ||
      (activeOrder.tableNumber || "") !== (tableNumberDraft || "") ||
      (activeOrder.customer?.name || "").trim() !==
        (customerDraft.name || "").trim() ||
      (activeOrder.customer?.surname || "").trim() !==
        (customerDraft.surname || "").trim() ||
      (activeOrder.customer?.documentType || "none") !==
        (customerDraft.documentType || "none") ||
      (activeOrder.customer?.documentNumber || "").trim() !==
        (customerDraft.documentNumber || "").trim() ||
      (activeOrder.customer?.email || "").trim() !==
        (customerDraft.email || "").trim() ||
      (activeOrder.customer?.phone || "").trim() !==
        (customerDraft.phone || "").trim() ||
      (activeOrder.customer?.address || "").trim() !==
        (customerDraft.address || "").trim()
    );
  }, [activeOrder, invoiceTypeDraft, tableNumberDraft, customerDraft]);

  // Debounced search effect for client dropdown
  useEffect(() => {
    const q = customerDraft.documentNumber?.trim() || "";

    if (!q) {
       setClientSearchStatus("idle");
       setClientSearchResults([]);
       return;
    }
    
    if (isClientLocked) return;

    setClientSearchStatus("searching");
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await Axios.get(`/api/clients?search=${q}`);
        setClientSearchResults(data || []);
        if (data && data.length > 0) {
           setClientSearchStatus("found");
        } else {
           setClientSearchStatus("not_found");
        }
      } catch {
        setClientSearchStatus("idle");
        setClientSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [customerDraft.documentNumber, isClientLocked]);

  const handleConfirmCustomerBtn = async () => {
    setIsConfirming(true);
    try {
      // First, try to register it as a new client if we haven't selected from list
      if (!isClientLocked && customerDraft.documentNumber.trim()) {
        try {
           await Axios.post("/api/clients", {
             documentType: customerDraft.documentType,
             documentNumber: customerDraft.documentNumber,
             name: customerDraft.name,
             lastName: customerDraft.surname || "",
             businessName: customerDraft.documentType === 'ruc' ? customerDraft.name : undefined,
             phone: customerDraft.phone,
             address: customerDraft.address,
             email: customerDraft.email
           });
           toast.success("Cliente nuevo registrado en BD");
        } catch(e: unknown) {
           // Silently ignore conflict if they already exist but weren't locked 
           console.log("Client creation skipped", e);
        }
      }
      
      // Save it to the order
      await handleSaveCustomer();
      setIsClientLocked(true); // Lock after save
    } finally {
      setIsConfirming(false);
    }
  };

  // Filter meals for search
  const filteredMeals = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return meals
      .filter(
        (meal) =>
          meal.name.toLowerCase().includes(query) ||
          meal.description?.toLowerCase().includes(query),
      )
      .slice(0, 5); // Limit suggestions
  }, [meals, searchQuery]);

  const handleSelectMeal = (mealId: string) => {
    handleAddToOrder(mealId);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // Safe totals
  const subtotal = activeOrder ? calculateSubtotal(activeOrder) : 0;
  const total = activeOrder ? calculateOrderTotal(activeOrder) : 0;
  const adjustmentAmount = activeOrder
    ? calculateAdjustmentAmount(activeOrder)
    : 0;

  // Helper to add payment method
  const addPaymentMethod = () => {
    setPaymentsDraft([...paymentsDraft, { type: "cash", amount: 0 }]);
  };

  const removePaymentMethod = (index: number) => {
    setPaymentsDraft(paymentsDraft.filter((_, i) => i !== index));
  };

  if (!activeOrder) return null;

  return (
    <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
      <DialogContent
        className="w-full max-w-[95vw] sm:max-w-[1400px]! h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* He
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="text-sm px-3 py-1 bg-background"
            >
              #{activeOrder.orderNumber}
            </Badge>
            <div>
              <DialogTitle className="text-lg font-bold">
                Orden Activa
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {activeOrder.status === "on_hold" ? "En espera" : "En curso"} ·{" "}
                {activeOrder.createdAt
                  ? new Date(activeOrder.createdAt).toLocaleString([], {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOrderBusy && (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOrderModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-muted/5 p-4 md:p-6 space-y-6">
          {/* 1. Products Container */}
          <SectionCard
            title="Productos"
            icon={<Utensils className="w-4 h-4" />}
            className="min-h-[400px] flex flex-col"
          >
            {/* Search Bar */}
            <div className="sticky top-0 z-20 py-2 -mx-2 px-2 border-b border-border/50 mb-3 backdrop-blur-sm bg-card/80">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto por código o nombre..."
                  className="pl-9 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-all hover:bg-muted/70"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                />

                {/* Search Suggestions Dropdown */}
                {showSearchResults && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border/50 rounded-lg shadow-xl ring-1 ring-black/5 z-50 max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredMeals.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No se encontraron productos
                      </div>
                    ) : (
                      filteredMeals.map((meal) => (
                        <button
                          key={meal._id}
                          className="w-full text-left p-3 hover:bg-muted/50 flex items-center justify-between border-b border-border/40 last:border-0 transition-colors group"
                          onClick={() => handleSelectMeal(meal._id)}
                        >
                          <div>
                            <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                              {meal.name}
                            </div>
                            {meal.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {meal.description}
                              </div>
                            )}
                          </div>
                          <div className="font-mono font-medium text-sm text-muted-foreground group-hover:text-foreground">
                            S/. {meal.basePrice.toFixed(2)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Overlay to close search */}
            {showSearchResults && (
              <div
                className="fixed inset-0 z-10 bg-transparent"
                onClick={() => setShowSearchResults(false)}
                style={{ pointerEvents: "auto" }} // Fixed pointer events
              />
            )}

            {/* Product List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {activeOrder.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/5">
                  <ShoppingBagIcon className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">La orden está vacía</p>
                  <p className="text-xs opacity-70">
                    Utiliza el buscador para agregar items
                  </p>
                </div>
              ) : (
                activeOrder.items.map((item) => (
                  <OrderItemRow
                    key={item.mealId}
                    item={item}
                    isOrderBusy={isOrderBusy}
                    handleSetItemQty={handleSetItemQty}
                    handleAddToOrder={handleAddToOrder}
                    handleUpdateItemNotes={handleUpdateItemNotes}
                  />
                ))
              )}
            </div>
          </SectionCard>

          {/* 2. Customer Container */}
          <RoleGate action="can_register_client">
          <SectionCard
            title="Información del Cliente"
            icon={<User className="w-4 h-4" />}
            className="overflow-hidden"
          >
            <div className="space-y-5">
              {/* Top Row: Primary Identification */}
              <div className="p-5 bg-linear-to-br from-white/80 via-white/50 to-muted/30 dark:from-zinc-900/80 dark:via-zinc-900/50 dark:to-muted/10 rounded-2xl border border-white/40 dark:border-white/5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.2)] space-y-4 sm:space-y-6 backdrop-blur-sm">
                {/* Row 1: Mesa & Comprobante */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6">
                  {/* Mesa */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 block">
                      Mesa
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-2.5 text-muted-foreground transition-colors group-focus-within:text-emerald-600 z-10">
                        <span className="text-sm font-bold">#</span>
                      </div>
                      <Input
                        value={tableNumberDraft}
                        onChange={(e) => setTableNumberDraft(e.target.value)}
                        placeholder="00"
                        className="pl-7 h-10 font-mono text-lg font-bold bg-white/50 dark:bg-zinc-900/50 border-muted-foreground/15 shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 rounded-xl text-foreground"
                      />
                    </div>
                  </div>

                  {/* Tipo Comprobante */}
                  <div className="col-span-1 sm:col-span-9">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 block">
                      Comprobante
                    </label>
                    <Select
                      value={invoiceTypeDraft}
                      onValueChange={(v: InvoiceType) => setInvoiceTypeDraft(v)}
                    >
                      <SelectTrigger className="h-10 bg-white/50 dark:bg-zinc-900/50 border-muted-foreground/15 shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 rounded-xl">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boleta">
                          Boleta de Venta (B-001)
                        </SelectItem>
                        <SelectItem value="factura">
                          Factura Electrónica (F-001)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Document Identity (Full Width now) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 block">
                      Tipo Doc.
                    </label>
                    <Select
                      value={customerDraft.documentType}
                      onValueChange={(v: DocumentType) =>
                        setCustomerDraft((prev) => ({
                          ...prev,
                          documentType: v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 bg-white/50 dark:bg-zinc-900/50 border-muted-foreground/15 shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 rounded-xl">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        <SelectItem value="dni">DNI</SelectItem>
                        <SelectItem value="ruc">RUC</SelectItem>
                        <SelectItem value="passport">Pasaporte</SelectItem>
                        <SelectItem value="ci">Cédula</SelectItem>
                        <SelectItem value="ce">CE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 sm:col-span-9">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 block">
                      Número / Buscar Cliente
                    </label>
                    <div className="relative group">
                      <Input
                        value={customerDraft.documentNumber}
                        onChange={(e) => {
                          setCustomerDraft((prev) => ({
                            ...prev,
                            documentNumber: e.target.value,
                          }));
                          setIsClientLocked(false);
                          setShowClientResults(true);
                        }}
                        onFocus={() => setShowClientResults(true)}
                        placeholder="DNI, RUC, Nombre..."
                        className="h-10 font-mono text-base tracking-wide bg-white/50 dark:bg-zinc-900/50 border-muted-foreground/15 shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 rounded-xl pl-4"
                      />
                      <div className="absolute right-3 top-3 pointer-events-none transition-opacity bg-transparent">
                        {clientSearchStatus === "searching" ? (
                           <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                        ) : isClientLocked ? (
                           <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : clientSearchStatus === "not_found" && customerDraft.documentNumber.length > 2 ? (
                           <Search className="w-4 h-4 text-amber-500" />
                        ) : (
                           <Search className="w-4 h-4 text-emerald-500/50 opacity-0 group-focus-within:opacity-100" />
                        )}
                      </div>

                      {/* Dropdown Suggestions */}
                      {showClientResults && clientSearchResults.length > 0 && !isClientLocked && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border/50 rounded-lg shadow-xl ring-1 ring-black/5 z-50 max-h-[250px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                          {clientSearchResults.map((client) => (
                            <button
                              key={client._id}
                              className="w-full text-left p-3 hover:bg-muted/50 flex flex-col border-b border-border/40 last:border-0 transition-colors"
                              onClick={() => {
                                setCustomerDraft(p => ({
                                  ...p,
                                  documentType: (client.documentType as DocumentType) || "none",
                                  documentNumber: client.documentNumber,
                                  name: client.name || client.businessName || "",
                                  surname: client.lastName || "",
                                  email: client.email || "",
                                  phone: client.phone || "",
                                  address: client.address || ""
                                }));
                                setIsClientLocked(true);
                                setShowClientResults(false);
                              }}
                            >
                              <div className="font-medium text-sm text-foreground">
                                {client.documentNumber} - {client.name || client.businessName} {client.lastName || ""}
                              </div>
                              {client.phone && <div className="text-xs text-muted-foreground">Tel: {client.phone}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Overlay to close search */}
                    {showClientResults && (
                      <div
                        className="fixed inset-0 z-10 bg-transparent"
                        onClick={() => setShowClientResults(false)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Info Row */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-medium text-foreground/80 mb-2 block ml-1">
                      Nombres
                    </label>
                    <Input
                      value={customerDraft.name}
                      onChange={(e) =>
                        setCustomerDraft((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Nombre del cliente"
                      disabled={isClientLocked}
                      className="h-10 bg-muted/5 border-input hover:bg-background focus:bg-background transition-colors focus:ring-2 focus:ring-emerald-500/20 rounded-xl disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground/80 mb-2 block ml-1">
                      Apellidos
                    </label>
                    <Input
                      value={customerDraft.surname || ""}
                      onChange={(e) =>
                        setCustomerDraft((prev) => ({
                          ...prev,
                          surname: e.target.value,
                        }))
                      }
                      placeholder="Apellidos"
                      disabled={isClientLocked}
                      className="h-10 bg-muted/5 border-input hover:bg-background focus:bg-background transition-colors focus:ring-2 focus:ring-emerald-500/20 rounded-xl disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Contact Info (Collapsible-ish feel) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="relative group">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 block">
                      E-mail
                    </label>
                    <Input
                      type="email"
                      value={customerDraft.email || ""}
                      onChange={(e) =>
                        setCustomerDraft((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="Email"
                      disabled={isClientLocked}
                      className=" h-10 border-muted-foreground/20 bg-background/50 focus:bg-background transition-all focus:ring-2 focus:ring-emerald-500/20 rounded-xl disabled:opacity-50"
                    />
                  </div>

                  <div className="relative group">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 block">
                      Celular
                    </label>
                    <Input
                      type="tel"
                      value={customerDraft.phone || ""}
                      onChange={(e) =>
                        setCustomerDraft((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="Celular"
                      disabled={isClientLocked}
                      className=" h-10 border-muted-foreground/20 bg-background/50 focus:bg-background transition-all focus:ring-2 focus:ring-emerald-500/20 rounded-xl disabled:opacity-50"
                    />
                  </div>

                  <div className="relative group">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2 block">
                      Dirección
                    </label>
                    <Input
                      value={customerDraft.address || ""}
                      onChange={(e) =>
                        setCustomerDraft((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Dirección"
                      disabled={isClientLocked}
                      className=" h-10 border-muted-foreground/20 bg-background/50 focus:bg-background transition-all focus:ring-2 focus:ring-emerald-500/20 rounded-xl disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4 pt-3 border-t border-dashed items-center gap-4">
              <div className="flex items-center">
                {!isCustomerValid ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Faltan datos requeridos (ej. RUC = 11 dígitos)
                  </span>
                ) : clientSearchStatus === "not_found" && customerDraft.documentNumber.trim().length > 2 && !isClientLocked ? (
                  <div className="flex items-center gap-2">
                     <span className="text-[11px] font-medium text-amber-600 border border-amber-600/30 rounded px-2">Cliente nuevo (Ingresar datos a mano)</span>
                  </div>
                ) : null}
              </div>

              <div className="h-6 flex items-center justify-end">
                {isCustomerSaving ? (
                  <div className="flex items-center text-xs text-muted-foreground animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                    <span className="text-[10px] uppercase tracking-wide">
                      Guardando...
                    </span>
                  </div>
                ) : !isCustomerDirty ? (
                  <div className="flex items-center text-xs text-emerald-600 font-medium opacity-80 transition-all duration-500 ease-out">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-[10px] uppercase tracking-wide">
                      Guardado en orden
                    </span>
                  </div>
                ) : (
                  <Button size="sm" className="h-7 text-[11px] px-3 bg-primary/90" onClick={handleConfirmCustomerBtn} disabled={isConfirming}>
                    {isConfirming && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                     Confirmar en Orden
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>
          </RoleGate>

          {/* 3. Pricing Container */}
          <RoleGate action="can_set_adjustment">
          <SectionCard
            title="Resumen de Precios"
            icon={<Calculator className="w-4 h-4" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-md border border-border/50">
                  <Select
                    value={adjustmentDraft.kind}
                    onValueChange={(val: AdjustmentKind) =>
                      setAdjustmentDraft((prev) => ({ ...prev, kind: val }))
                    }
                  >
                    <SelectTrigger className="w-[110px] h-8 text-xs bg-background">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Descuento</SelectItem>
                      <SelectItem value="surcharge">Recargo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="%"
                    className="w-16 h-8 text-xs text-center bg-background"
                    min={0}
                    max={100}
                    value={adjustmentDraft.percent || ""}
                    onChange={(e) =>
                      setAdjustmentDraft((prev) => ({
                        ...prev,
                        percent: Number(e.target.value),
                      }))
                    }
                  />
                  <Input
                    placeholder="Motivo (opcional)"
                    className="h-8 text-xs flex-1 bg-background"
                    value={adjustmentDraft.note || ""}
                    onChange={(e) =>
                      setAdjustmentDraft((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={handleSaveAdjustment}
                    disabled={isOrderBusy}
                    title="Aplicar ajuste"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {activeOrder.adjustment && (
                  <div className="flex items-center justify-between text-xs p-2 bg-yellow-50/10 border border-yellow-500/20 text-yellow-600 rounded">
                    <span>
                      {activeOrder.adjustment.kind === "discount"
                        ? "Descuento aplicado"
                        : "Recargo aplicado"}
                      : {activeOrder.adjustment.percent}%
                    </span>
                    <button
                      onClick={handleRemoveAdjustment}
                      className="underline hover:text-yellow-700"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">S/. {subtotal.toFixed(2)}</span>
                </div>
                {activeOrder.adjustment && (
                  <div className="flex justify-between text-emerald-600">
                    <span>
                      {activeOrder.adjustment.kind === "discount"
                        ? "Descuento"
                        : "Recargo"}{" "}
                      ({activeOrder.adjustment.percent}%)
                    </span>
                    <span className="font-mono">
                      {activeOrder.adjustment.kind === "discount" ? "-" : "+"}
                      S/. {adjustmentAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono text-primary">
                    S/. {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>
          </RoleGate>

          {/* 4. Payment Container */}
          <RoleGate action="can_register_payment">
          <SectionCard
            title="Registro de Pagos"
            icon={<CreditCard className="w-4 h-4" />}
          >
            <div className="space-y-3">
              {paymentsDraft.map((payment, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select
                    value={payment.type}
                    onValueChange={(val: PaymentType) =>
                      setPaymentsDraft((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, type: val } : x,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Yape/Plin</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-mono">
                      S/.
                    </span>
                    <Input
                      type="number"
                      className="pl-9 font-mono font-bold"
                      placeholder="0.00"
                      value={payment.amount || ""}
                      onChange={(e) =>
                        setPaymentsDraft((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, amount: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                  {paymentsDraft.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePaymentMethod(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addPaymentMethod}
                className="w-full border-dashed text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-4 h-4 mr-2" /> Agregar método de pago
              </Button>
            </div>
          </SectionCard>
          </RoleGate>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 bg-background border-t shadow-lg z-20 sticky bottom-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={handlePrintKitchenOrder}
              disabled={isOrderBusy}
            >
              <Printer className="w-4 h-4 mr-2" /> Cocina
            </Button>
            <Button
              variant="outline"
              onClick={handlePrintPrebill}
              disabled={isOrderBusy}
            >
              <Printer className="w-4 h-4 mr-2" /> Pre-cuenta
            </Button>
            <Button
              variant="secondary"
              onClick={handleHoldOrder}
              disabled={isOrderBusy}
              className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200"
            >
              <PauseCircle className="w-4 h-4 mr-2" /> En Espera
            </Button>
            <RoleGate action="can_submit_order">
            <Button
              onClick={handlePayOrder}
              disabled={isOrderBusy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-200"
            >
              <Banknote className="w-4 h-4 mr-2" /> Pagar (S/.{" "}
              {total.toFixed(2)})
            </Button>
            </RoleGate>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionCard({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`shadow-sm border-muted ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
