"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Banknote,
  ShieldAlert,
  Play,
  Clock,
  Lock,
  Tag,
  CircleOff,
  History,
  Ban,
  CalendarRange,
  Utensils,
  X,
  CheckCircle,
  Info,
} from "lucide-react";

interface OrderItem {
  qty: number;
  name: string;
  unitPrice: number;
}

interface OrderPayment {
  type: string;
  amount: number;
}

interface OrderType {
  _id: string;
  orderNumber: number;
  createdAt: string;
  status: string;
  tableNumber?: string;
  customer?: {
    name?: string;
    surname?: string;
    documentType: string;
    documentNumber?: string;
    address?: string;
  };
  items: OrderItem[];
  payments: OrderPayment[];
  adjustment?: {
    kind: "discount" | "surcharge";
    percent: number;
  };
}

interface StatsType {
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalTransfer: number;
  totalDiscounts: number;
  orderCount: number;
  cancelledOrderCount: number;
  totalItemsSold: number;
  ticketPromedio: number | string;
  topDishes: { name: string; qty: number }[];
  expectedCashInRegister?: number;
}

interface SessionType {
  _id: string;
  openedAt: string;
  startingCash?: number;
}

export default function FinancesClient() {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  // Current session states
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionType | null>(null);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [orders, setOrders] = useState<OrderType[]>([]);

  // History states
  const [hStart, setHStart] = useState("");
  const [hEnd, setHEnd] = useState("");
  const [historyStats, setHistoryStats] = useState<StatsType | null>(null);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const [opening, setOpening] = useState(false);
  const [startCashInput, setStartCashInput] = useState("");
  const [closing, setClosing] = useState(false);
  const [closeSessionConfirm, setCloseSessionConfirm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [cancelOrderConfirm, setCancelOrderConfirm] = useState<string | null>(
    null,
  );
  const [alertMessage, setAlertMessage] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Initialize dates
  useEffect(() => {
    // Generar formato YYYY-MM-DD en base a la zona horaria *local* (evitar saltos de día por UTC nocturno)
    const now = new Date();
    const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

    setHStart(localToday);
    setHEnd(localToday);
  }, []);

  const fetchLiveStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/finances/cash-session/current-stats");
      const data = await res.json();
      if (res.ok) {
        setSession(data.activeSession);
        setStats(data.stats);
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const fetchHistory = async () => {
    if (!hStart || !hEnd) {
      setAlertMessage({
        title: "Atención",
        message: "Selecciona Rango de Fechas",
        type: "info",
      });
      return;
    }
    try {
      setFetchingHistory(true);
      const res = await fetch(
        `/api/finances/history?start=${hStart}&end=${hEnd}`,
      );
      const data = await res.json();
      if (res.ok) {
        setHistoryStats(data.stats);
      } else {
        setAlertMessage({
          title: "Error",
          message: "Error al obtener histórico",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({
        title: "Error",
        message: "Error de conexión al obtener histórico",
        type: "error",
      });
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleOpenShift = async () => {
    try {
      setOpening(true);
      const res = await fetch("/api/finances/cash-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startingCash: Number(startCashInput) || 0 }),
      });
      if (res.ok) {
        await fetchLiveStats();
        setStartCashInput("");
      } else {
        setAlertMessage({
          title: "Error",
          message: "Error al abrir caja.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({
        title: "Error",
        message: "Error de conexión al abrir caja.",
        type: "error",
      });
    } finally {
      setOpening(false);
    }
  };

  const handleCloseShift = async () => {
    try {
      setClosing(true);
      const res = await fetch(
        `/api/finances/cash-session/${session?._id}/close`,
        { method: "POST" },
      );
      if (res.ok) {
        await fetchLiveStats();
        setAlertMessage({
          title: "Éxito",
          message: "Caja cerrada exitosamente.",
          type: "success",
        });
      } else {
        setAlertMessage({
          title: "Error",
          message: "Error al cerrar caja.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({
        title: "Error",
        message: "Error de conexión al cerrar caja.",
        type: "error",
      });
    } finally {
      setClosing(false);
      setCloseSessionConfirm(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        await fetchLiveStats(); // Refrescar los datos post-anulación
      } else {
        setAlertMessage({
          title: "Error",
          message: "Error al anular la orden.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setAlertMessage({
        title: "Error",
        message: "Error de conexión al intentar anular.",
        type: "error",
      });
    } finally {
      setCancelOrderConfirm(null);
    }
  };

  const alertModalUI = alertMessage && (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={() => setAlertMessage(null)}
    >
      <div
        className={`bg-[#1c1b1b] border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col ${
          alertMessage.type === "error"
            ? "border-[#ffb4ab]/30 shadow-[0_0_40px_rgba(147,0,10,0.3)]"
            : alertMessage.type === "success"
              ? "border-[#70d8c8]/30 shadow-[0_0_40px_rgba(0,80,72,0.3)]"
              : "border-[#bdc9c6]/30 shadow-[0_0_40px_rgba(189,201,198,0.1)]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center p-8 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${
              alertMessage.type === "error"
                ? "bg-[#93000a]/20 border-[#ffb4ab]/30"
                : alertMessage.type === "success"
                  ? "bg-[#005048]/20 border-[#70d8c8]/30"
                  : "bg-[#3d4947]/20 border-[#bdc9c6]/30"
            }`}
          >
            {alertMessage.type === "error" && (
              <ShieldAlert className="w-8 h-8 text-[#ffb4ab]" />
            )}
            {alertMessage.type === "success" && (
              <CheckCircle className="w-8 h-8 text-[#70d8c8]" />
            )}
            {alertMessage.type === "info" && (
              <Info className="w-8 h-8 text-[#bdc9c6]" />
            )}
          </div>
          <h3 className="text-xl font-black text-[#e5e2e1] mb-2">
            {alertMessage.title}
          </h3>
          <p className="text-sm text-[#bdc9c6] opacity-80 mb-6">
            {alertMessage.message}
          </p>
          <button
            onClick={() => setAlertMessage(null)}
            className="w-full py-3 rounded-lg font-bold text-sm bg-[#353534] text-[#e5e2e1] hover:bg-[#3d4947] transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#70d8c8]"></div>
      </div>
    );
  }

  // PANTALLA: CERRADA (Y USUARIO NO ESTA EN HISTORY)
  if (!session && activeTab === "current") {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-['Manrope'] text-[#e5e2e1]">
        <div className="flex bg-[#1c1b1b] border border-[#3d4947]/30 rounded-lg p-1 w-fit mb-8 shadow-md">
          <button
            onClick={() => setActiveTab("current")}
            className="px-6 py-2 rounded-md font-bold text-sm bg-[#70d8c8] text-[#003731] transition-all"
          >
            Turno Actual (Abierto)
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className="px-6 py-2 rounded-md font-bold text-sm text-[#bdc9c6] hover:text-[#e5e2e1] transition-all"
          >
            Histórico Avanzado
          </button>
        </div>

        <div className="bg-[#1c1b1b] border border-[#3d4947]/30 rounded-xl p-8 text-center max-w-xl mx-auto shadow-xl">
          <div className="mx-auto w-16 h-16 bg-[#201f1f] border border-[#3d4947]/30 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-[#bdc9c6]" />
          </div>
          <h2 className="text-xl font-bold text-[#e5e2e1] mb-2">
            La Caja está Cerrada
          </h2>
          <p className="text-[#bdc9c6] text-sm opacity-80 mb-6 font-['Plus_Jakarta_Sans']">
            Abre un nuevo turno registrando el dinero base (sencillo) con el que
            se empieza.
          </p>

          <div className="bg-[#131313] p-4 rounded-lg border border-[#3d4947]/30 mb-6 text-left shadow-inner">
            <label className="block text-sm font-semibold tracking-wider text-[#bdc9c6] mb-2 uppercase text-[10px]">
              Dinero Físico en Caja
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70d8c8] font-bold">
                S/
              </span>
              <input
                type="number"
                min="0"
                step="0.10"
                value={startCashInput}
                onChange={(e) => setStartCashInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1c1b1b] text-white pl-9 pr-4 py-3 border border-[#3d4947]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#70d8c8] font-bold"
              />
            </div>
          </div>

          <button
            onClick={handleOpenShift}
            disabled={opening}
            className="w-full sm:w-auto bg-[#70d8c8] hover:brightness-110 text-[#003731] font-bold py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 active:scale-95"
          >
            <Play className="w-5 h-5" fill="currentColor" />{" "}
            {opening ? "Abriendo..." : "Abrir Turno"}
          </button>

          {alertModalUI}
        </div>
      </div>
    );
  }

  // Set the correct pointer to display metrics based on TABS
  const displayStats = activeTab === "history" ? historyStats : stats;

  return (
    <div className="max-w-7xl mx-auto font-['Manrope'] pb-12 text-[#e5e2e1]">
      {/* TABS HEADER */}
      <div className="flex bg-[#1c1b1b] border border-[#3d4947]/30 rounded-lg p-1 w-fit mb-8 shadow-md">
        <button
          onClick={() => setActiveTab("current")}
          className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${activeTab === "current" ? "bg-[#70d8c8] text-[#003731]" : "text-[#bdc9c6] hover:text-[#e5e2e1]"}`}
        >
          {session ? "Turno Actual (Operando)" : "Turno Actual"}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${activeTab === "history" ? "bg-[#70d8c8] text-[#003731]" : "text-[#bdc9c6] hover:text-[#e5e2e1]"}`}
        >
          Filtrado e Histórico
        </button>
      </div>

      {/* TABS TITLES */}
      {activeTab === "history" ? (
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 bg-[#201f1f] p-6 rounded-xl border border-[#3d4947]/30 shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CalendarRange className="w-6 h-6 text-[#70d8c8]" />
              <h1 className="text-3xl font-black tracking-tight text-[#e5e2e1]">
                Reporte Histórico
              </h1>
            </div>
            <p className="text-[#bdc9c6] font-['Plus_Jakarta_Sans'] text-sm opacity-80 mt-2">
              Cruzamiento de datos, agrupa todas las cajas y ordenes pasadas.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-[#131313] border border-[#3d4947]/40 rounded-lg px-3 py-1.5 flex flex-col">
              <label className="text-[9px] font-bold text-[#70d8c8] uppercase">
                Desde
              </label>
              <input
                type="date"
                value={hStart}
                onChange={(e) => setHStart(e.target.value)}
                className="bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 p-0"
              />
            </div>
            <div className="bg-[#131313] border border-[#3d4947]/40 rounded-lg px-3 py-1.5 flex flex-col">
              <label className="text-[9px] font-bold text-[#ffb4ab] uppercase">
                Hasta
              </label>
              <input
                type="date"
                value={hEnd}
                onChange={(e) => setHEnd(e.target.value)}
                className="bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 p-0"
              />
            </div>
            <button
              onClick={fetchHistory}
              disabled={fetchingHistory}
              className="bg-[#70d8c8] hover:brightness-110 text-[#003731] font-bold py-3 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {fetchingHistory ? "Buscando..." : "Aplicar Filtros"}
            </button>
          </div>
        </header>
      ) : (
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#70d8c8] animate-pulse"></span>
              <h1 className="text-3xl font-black tracking-tight text-[#e5e2e1]">
                Panel Financiero
              </h1>
            </div>
            <p className="text-[#bdc9c6] font-['Plus_Jakarta_Sans'] text-sm flex items-center gap-2 opacity-80">
              <Clock className="w-4 h-4" /> Abierto el{" "}
              {session ? new Date(session.openedAt).toLocaleString() : ""}
            </p>
          </div>
          <button
            onClick={() => setCloseSessionConfirm(true)}
            disabled={closing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[#ffb4ab]/30 text-[#ffb4ab] font-bold hover:bg-[#93000a]/20 transition-colors active:scale-95"
          >
            {closing ? (
              <History className="w-5 h-5 animate-spin" />
            ) : (
              <Lock className="w-5 h-5" />
            )}{" "}
            Cerrar Turno
          </button>
        </header>
      )}

      {/* METRICS (DYNAMIC FOR BOTH VIEWS) */}
      {displayStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <div className="bg-[#1c1b1b] rounded-xl p-6 border-l-4 border-[#3d4947]/30 transition-all hover:bg-[#201f1f]">
            <p className="text-[#bdc9c6] text-[10px] font-['Plus_Jakarta_Sans'] font-bold uppercase tracking-widest mb-2 opacity-70">
              Venta Bruta Total
            </p>
            <p className="text-3xl font-black text-[#e5e2e1]">
              S/ {displayStats.totalSales.toFixed(2)}
            </p>
            <p className="text-[#bdc9c6] text-xs mt-2 italic opacity-60 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {displayStats.orderCount}{" "}
              órdenes pagadas
            </p>
          </div>

          <div className="bg-[#1c1b1b] rounded-xl p-6 border-l-4 border-[#70d8c8] transition-all hover:bg-[#201f1f] shadow-xl shadow-[#70d8c8]/5">
            <p className="text-[#70d8c8] text-[10px] font-['Plus_Jakarta_Sans'] font-bold uppercase tracking-widest mb-2">
              {activeTab === "current"
                ? "Efectivo Esperado (Caja)"
                : "Ingresos en Efectivo"}
            </p>
            <p className="text-3xl font-black text-[#70d8c8]">
              S/{" "}
              {activeTab === "current"
                ? (displayStats.expectedCashInRegister || 0).toFixed(2)
                : displayStats.totalCash.toFixed(2)}
            </p>
            {activeTab === "current" && (
              <p className="text-[#bdc9c6] text-xs mt-2 opacity-80 flex items-center gap-1 font-['Plus_Jakarta_Sans']">
                <Banknote className="w-3 h-3" /> Base: S/
                {session?.startingCash?.toFixed(2) || "0.00"} + Venta: S/
                {displayStats.totalCash.toFixed(2)}
              </p>
            )}
          </div>

          <div className="bg-[#1c1b1b] rounded-xl p-6 border-l-4 border-[#3d4947]/30 transition-all hover:bg-[#201f1f]">
            <p className="text-[#bdc9c6] text-[10px] font-['Plus_Jakarta_Sans'] font-bold uppercase tracking-widest mb-2 opacity-70">
              Tarjetas & Transf.
            </p>
            <p className="text-3xl font-black text-[#e5e2e1]">
              S/{" "}
              {(displayStats.totalCard + displayStats.totalTransfer).toFixed(2)}
            </p>
            <p className="text-[#bdc9c6] text-xs mt-2 opacity-60 font-['Plus_Jakarta_Sans'] flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> T: S/
              {displayStats.totalCard.toFixed(2)} | Tr: S/
              {displayStats.totalTransfer.toFixed(2)}
            </p>
          </div>

          <div className="bg-[#1c1b1b] rounded-xl p-6 border-l-4 border-[#3d4947]/30 transition-all hover:bg-[#201f1f]">
            <p className="text-[#bdc9c6] text-[10px] font-['Plus_Jakarta_Sans'] font-bold uppercase tracking-widest mb-2 opacity-70">
              Ticket Promedio
            </p>
            <p className="text-3xl font-black text-[#e5e2e1]">
              S/ {displayStats.ticketPromedio}
            </p>
            <p className="text-[#bdc9c6] text-xs mt-2 opacity-60 font-['Plus_Jakarta_Sans']">
              En {displayStats.orderCount} atenciones
            </p>
          </div>

          <div className="bg-[#1c1b1b] rounded-xl p-6 border-l-4 border-[#3d4947]/30 transition-all hover:bg-[#201f1f]">
            <p className="text-[#bdc9c6] text-[10px] font-['Plus_Jakarta_Sans'] font-bold uppercase tracking-widest mb-2 opacity-70">
              Platos Vendidos
            </p>
            <p className="text-3xl font-black text-[#e5e2e1]">
              {displayStats.totalItemsSold ?? 0}
            </p>
            <p className="text-[#bdc9c6] text-xs mt-2 opacity-60 font-['Plus_Jakarta_Sans'] flex items-center gap-1">
              <Utensils className="w-3 h-3" /> Productos prepar.
            </p>
          </div>
        </div>
      ) : activeTab === "history" ? (
        <div className="text-center py-20 bg-[#1c1b1b] rounded-xl border border-[#3d4947]/20 mb-10 opacity-70 flex flex-col items-center">
          <CalendarRange className="w-12 h-12 mb-4 text-[#3d4947]" />
          <p className="text-[#bdc9c6] font-bold">
            Aplica los filtros de fecha arriba
          </p>
          <p className="text-xs text-[#bdc9c6]/60">
            Para poblar los datos globales.
          </p>
        </div>
      ) : null}

      {displayStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Sales Registry (ONLY IF CURRENT TURN) */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "current" ? (
              <div className="bg-[#201f1f] rounded-xl overflow-hidden border border-[#3d4947]/30 shadow-lg">
                <div className="px-6 py-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#3d4947]/20 bg-[#1c1b1b]/50">
                  <h2 className="font-black tracking-tight text-[#e5e2e1]">
                    REGISTRO DE VENTAS - ESTE TURNO
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-['Plus_Jakarta_Sans'] text-sm">
                    <thead>
                      <tr className="text-[#bdc9c6] border-b border-[#3d4947]/20 opacity-80">
                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">
                          #
                        </th>
                        <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                          Hora
                        </th>
                        <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                          Total
                        </th>
                        <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                          Pago
                        </th>
                        <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px]">
                          Estado
                        </th>
                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">
                          Anular
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3d4947]/10">
                      {orders && orders.length > 0 ? (
                        orders.map((order: OrderType) => {
                          const isPaid = order.status === "paid";
                          const isCancelled = order.status === "cancelled";

                          let orderTotal = 0;
                          if (order.items && order.items.length) {
                            orderTotal = order.items.reduce(
                              (acc: number, cur: OrderItem) =>
                                acc + cur.qty * cur.unitPrice,
                              0,
                            );
                            if (order.adjustment) {
                              const delta =
                                orderTotal * (order.adjustment.percent / 100);
                              if (order.adjustment.kind === "discount")
                                orderTotal -= delta;
                              else orderTotal += delta;
                            }
                          }

                          const pType =
                            order.payments && order.payments[0]?.type;
                          let pLabel = "Otro";
                          if (pType === "cash") pLabel = "Efectivo";
                          if (pType === "card") pLabel = "Tarjeta";
                          if (pType === "transfer") pLabel = "Transf.";

                          return (
                            <tr
                              key={order._id}
                              className={`transition-colors group cursor-pointer hover:bg-[#201f1f] ${!isPaid ? "opacity-60" : ""}`}
                              onClick={() => setSelectedOrder(order)}
                            >
                              <td className="px-6 py-4 font-black font-['Manrope'] text-[#70d8c8]">
                                #{order.orderNumber}
                              </td>
                              <td className="px-4 py-4 text-[#bdc9c6] opacity-80 text-xs">
                                {new Date(order.createdAt).toLocaleTimeString(
                                  [],
                                  { timeStyle: "short" },
                                )}
                              </td>
                              <td className="px-4 py-4 font-black">
                                S/ {orderTotal.toFixed(2)}
                              </td>
                              <td className="px-4 py-4">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#bdc9c6]">
                                  <Banknote className="w-3.5 h-3.5" /> {pLabel}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                {isPaid && (
                                  <span className="px-2.5 py-1 rounded-full bg-[#005048]/50 text-[#70d8c8] text-[9px] font-black uppercase tracking-widest border border-[#70d8c8]/20">
                                    Pagada
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="px-2.5 py-1 rounded-full bg-[#93000a]/20 text-[#ffb4ab] text-[9px] font-black uppercase tracking-widest border border-[#ffb4ab]/20">
                                    Anulada
                                  </span>
                                )}
                                {!isPaid && !isCancelled && (
                                  <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-500/20">
                                    Espera
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelOrderConfirm(order._id);
                                  }}
                                  disabled={isCancelled}
                                  className={`p-2 rounded-full transition-colors ${isCancelled ? "opacity-20 cursor-not-allowed" : "text-[#ffb4ab] hover:bg-[#93000a]/20"}`}
                                  title="Anular Orden PERMANENTEMENTE"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-[#bdc9c6] opacity-40"
                          >
                            No hay ventas registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-[#201f1f] rounded-xl border border-[#3d4947]/30 shadow-lg h-full p-8 flex flex-col items-center justify-center text-center">
                <CalendarRange className="w-16 h-16 text-[#70d8c8] mb-4 opacity-70" />
                <h3 className="text-xl font-bold text-[#e5e2e1] mb-2">
                  Resumen Consolidado
                </h3>
                <p className="text-sm text-[#bdc9c6] opacity-80">
                  Visualizando el saldo de {displayStats.orderCount} atenciones
                  <br />
                  registradas entre {hStart} y {hEnd}.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Products & Ops */}
          <div className="space-y-6">
            <section className="bg-[#201f1f] rounded-xl p-6 border border-[#3d4947]/30 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-[#e5e2e1] tracking-tight text-sm">
                  TOP PLATOS & PRODUCTOS
                </h3>
                <TrendingUp className="w-4 h-4 text-[#70d8c8]" />
              </div>

              <div className="space-y-3">
                {displayStats.topDishes && displayStats.topDishes.length > 0 ? (
                  displayStats.topDishes.map(
                    (dish: { name: string; qty: number }, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#131313] border border-[#3d4947]/20 hover:border-[#70d8c8]/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#353534] flex items-center justify-center text-[10px] font-black text-[#bdc9c6]">
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#e5e2e1] leading-tight break-words max-w-[200px]">
                              {dish.name}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-[#70d8c8] font-['Manrope'] bg-[#005048]/30 px-3 py-1 rounded-full text-sm shadow-inner">
                          {dish.qty}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-[12px] text-[#bdc9c6] opacity-50 text-center py-4 bg-[#1c1b1b] rounded-lg border border-dashed border-[#3d4947]/50">
                    Sin datos registrados.
                  </p>
                )}
              </div>
            </section>

            <section className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3d4947]/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ebdcff]/30 to-transparent opacity-50"></div>
              <div className="flex items-center gap-2 mb-5">
                <ShieldAlert className="w-4 h-4 text-[#d4bbff]" />
                <h3 className="font-black text-[#e5e2e1] tracking-tight text-sm">
                  CONTROL OPERATIVO
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1c1b1b] border border-[#3d4947]/30 shadow-inner">
                  <CircleOff className="w-5 h-5 text-[#bdc9c6] opacity-50" />
                  <div>
                    <p className="text-sm font-black text-[#e5e2e1]">
                      {displayStats.cancelledOrderCount} Órdenes Anuladas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1c1b1b] border border-[#ffb4ab]/20 shadow-inner">
                  <Tag className="w-5 h-5 text-[#ffb4ab]" />
                  <div>
                    <p className="text-sm font-black text-[#e5e2e1]">
                      S/ {displayStats.totalDiscounts.toFixed(2)} Descuentos
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[#1c1b1b] border border-[#3d4947]/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-[#3d4947]/30 bg-[#201f1f]">
              <h3 className="text-xl font-black text-[#e5e2e1]">
                Previsualización de Ticket
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#bdc9c6] hover:text-white transition-colors"
                title="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="bg-white text-black p-6 rounded-md font-['Courier_New',Courier,monospace] shadow-md border border-[#e5e2e1]">
                {(() => {
                  let subtotal = 0;
                  selectedOrder.items?.forEach((item: OrderItem) => {
                    subtotal += item.qty * item.unitPrice;
                  });
                  let adjAmount = 0;
                  if (selectedOrder.adjustment) {
                    adjAmount =
                      subtotal * (selectedOrder.adjustment.percent / 100);
                    if (selectedOrder.adjustment.kind === "discount")
                      adjAmount = -adjAmount;
                  }
                  const finalTotal = subtotal + adjAmount;

                  return (
                    <>
                      <div className="text-center mb-6 border-b border-dashed border-gray-400 pb-4">
                        <h4 className="font-bold text-xl uppercase tracking-widest">
                          VeryFazty Resto
                        </h4>
                        <p className="text-sm">RUC: 20123456789</p>
                        <p className="text-xs mt-2 uppercase">
                          Ticket / Pre-Cuenta
                        </p>
                        <p className="font-bold text-lg mt-1">
                          N° #{selectedOrder.orderNumber}
                        </p>
                      </div>

                      <div className="text-xs mb-4 leading-tight">
                        <p>
                          FECHA :{" "}
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </p>
                        <p>
                          MESA :{" "}
                          {selectedOrder.tableNumber || "No especificada"}
                        </p>
                        <p>
                          ESTADO:{" "}
                          {selectedOrder.status === "paid"
                            ? "PAGADO"
                            : selectedOrder.status === "cancelled"
                              ? "ANULADO"
                              : "PENDIENTE"}
                        </p>
                      </div>

                      {selectedOrder.customer &&
                        selectedOrder.customer.documentType !== "none" && (
                          <div className="text-xs mb-4 border-t border-dashed border-gray-400 pt-4 leading-tight">
                            <p>
                              CLIENTE: {selectedOrder.customer.name}{" "}
                              {selectedOrder.customer.surname}
                            </p>
                            <p>
                              DOC :{" "}
                              {selectedOrder.customer.documentType.toUpperCase()}{" "}
                              {selectedOrder.customer.documentNumber}
                            </p>
                            {selectedOrder.customer.address && (
                              <p>DIR : {selectedOrder.customer.address}</p>
                            )}
                          </div>
                        )}

                      <table className="w-full text-xs mt-4">
                        <thead className="border-y border-dashed border-gray-400">
                          <tr>
                            <th className="py-2 text-left font-normal">CANT</th>
                            <th className="py-2 text-left font-normal">
                              DESCRIPCIÓN
                            </th>
                            <th className="py-2 text-right font-normal">
                              P.UNIT
                            </th>
                            <th className="py-2 text-right font-normal">
                              IMPORT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items?.map(
                            (item: OrderItem, idx: number) => (
                              <tr key={idx}>
                                <td className="py-2 align-top">{item.qty}</td>
                                <td className="py-2 pr-2">{item.name}</td>
                                <td className="py-2 text-right align-top">
                                  {item.unitPrice.toFixed(2)}
                                </td>
                                <td className="py-2 text-right align-top">
                                  {(item.qty * item.unitPrice).toFixed(2)}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>

                      <div className="border-t border-dashed border-gray-400 mt-4 pt-4 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>SUBTOTAL:</span>
                          <span>S/ {subtotal.toFixed(2)}</span>
                        </div>
                        {selectedOrder.adjustment && (
                          <div className="flex justify-between">
                            <span>
                              {selectedOrder.adjustment.kind === "discount"
                                ? "DESCUENTO"
                                : "RECARGO"}{" "}
                              ({selectedOrder.adjustment.percent}%):
                            </span>
                            <span>
                              {selectedOrder.adjustment.kind === "discount"
                                ? "-"
                                : "+"}{" "}
                              S/ {Math.abs(adjAmount).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-[15px] mt-2 pt-2 border-t border-dashed border-gray-400">
                          <span>TOTAL A PAGAR:</span>
                          <span>S/ {finalTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {selectedOrder.payments &&
                        selectedOrder.payments.length > 0 &&
                        selectedOrder.status === "paid" && (
                          <div className="border-t border-dashed border-gray-400 mt-4 pt-4 text-xs space-y-1">
                            <p className="font-bold mb-1">MÉTODOS DE PAGO:</p>
                            {selectedOrder.payments.map(
                              (p: OrderPayment, idx: number) => {
                                let typeName = "OTRO";
                                if (p.type === "cash") typeName = "EFECTIVO";
                                if (p.type === "card") typeName = "TARJETA";
                                if (p.type === "transfer")
                                  typeName = "TRANSFERENCIA";
                                return (
                                  <div
                                    key={idx}
                                    className="flex justify-between"
                                  >
                                    <span>{typeName}</span>
                                    <span>S/ {p.amount.toFixed(2)}</span>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}

                      <div className="text-center mt-6 text-xs text-gray-500">
                        *** COMPROBANTE INTERNO ***
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelOrderConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setCancelOrderConfirm(null)}
        >
          <div
            className="bg-[#1c1b1b] border border-[#ffb4ab]/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_40px_rgba(147,0,10,0.3)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center p-8 text-center">
              <div className="w-16 h-16 bg-[#93000a]/20 rounded-full flex items-center justify-center mb-4 border border-[#ffb4ab]/30">
                <Ban className="w-8 h-8 text-[#ffb4ab]" />
              </div>
              <h3 className="text-xl font-black text-[#e5e2e1] mb-2">
                ¿Anular Orden?
              </h3>
              <p className="text-sm text-[#bdc9c6] opacity-80 mb-6">
                Estás a punto de anular permanentemente esta transacción. Esta
                acción no se puede deshacer y alterará los totales de caja.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setCancelOrderConfirm(null)}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-[#353534] text-[#e5e2e1] hover:bg-[#3d4947] transition-colors"
                >
                  Regresar
                </button>
                <button
                  onClick={() => handleCancelOrder(cancelOrderConfirm)}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-[#93000a] text-[#ffb4ab] hover:brightness-110 transition-colors"
                >
                  Sí, Anular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE SESSION CONFIRMATION MODAL */}
      {closeSessionConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setCloseSessionConfirm(false)}
        >
          <div
            className="bg-[#1c1b1b] border border-[#ffb4ab]/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_40px_rgba(147,0,10,0.3)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center p-8 text-center">
              <div className="w-16 h-16 bg-[#93000a]/20 rounded-full flex items-center justify-center mb-4 border border-[#ffb4ab]/30 transform hover:scale-110 transition-transform">
                <Lock className="w-8 h-8 text-[#ffb4ab]" />
              </div>
              <h3 className="text-xl font-black text-[#e5e2e1] mb-2">
                ¿Cerrar Turno de Caja?
              </h3>
              <p className="text-sm text-[#bdc9c6] opacity-80 mb-6">
                Estás a punto de congelar las ventas y dar por finalizada esta
                sesión. Esta acción es definitiva y no podrás revertirla. ¿Estás
                seguro/a?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setCloseSessionConfirm(false)}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-[#353534] text-[#e5e2e1] hover:bg-[#3d4947] transition-colors"
                >
                  Continuar Turno
                </button>
                <button
                  onClick={handleCloseShift}
                  disabled={closing}
                  className="flex-1 py-3 rounded-lg font-bold text-sm bg-[#93000a] text-[#ffb4ab] hover:brightness-110 transition-colors disabled:opacity-50"
                >
                  {closing ? "Cerrando..." : "Sí, Cerrar Caja"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertModalUI}
    </div>
  );
}
