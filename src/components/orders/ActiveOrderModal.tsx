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
import {
  Loader2,
  Plus,
  Search,
  CreditCard,
  Receipt,
  ReceiptText,
  Banknote,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag as ShoppingBagIcon,
  X,
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
import { cn } from "@/lib/utils";

// Local interface matching master.tsx
export interface Meal {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  categoryId?: string;
  code?: string;
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
    observationsDraft,
    setObservationsDraft,
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
    // Stamping and Billing Synchronous Flow States & Actions
    paymentStep,
    stampingError,
    stampedOrder,
    handleRetryStamping,
    handlePrintWithoutStamping,
  } = manager;

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [clientSearchStatus, setClientSearchStatus] = useState<
    "idle" | "searching" | "found" | "not_found"
  >("idle");
  const [clientSearchResults, setClientSearchResults] = useState<
    ClientSearchResult[]
  >([]);
  const [showClientResults, setShowClientResults] = useState(false);
  const [isClientLocked, setIsClientLocked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const isCustomerValid = useMemo(() => {
    if (invoiceTypeDraft === "factura") {
      if (customerDraft.documentType !== "ruc") return false;
      if (customerDraft.documentNumber?.length !== 11) return false;
      if (!customerDraft.address?.trim()) return false;
    }
    if (invoiceTypeDraft === "boleta" && customerDraft.documentType === "dni") {
      if (customerDraft.documentNumber?.length !== 8) return false;
    }
    if (customerDraft.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerDraft.email.trim())) return false;
    }
    return true;
  }, [customerDraft, invoiceTypeDraft]);

  const customerValidationMessage = useMemo(() => {
    if (invoiceTypeDraft === "factura") {
      if (customerDraft.documentType !== "ruc") return "FACTURA REQUIERE RUC";
      if (customerDraft.documentNumber?.length !== 11)
        return "RUC = 11 DÍGITOS";
      if (!customerDraft.address?.trim()) return "DIRECCIÓN REQUERIDA";
    }
    if (invoiceTypeDraft === "boleta" && customerDraft.documentType === "dni") {
      if (customerDraft.documentNumber?.length !== 8) return "DNI = 8 DÍGITOS";
    }
    if (customerDraft.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerDraft.email.trim())) return "EMAIL INVÁLIDO";
    }
    return "FALTAN DATOS";
  }, [customerDraft, invoiceTypeDraft]);

  const isCustomerDirty = useMemo(() => {
    if (!activeOrder) return false;
    // Check if dirty (same logic as hook)
    return (
      (activeOrder.invoiceType || "boleta") !==
        (invoiceTypeDraft || "boleta") ||
      (activeOrder.tableNumber || "") !== (tableNumberDraft || "") ||
      (activeOrder.observations || "") !== (observationsDraft || "") ||
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
  }, [activeOrder, invoiceTypeDraft, tableNumberDraft, observationsDraft, customerDraft]);

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
            businessName:
              customerDraft.documentType === "ruc"
                ? customerDraft.name
                : undefined,
            phone: customerDraft.phone,
            address: customerDraft.address,
            email: customerDraft.email,
          });
          toast.success("Cliente nuevo registrado en BD");
        } catch (e: unknown) {
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
          meal.description?.toLowerCase().includes(query) ||
          meal.code?.toLowerCase().includes(query),
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

  // Cleanup pointer events and modal state when closed
  useEffect(() => {
    if (!isOrderModalOpen) {
      setSearchQuery("");
      setShowSearchResults(false);
      setShowClientResults(false);
      setIsClientLocked(false);
      setIsConfirming(false);

      // Fix Radix UI body pointer events lock bug (fire and forget)
      setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 500);
    } else {
      // Bulletproof: Force unlock immediately upon opening in case of rapid toggling
      document.body.style.pointerEvents = "";
    }
  }, [isOrderModalOpen]);

  if (!activeOrder) return null;

  return (
    <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
      <DialogContent
        className="w-full max-w-[95vw] sm:max-w-[1400px]! h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border border-border text-foreground"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const hasToast = document.querySelector(
            "[data-radix-toast-announce-exclude]",
          );
          if (hasToast) e.preventDefault();
        }}
        style={{ pointerEvents: "auto" }}
      >
        {/* Header - Control Operativo */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card z-30 shrink-0">
          <div>
            <h1 className="text-xl md:text-3xl text-foreground font-black tracking-[0.2em] md:tracking-[0.3em] font-mono uppercase">
              P R O C E S A R <span className="opacity-0">_</span> O R D E N
            </h1>
            <p className="text-[10px] text-muted-foreground/50 font-mono tracking-widest mt-2 uppercase">
              Sistema de Control Operativo V2.4
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="px-3 py-1 bg-secondary border border-border rounded font-mono text-xs text-primary tracking-widest font-bold">
                #{activeOrder.orderNumber}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono uppercase mt-2 tracking-widest">
                {activeOrder.status === "on_hold" ? "EN ESPERA" : "EN CURSO"}
              </span>
            </div>
            {isOrderBusy && (
              <Loader2 className="w-5 h-5 animate-spin text-primary mt-1" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full cursor-pointer"
              onClick={() => setIsOrderModalOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-background flex flex-col">
          {/* Datos Generales del Pedido: Mesa y Observaciones */}
          <div className="flex flex-col p-6 xl:px-12 border-b border-border bg-card shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Mesa */}
              <div className="col-span-1 md:col-span-3">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
                  Número de Mesa
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-mono font-bold">
                    #
                  </div>
                  <Input
                    value={tableNumberDraft}
                    onChange={(e) => setTableNumberDraft(e.target.value)}
                    placeholder="Mesa"
                    className="pl-8 h-12 font-mono text-lg font-bold bg-background border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground rounded-xl transition-all placeholder:text-muted-foreground/20"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="col-span-1 md:col-span-9">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
                  Observaciones y Detalles del Pedido
                </label>
                <Input
                  value={observationsDraft}
                  onChange={(e) => setObservationsDraft(e.target.value)}
                  placeholder="Ej. Alérgicos, sin cebolla, platos juntos..."
                  className="h-12 bg-background border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground rounded-xl transition-all placeholder:text-muted-foreground/35"
                />
              </div>
            </div>
          </div>

          {/* 1. Products Container */}
          <div className="flex flex-col p-6 xl:px-12 border-b border-border shrink-0">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
              <Input
                placeholder="ESCANEAR O BUSCAR PRODUCTOS..."
                className="pl-12 h-14 bg-card border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm tracking-wide text-foreground placeholder:text-muted-foreground/40 rounded-xl"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
              />

              {/* Search Suggestions Dropdown */}
              {showSearchResults && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[300px] overflow-y-auto overflow-hidden">
                  {filteredMeals.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground/50 text-center font-mono uppercase tracking-widest">
                      Sin resultados
                    </div>
                  ) : (
                    filteredMeals.map((meal) => (
                      <button
                        key={meal._id}
                        className="w-full text-left p-4 hover:bg-muted flex items-center justify-between border-b border-border last:border-0 transition-colors group cursor-pointer"
                        onClick={() => handleSelectMeal(meal._id)}
                      >
                        <div>
                          <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors uppercase tracking-wide">
                            {meal.name}
                          </div>
                          {meal.description && (
                            <div className="text-[10px] text-muted-foreground/50 font-mono mt-1 uppercase tracking-wider line-clamp-1">
                              {meal.description}
                            </div>
                          )}
                        </div>
                        <div className="font-mono font-bold text-sm text-primary">
                          S/. {meal.basePrice.toFixed(2)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Overlay to close search */}
            {showSearchResults && (
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowSearchResults(false)}
                style={{ pointerEvents: "auto" }}
              />
            )}

            {/* Product List Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.3em] font-bold">
                Productos Seleccionados
              </h2>
              <div className="px-2 py-1 bg-secondary border border-border text-primary font-mono text-[10px] tracking-widest rounded font-bold">
                {activeOrder.items.length} ITEMS
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 space-y-0">
              {activeOrder.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30 border border-dashed border-border rounded-2xl bg-muted/45">
                  <ShoppingBagIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-xs font-mono uppercase tracking-widest font-bold">
                    La orden está vacía
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
          </div>

          {/* 2. Customer Container */}
          <RoleGate action="can_register_client">
            <div className="flex flex-col p-6 xl:px-12 border-b border-border shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.3em] font-bold">
                  Registro de Cliente
                </h2>
                <div
                  className="text-[10px] text-primary/70 font-mono tracking-widest font-bold uppercase hover:text-primary cursor-pointer transition-colors"
                  onClick={() => {
                    document.getElementById("search-client-input")?.focus();
                  }}
                >
                  Buscar Existente
                </div>
              </div>

              <div className="space-y-6">
                {/* Top Row: Primary Identification */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Tipo Comprobante */}
                  <div className="col-span-1 md:col-span-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
                      Comprobante
                    </label>
                    <Select
                      value={invoiceTypeDraft}
                      onValueChange={(v: InvoiceType) => setInvoiceTypeDraft(v)}
                    >
                      <SelectTrigger className="h-12 bg-card border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl text-foreground">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="boleta">
                          Boleta de Venta (B-001)
                        </SelectItem>
                        <SelectItem value="factura">
                          Factura Electrónica (F-001)
                        </SelectItem>
                        <SelectItem value="nota_venta">
                          Nota de Venta (Ticket Interno)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo Doc. */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
                      Doc.
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
                      <SelectTrigger className="h-12 bg-card border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl text-foreground">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">--</SelectItem>
                        <SelectItem value="dni">DNI</SelectItem>
                        <SelectItem value="ruc">RUC</SelectItem>
                        <SelectItem value="passport">PASAPORTE</SelectItem>
                        <SelectItem value="ci">CÉDULA</SelectItem>
                        <SelectItem value="ce">CE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Número / Buscar Cliente */}
                  <div className="col-span-1 md:col-span-6 relative group z-20">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
                      ID CLIENTE
                    </label>
                    <input
                      id="search-client-input"
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
                      placeholder="DNI, RUC..."
                      className="block w-full outline-none disabled:cursor-not-allowed disabled:opacity-50 h-12 font-mono text-base tracking-wide bg-card border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground rounded-xl pl-4 pr-10 placeholder:text-muted-foreground/30 transition-all uppercase"
                    />
                    <div className="absolute right-4 top-10 pointer-events-none transition-opacity bg-transparent">
                      {clientSearchStatus === "searching" ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : isClientLocked ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : clientSearchStatus === "not_found" &&
                        customerDraft.documentNumber.length > 2 ? (
                        <Search className="w-4 h-4 text-primary/50" />
                      ) : (
                        <Search className="w-4 h-4 text-primary/30 opacity-0 group-focus-within:opacity-100" />
                      )}
                    </div>

                    {showClientResults &&
                      clientSearchResults.length > 0 &&
                      !isClientLocked && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[250px] overflow-y-auto">
                          {clientSearchResults.map((client) => (
                            <button
                              key={client._id}
                              className="w-full text-left p-4 hover:bg-muted flex flex-col border-b border-border last:border-0 transition-colors uppercase tracking-widest cursor-pointer"
                              onClick={() => {
                                setCustomerDraft((p) => ({
                                  ...p,
                                  documentType:
                                    (client.documentType as DocumentType) ||
                                    "none",
                                  documentNumber: client.documentNumber,
                                  name:
                                    client.name || client.businessName || "",
                                  surname: client.lastName || "",
                                  email: client.email || "",
                                  phone: client.phone || "",
                                  address: client.address || "",
                                }));
                                const isExternal = client._id?.toString().startsWith("external-");
                                setIsClientLocked(!isExternal);
                                setShowClientResults(false);
                              }}
                            >
                              <div className="font-bold text-xs text-foreground flex items-center flex-wrap gap-2">
                                <span className="text-primary font-mono">
                                  {client.documentNumber}
                                </span>
                                <span>
                                  {client.name || client.businessName}{" "}
                                  {client.lastName || ""}
                                </span>
                                {client._id?.toString().startsWith("external-") && (
                                  <span className="inline-flex text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
                                    AUTO
                                  </span>
                                )}
                              </div>
                              {client.phone && (
                                <div className="text-[10px] text-muted-foreground/50 font-mono mt-1">
                                  TEL: {client.phone}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {showClientResults && (
                    <div
                      className="fixed inset-0 z-10 bg-transparent"
                      onClick={() => setShowClientResults(false)}
                    />
                  )}
                </div>

                {/* Personal Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
                      Nombre Completo
                    </label>
                    <Input
                      value={customerDraft.name}
                      onChange={(e) =>
                        setCustomerDraft((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="NOMBRES"
                      disabled={isClientLocked}
                      className="h-12 bg-card border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground rounded-xl placeholder:text-muted-foreground/20 disabled:opacity-50 uppercase tracking-widest text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block min-h-[15px]">
                      {/* Apellidos Label Spacer */}
                    </label>
                    <Input
                      value={customerDraft.surname || ""}
                      onChange={(e) =>
                        setCustomerDraft((prev) => ({
                          ...prev,
                          surname: e.target.value,
                        }))
                      }
                      placeholder="APELLIDOS (OPCIONAL)"
                      disabled={isClientLocked}
                      className="h-12 bg-card border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground rounded-xl placeholder:text-muted-foreground/20 disabled:opacity-50 uppercase tracking-widest text-sm"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative group">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
                      Email
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
                      placeholder="EMAIL"
                      disabled={isClientLocked}
                      className="h-12 bg-background border-b border-border border-t-0 border-x-0 rounded-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/20 disabled:opacity-50 uppercase tracking-widest text-xs font-mono"
                    />
                  </div>
                  <div className="relative group">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
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
                      placeholder="TEL"
                      disabled={isClientLocked}
                      className="h-12 bg-background border-b border-border border-t-0 border-x-0 rounded-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/20 disabled:opacity-50 uppercase tracking-widest text-xs font-mono"
                    />
                  </div>
                  <div className="relative group">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/60 mb-2 block">
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
                      placeholder="DIRECCIÓN"
                      disabled={isClientLocked}
                      className="h-12 bg-background border-b border-border border-t-0 border-x-0 rounded-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/20 disabled:opacity-50 uppercase tracking-widest text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Validation and Status */}
                <div className="flex justify-between items-center pt-4">
                  <div className="flex items-center">
                    {!isCustomerValid ? (
                      <span className="inline-flex items-center px-2 py-1 text-[10px] tracking-widest font-mono text-destructive border border-destructive/50 bg-destructive/10 rounded">
                        <AlertTriangle className="w-3 h-3 mr-2" />
                        {customerValidationMessage}
                      </span>
                    ) : clientSearchStatus === "not_found" &&
                      customerDraft.documentNumber.trim().length > 2 &&
                      !isClientLocked ? (
                      <span className="text-[10px] font-mono tracking-widest text-amber-600/70 uppercase">
                        NUEVO CLIENTE
                      </span>
                    ) : null}
                  </div>

                  <div className="h-8 flex items-center justify-end">
                    {isCustomerSaving ? (
                      <div className="flex items-center text-primary animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-[10px] font-mono tracking-widest uppercase font-bold">
                          Guardando...
                        </span>
                      </div>
                    ) : !isCustomerDirty ? (
                      <div className="flex items-center text-foreground/50 transition-all">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        <span className="text-[10px] font-mono tracking-widest uppercase font-bold">
                          Datos enlazados
                        </span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 text-[10px] tracking-widest font-mono bg-secondary hover:bg-primary text-foreground hover:text-primary-foreground border border-border transition-colors cursor-pointer"
                        onClick={handleConfirmCustomerBtn}
                        disabled={isConfirming}
                      >
                        {isConfirming && (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        )}
                        FIJAR CLIENTE
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </RoleGate>

          {/* 3. Pricing Container */}
          <RoleGate action="can_set_adjustment">
            <div className="flex flex-col p-6 xl:px-12 border-b border-border shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h2 className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.3em] font-bold mb-4">
                    Resumen de Precios
                  </h2>
                  <div className="flex items-center gap-2 p-1 bg-background rounded-xl border border-border">
                    <Select
                      value={adjustmentDraft.kind}
                      onValueChange={(val: AdjustmentKind) =>
                        setAdjustmentDraft((prev) => ({ ...prev, kind: val }))
                      }
                    >
                      <SelectTrigger className="w-[120px] h-10 border-0 bg-transparent text-xs text-foreground uppercase tracking-widest focus:ring-0">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="discount">DESC</SelectItem>
                        <SelectItem value="surcharge">REC</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="w-px h-6 bg-border"></div>
                    <Input
                      type="number"
                      placeholder="%"
                      className="w-16 h-10 border-0 bg-transparent text-xs text-center text-primary font-bold focus-visible:ring-0"
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
                    <div className="w-px h-6 bg-border"></div>
                    <Input
                      placeholder="MOTIVO"
                      className="h-10 border-0 bg-transparent text-xs flex-1 uppercase tracking-widest text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0"
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
                      className="h-10 w-10 p-0 hover:bg-muted text-primary rounded-lg cursor-pointer"
                      onClick={handleSaveAdjustment}
                      disabled={isOrderBusy}
                      title="Aplicar ajuste"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>

                  {activeOrder.adjustment && (
                    <div className="flex items-center justify-between text-xs p-3 bg-primary/10 border border-primary/20 text-primary rounded-lg font-mono">
                      <span className="uppercase tracking-widest">
                        {activeOrder.adjustment.kind === "discount"
                          ? "DESC: "
                          : "REC: "}
                        {activeOrder.adjustment.percent}%
                      </span>
                      <button
                        onClick={handleRemoveAdjustment}
                        className="underline hover:text-foreground uppercase tracking-widest cursor-pointer"
                      >
                        QUITAR
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 font-mono text-sm self-end">
                  <div className="flex justify-between text-muted-foreground/50 tracking-widest uppercase mb-2">
                    <span>Subtotal</span>
                    <span className="text-foreground">
                      S/. {subtotal.toFixed(2)}
                    </span>
                  </div>
                  {activeOrder.adjustment && (
                    <div className="flex justify-between text-primary tracking-widest uppercase">
                      <span>
                        {activeOrder.adjustment.kind === "discount"
                          ? "Descuento"
                          : "Recargo"}{" "}
                        ({activeOrder.adjustment.percent}%)
                      </span>
                      <span>
                        {activeOrder.adjustment.kind === "discount" ? "-" : "+"}
                        S/. {adjustmentAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border my-3"></div>
                  <div className="flex justify-between text-xl font-bold tracking-widest uppercase">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">
                      S/. {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </RoleGate>

          {/* 4. Payment Container */}
          <RoleGate action="can_register_payment">
            <div className="flex flex-col p-6 xl:px-12 border-b border-border shrink-0 pb-32">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.3em] font-bold">
                  Control Operativo
                </h2>
              </div>

              <div className="space-y-6">
                {paymentsDraft.map((payment, idx) => (
                  <div
                    key={idx}
                    className="bg-background border border-border p-4 rounded-xl relative group"
                  >
                    {/* Big Selector Buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { id: "card", label: "TARJETA", icon: CreditCard },
                        { id: "cash", label: "EFECTIVO", icon: Banknote },
                        {
                          id: "transfer",
                          label: "TRANSFERENCIA / BILLETERA DIGITAL",
                          icon: CreditCard,
                        },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = payment.type === opt.id;
                        return (
                          <button
                            key={opt.id}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 border rounded-lg transition-all duration-200 cursor-pointer",
                              isSelected
                                ? "bg-secondary border-primary/50 text-primary"
                                : "bg-card border-border text-muted-foreground/40 hover:bg-muted/40 hover:text-foreground",
                            )}
                            onClick={() => {
                              setPaymentsDraft((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, type: opt.id as PaymentType }
                                    : x,
                                ),
                              );
                            }}
                          >
                            <Icon className="w-6 h-6 mb-2 opacity-80" />
                            <span className="text-[10px] font-mono tracking-widest uppercase font-bold">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Amount Input */}
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono font-bold">
                          S/.
                        </span>
                        <Input
                          type="number"
                          className="pl-12 h-14 bg-card border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-foreground font-mono font-bold text-xl rounded-lg"
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
                          className="h-14 w-14 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addPaymentMethod}
                  className="w-full h-14 border border-dashed border-border bg-transparent text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 uppercase tracking-widest font-mono text-xs rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" /> DIVIDIR PAGO (OTRO MÉTODO)
                </Button>
              </div>
            </div>
          </RoleGate>
        </div>

        {/* Floating Technical Footer */}
        <div className="p-4 bg-card/90 backdrop-blur-md border-t border-border z-40 shrink-0">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:justify-between sm:items-center gap-4 max-w-[1400px] mx-auto xl:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleHoldOrder}
                disabled={isOrderBusy}
                className="flex-1 sm:flex-none h-14 bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground uppercase font-mono tracking-widest text-[10px] sm:text-xs rounded-xl cursor-pointer"
              >
                MANTENER ORDEN
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintKitchenOrder}
                disabled={isOrderBusy}
                className="flex-1 sm:flex-none h-14 bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground uppercase font-mono tracking-widest text-[10px] sm:text-xs rounded-xl cursor-pointer"
              >
                <ReceiptText className="w-4 h-4 sm:mr-2" />{" "}
                <span className="hidden sm:inline">COCINA</span>
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintPrebill}
                disabled={isOrderBusy}
                className="flex-1 sm:flex-none h-14 bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground uppercase font-mono tracking-widest text-[10px] sm:text-xs rounded-xl cursor-pointer"
              >
                <Receipt className="w-4 h-4 sm:mr-2" />{" "}
                <span className="hidden sm:inline">PRE-CUENTA</span>
              </Button>
            </div>

            <RoleGate action="can_submit_order">
              <Button
                onClick={handlePayOrder}
                disabled={isOrderBusy}
                className="h-16 w-full sm:w-[350px] bg-primary hover:opacity-90 text-primary-foreground font-bold shadow-xs uppercase tracking-[0.2em] font-mono text-sm rounded-xl transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 mr-3" /> PROCESAR PAGO
              </Button>
            </RoleGate>
          </div>
        </div>

        {/* Synchronized Payment Stamping Overlay */}
        {paymentStep !== "idle" && (
          <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in" style={{ pointerEvents: "auto" }}>
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl flex flex-col items-center">
              
              {/* Step: Paying */}
              {paymentStep === "paying" && (
                <div className="space-y-6 py-8">
                  <div className="relative flex justify-center items-center">
                    <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
                    <CreditCard className="w-6 h-6 text-primary absolute" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold uppercase tracking-[0.2em] text-foreground font-mono">
                      REGISTRANDO PAGO
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono tracking-widest">
                      Guardando detalles de transacción en la base de datos...
                    </p>
                  </div>
                </div>
              )}

              {/* Step: Stamping */}
              {paymentStep === "stamping" && (
                <div className="space-y-6 py-8 w-full">
                  <div className="relative flex justify-center items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-2 border-t-primary animate-spin"></div>
                    <Loader2 className="w-6 h-6 text-primary absolute animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold uppercase tracking-[0.2em] text-primary font-mono animate-pulse">
                      TIMBRANDO CPE
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono tracking-widest">
                      Conectando con SUNAT y Nubefact...
                    </p>
                    <div className="text-[10px] text-primary/70 font-mono tracking-widest border border-primary/20 rounded bg-primary/5 px-3 py-2.5 mt-4 max-w-sm mx-auto text-left leading-relaxed">
                      &gt; FIRMANDO XML DOCUMENTO... <br />
                      &gt; DESPACHANDO ADAPTADOR OSE...
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Success */}
              {paymentStep === "success" && (
                <div className="space-y-6 py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary animate-bounce mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold uppercase tracking-[0.2em] text-foreground font-mono">
                      ¡OPERACIÓN EXITOSA!
                    </h3>
                    <p className="text-xs text-primary font-mono tracking-widest">
                      Imprimiendo comprobante de pago electrónico...
                    </p>
                    {stampedOrder && (
                      <div className="text-[11px] font-mono bg-muted text-muted-foreground rounded px-3 py-2 mt-4 inline-block border border-border uppercase">
                        COMPROBANTE: {stampedOrder.fiscalDocumentPrefix}-{String(stampedOrder.fiscalDocumentNumber || "").padStart(8, "0")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step: Failed */}
              {paymentStep === "failed" && (
                <div className="space-y-6 w-full">
                  <div className="w-16 h-16 rounded-full bg-destructive/15 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-md font-bold uppercase tracking-[0.2em] text-destructive font-mono">
                      ERROR DE EMISIÓN FISCAL
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono tracking-wide leading-relaxed">
                      El pago se registró correctamente, pero el OSE o SUNAT rechazó el timbrado automático.
                    </p>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/25 rounded-xl p-4 text-left font-mono text-xs text-destructive max-h-[120px] overflow-y-auto w-full select-all">
                    <div className="font-bold text-[10px] text-muted-foreground mb-1 uppercase tracking-widest border-b border-destructive/20 pb-1">
                      Mensaje de Error SUNAT:
                    </div>
                    {stampingError || "Error desconocido al procesar facturación electrónica."}
                  </div>

                  <div className="flex flex-col gap-2 pt-2 w-full">
                    <Button
                      onClick={() => stampedOrder && handleRetryStamping(stampedOrder)}
                      disabled={isOrderBusy}
                      className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground font-bold font-mono text-xs tracking-widest uppercase rounded-xl transition-all cursor-pointer"
                    >
                      {isOrderBusy ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Loader2 className="w-4 h-4 mr-2" />
                      )}
                      REINTENTAR TIMBRADO
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => stampedOrder && handlePrintWithoutStamping(stampedOrder)}
                      disabled={isOrderBusy}
                      className="w-full h-12 bg-secondary hover:bg-muted border-border text-foreground font-bold font-mono text-xs tracking-widest uppercase rounded-xl transition-all cursor-pointer"
                    >
                      <Receipt className="w-4 h-4 mr-2" /> IMPRIMIR RESPALDO LOCAL
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsOrderModalOpen(false);
                        manager.setActiveOrder(null);
                      }}
                      disabled={isOrderBusy}
                      className="w-full h-10 text-muted-foreground hover:text-foreground hover:bg-transparent font-mono text-[10px] tracking-widest uppercase cursor-pointer"
                    >
                      OMITIR E IR A INICIO
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
