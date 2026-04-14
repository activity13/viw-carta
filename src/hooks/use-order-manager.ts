"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Axios from "axios";
import { toast } from "sonner";
import {
  Order,
  OrderCustomer,
  OrderAdjustment,
  OrderPayment,
  TicketBrand,
  DocumentType,
  InvoiceType,
} from "@/types/order";
import {
  buildKitchenOrderHtml,
  buildTicketHtml,
  calculateOrderTotal,
  calculateSubtotal,
  isMobileUserAgent,
  printHtmlTicket,
  round2,
} from "@/lib/order-utils";

function getAxiosStatus(error: unknown): number | undefined {
  return Axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function useOrderManager(restaurantId?: string, userId?: string) {
  // Orders State
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [holdOrders, setHoldOrders] = useState<Order[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrdersListModalOpen, setIsOrdersListModalOpen] = useState(false);
  const [isOrderBusy, setIsOrderBusy] = useState(false);
  const [isOrdersBusy, setIsOrdersBusy] = useState(false);
  const [ticketBrand, setTicketBrand] = useState<TicketBrand | null>(null);

  // Draft State (for editing inside modal)
  const [customerDraft, setCustomerDraft] = useState<OrderCustomer>({
    name: "",
    documentType: "none",
    documentNumber: "",
  });
  const [tableNumberDraft, setTableNumberDraft] = useState<string>("");
  const [invoiceTypeDraft, setInvoiceTypeDraft] =
    useState<InvoiceType>("boleta");
  const [adjustmentDraft, setAdjustmentDraft] = useState<OrderAdjustment>({
    kind: "surcharge",
    percent: 0,
    note: "",
  });
  const [isCustomerSaving, setIsCustomerSaving] = useState(false);
  const [paymentsDraft, setPaymentsDraft] = useState<OrderPayment[]>([
    { type: "cash", amount: 0 },
  ]);

  const lastOrdersRefetchAtRef = useRef(0);
  const saveCustomerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isFirstRender = useRef(true);

  // Reset isFirstRender when modal closes to ensure next open is handled as first render
  useEffect(() => {
    if (!isOrderModalOpen) {
      isFirstRender.current = true;
    }
  }, [isOrderModalOpen]);

  // --- AUTOMATIC SAVE CUSTOMER ---
  useEffect(() => {
    // Skip if no active order or not open
    if (!activeOrder || !isOrderModalOpen) return;

    // Skip if first render (avoids saving immediately on open due to sync)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Comprobamos cambios SÓLO para mesa y comprobante.
    // El cliente ahora se guarda de manera manual (Registro/Búsqueda Rápida)
    const hasChanges =
      (activeOrder.invoiceType || "boleta") !==
        (invoiceTypeDraft || "boleta") ||
      (activeOrder.tableNumber || "") !== (tableNumberDraft || "");

    if (!hasChanges) {
      if (isCustomerSaving) setIsCustomerSaving(false);
      return;
    }

    // Define validation first
    const isValid = () => {
      if (invoiceTypeDraft === "factura") {
        if (customerDraft.documentType !== "ruc") return false;
        if (customerDraft.documentNumber.length !== 11) return false;
      }
      if (
        invoiceTypeDraft === "boleta" &&
        customerDraft.documentType === "dni"
      ) {
        if (customerDraft.documentNumber.length !== 8) return false;
      }
      return true;
    };

    if (saveCustomerTimeoutRef.current) {
      clearTimeout(saveCustomerTimeoutRef.current);
    }

    // Only auto-save if valid
    if (isValid()) {
      setIsCustomerSaving(true); // Show spinner while waiting to debounce
      saveCustomerTimeoutRef.current = setTimeout(() => {
        const saveData = async () => {
          try {
            // We use functional update to get the LATEST activeOrder to avoid closure staleness issues?
            // Actually activeOrder is in dependency array, so we have fresh one.
            // But we need to make sure we don't overwrite if order changed in server meanwhile?
            // Simplest is just patch.
            const res = await Axios.patch<Order>(
              `/api/orders/${activeOrder._id}`,
              {
                action: "setCustomer",
                customer: customerDraft,
                tableNumber: tableNumberDraft,
                invoiceType: invoiceTypeDraft,
              },
            );
            // We update activeOrder with response.
            // IMPORTANT: This will re-trigger useEffect?
            // Yes, because activeOrder changes.
            // BUT, the new activeOrder should match the drafts, so hasChanges will be false.
            setActiveOrder(res.data);
            // toast.success("Datos guardados"); // Removing toast spam for autosave
          } catch (error) {
            console.error(error);
          } finally {
            setIsCustomerSaving(false);
          }
        };
        saveData();
      }, 2000); // 2 seconds delay
    } else {
      setIsCustomerSaving(false);
    }

    return () => {
      if (saveCustomerTimeoutRef.current)
        clearTimeout(saveCustomerTimeoutRef.current);
    };
  }, [
    customerDraft,
    tableNumberDraft,
    invoiceTypeDraft,
    activeOrder,
    isOrderModalOpen,
  ]);

  // --- BRAND FETCHING ---
  useEffect(() => {
    let cancelled = false;
    const fetchBrand = async () => {
      if (!restaurantId) return;
      try {
        const res = await Axios.get<{ name?: string; image?: string }>(
          `/api/settings/${restaurantId}`,
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

  // --- SYNC DRAFTS ---
  const syncDraftsFromOrder = useCallback((order: Order) => {
    setCustomerDraft({
      name: order.customer?.name ?? "",
      surname: order.customer?.surname ?? "",
      documentType: (order.customer?.documentType as DocumentType) ?? "none",
      documentNumber: order.customer?.documentNumber ?? "",
      email: order.customer?.email ?? "",
      phone: order.customer?.phone ?? "",
      address: order.customer?.address ?? "",
    });

    setTableNumberDraft(order.tableNumber ?? "");
    setInvoiceTypeDraft(order.invoiceType ?? "boleta");
    setAdjustmentDraft(
      order.adjustment ?? { kind: "discount", percent: 0, note: "" },
    );

    const existingPayments = order.payments ?? [];
    setPaymentsDraft(
      existingPayments.length > 0
        ? existingPayments
        : [{ type: "cash", amount: 0 }],
    );
  }, []);

  // --- FETCHING ORDERS ---
  const fetchActiveOrder = useCallback(async () => {
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
  }, [restaurantId, syncDraftsFromOrder]);

  const fetchHoldOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await Axios.get<Order[]>("/api/orders", {
        params: { status: "on_hold" },
      });
      setHoldOrders(res.data ?? []);
    } catch (error) {
      console.error("Error fetching hold orders:", error);
    }
  }, [restaurantId]);

  // --- ACTIONS ---

  const handleNewOrder = useCallback(async () => {
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
      if (
        status === 403 &&
        Axios.isAxiosError(error) &&
        error.response?.data?.code === "NO_OPEN_SESSION"
      ) {
        toast.error("Caja Cerrada", {
          description: "No hay una caja abierta para registrar ventas.",
          action: {
            label: "Ir a Finanzas",
            onClick: () => {
              window.location.href = "/backoffice/finances";
            },
          },
          duration: 10000,
        });
        return;
      }
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
  }, [fetchActiveOrder, fetchHoldOrders, syncDraftsFromOrder]);

  const handleAddToOrder = useCallback(
    async (mealId: string) => {
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
    },
    [activeOrder],
  );

  const handleSetItemQty = useCallback(
    async (mealId: string, qty: number) => {
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
    },
    [activeOrder],
  );

  const handleUpdateItemNotes = useCallback(
    async (mealId: string, notes: string) => {
      if (!activeOrder) return;
      // Optimistic update
      setActiveOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.mealId === mealId ? { ...item, notes } : item,
          ),
        };
      });

      try {
        const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
          action: "setItemNotes",
          mealId,
          notes,
        });
        setActiveOrder(res.data);
      } catch (error) {
        console.error("Error updating notes:", error);
        toast.error("No se pudo guardar la observación");
        await fetchActiveOrder();
      }
    },
    [activeOrder, fetchActiveOrder],
  );

  // ...

  const handleSaveCustomer = useCallback(async () => {
    if (!activeOrder) return;

    // Validation Logic
    if (invoiceTypeDraft === "factura") {
      if (customerDraft.documentType !== "ruc") {
        toast.error("Factura requiere RUC");
        return;
      }
      if (customerDraft.documentNumber.length !== 11) {
        toast.error("RUC debe tener 11 dígitos");
        return;
      }
    } else if (invoiceTypeDraft === "boleta") {
      if (
        customerDraft.documentType === "dni" &&
        customerDraft.documentNumber.length !== 8
      ) {
        toast.error("DNI debe tener 8 dígitos");
        return;
      }
    }

    setIsCustomerSaving(true);
    try {
      const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "setCustomer",
        customer: customerDraft,
        tableNumber: tableNumberDraft,
        invoiceType: invoiceTypeDraft,
      });
      setActiveOrder(res.data);
      // We don't need to sync drafts again here because we are the source of truth while typing
      // syncDraftsFromOrder(res.data);
      toast.success("Datos del cliente guardados");
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("No se pudo guardar el cliente");
    } finally {
      setIsCustomerSaving(false);
    }
  }, [activeOrder, customerDraft, tableNumberDraft, invoiceTypeDraft]);

  const handleSaveAdjustment = useCallback(async () => {
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
  }, [activeOrder, adjustmentDraft, syncDraftsFromOrder]);

  const handleRemoveAdjustment = useCallback(async () => {
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
  }, [activeOrder, syncDraftsFromOrder]);

  const handleHoldOrder = useCallback(async () => {
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
  }, [activeOrder, fetchHoldOrders]);

  const handlePayOrder = useCallback(async () => {
    if (!activeOrder) return;

    const subtotal = calculateSubtotal(activeOrder);
    const total = calculateOrderTotal(activeOrder);
    const paymentSum = paymentsDraft.reduce(
      (acc, p) => acc + (Number.isFinite(p.amount) ? p.amount : 0),
      0,
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

    // Pre-abrir ventana SOLO en móviles (para evitar bloqueo de popup)
    const mobilePrintWindow = isMobileUserAgent()
      ? window.open("", "_blank")
      : null;
      
    setIsOrderBusy(true);
    try {
      const res = await Axios.patch<Order>(`/api/orders/${activeOrder._id}`, {
        action: "pay",
        payments: paymentsDraft,
      });

      const paidOrder = {
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
  }, [activeOrder, paymentsDraft, ticketBrand, fetchHoldOrders]);

  const handleActivateOrder = useCallback(
    async (orderId: string) => {
      setIsOrdersBusy(true);
      try {
        const res = await Axios.patch<Order>(`/api/orders/${orderId}`, {
          action: "activate",
        });
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
    },
    [syncDraftsFromOrder, fetchHoldOrders, fetchActiveOrder],
  );

  const handlePrintPrebill = useCallback(() => {
    if (!activeOrder) {
      toast.error("No hay orden activa");
      return;
    }
    const html = buildTicketHtml(
      activeOrder,
      "prebill",
      ticketBrand ?? undefined,
    );
    printHtmlTicket(html);
  }, [activeOrder, ticketBrand]);

  const handlePrintKitchenOrder = useCallback(() => {
    if (!activeOrder) {
      toast.error("No hay orden activa");
      return;
    }
    const html = buildKitchenOrderHtml(activeOrder, ticketBrand ?? undefined);
    printHtmlTicket(html);
  }, [activeOrder, ticketBrand]);

  const handleOpenOrdersList = useCallback(async () => {
    setIsOrdersListModalOpen(true);
    setIsOrdersBusy(true);
    try {
      await fetchHoldOrders();
    } finally {
      setIsOrdersBusy(false);
    }
  }, [fetchHoldOrders]);

  // --- AUTOMATIC REFETCH ---
  useEffect(() => {
    if (!restaurantId || !userId) return;
    fetchActiveOrder();
    fetchHoldOrders();
  }, [restaurantId, userId, fetchActiveOrder, fetchHoldOrders]);

  useEffect(() => {
    if (!restaurantId || !userId) return;

    const maybeRefetchOrders = () => {
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
  }, [restaurantId, userId, fetchActiveOrder, fetchHoldOrders]);

  useEffect(() => {
    if (!restaurantId || !userId) return;
    if (!isOrderModalOpen) return;
    fetchActiveOrder();
  }, [isOrderModalOpen, restaurantId, userId, fetchActiveOrder]);

  useEffect(() => {
    if (!restaurantId || !userId) return;
    if (!isOrdersListModalOpen) return;
    fetchHoldOrders();
  }, [isOrdersListModalOpen, restaurantId, userId, fetchHoldOrders]);

  return {
    activeOrder,
    holdOrders,
    isOrderModalOpen,
    setIsOrderModalOpen,
    isOrdersListModalOpen,
    setIsOrdersListModalOpen,
    isOrderBusy,
    isOrdersBusy,
    customerDraft,
    setCustomerDraft,
    isCustomerSaving,
    tableNumberDraft,
    setTableNumberDraft,
    invoiceTypeDraft,
    setInvoiceTypeDraft,
    adjustmentDraft,
    setAdjustmentDraft,
    paymentsDraft,
    setPaymentsDraft,
    // Actions
    handleNewOrder,
    handleAddToOrder,
    handleSetItemQty,
    handleUpdateItemNotes,
    handleSaveCustomer,
    handleSaveAdjustment,
    handleRemoveAdjustment,
    handleHoldOrder,
    handlePayOrder,
    handleActivateOrder,
    handlePrintPrebill,
    handlePrintKitchenOrder,
    handleOpenOrdersList,
  };
}
