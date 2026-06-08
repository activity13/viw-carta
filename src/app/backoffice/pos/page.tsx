"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Layers, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Coffee,
  ListFilter
} from "lucide-react";

// Mock menu items for the interactive Quick Billing simulator
const MOCK_ITEMS = [
  { id: "1", name: "Ceviche Clásico", price: 38.00, category: "Comida" },
  { id: "2", name: "Lomo Saltado", price: 45.00, category: "Comida" },
  { id: "3", name: "Arroz con Pollo", price: 32.00, category: "Comida" },
  { id: "4", name: "Chicha Morada (Jarra)", price: 15.00, category: "Bebida" },
  { id: "5", name: "Pisco Sour", price: 22.00, category: "Bebida" },
  { id: "6", name: "Suspiro a la Limeña", price: 12.00, category: "Postre" }
];

type TableStatus = "libre" | "ocupada" | "atendiendo" | "por-cobrar";

interface MockTable {
  id: string;
  label: string;
  status: TableStatus;
  guests: number;
  total: number;
}

// Mock tables for the non-visual state manager simulator
const INITIAL_TABLES: MockTable[] = [
  { id: "Mesa 1", label: "M1", status: "libre", guests: 0, total: 0 },
  { id: "Mesa 2", label: "M2", status: "ocupada", guests: 3, total: 115.00 },
  { id: "Mesa 3", label: "M3", status: "atendiendo", guests: 2, total: 64.00 },
  { id: "Mesa 4", label: "M4", status: "por-cobrar", guests: 4, total: 182.00 },
  { id: "Mesa 5", label: "M5", status: "libre", guests: 0, total: 0 }
];

export default function PosUnderConstructionPage() {
  const { data: session } = useSession();
  
  // Quick Billing State
  const [cart, setCart] = useState<{ item: typeof MOCK_ITEMS[0]; quantity: number }[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  
  // Table Status State
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Cart Handlers
  const addToCart = (item: typeof MOCK_ITEMS[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id === itemId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  const basePrice = total / 1.18;
  const igv = total - basePrice;

  const handleSimulatePrint = () => {
    if (cart.length === 0) return;
    setIsPrinting(true);
    setPrintSuccess(false);
    
    // Simulate printer lag
    setTimeout(() => {
      setIsPrinting(false);
      setPrintSuccess(true);
      
      // Clear message after a brief display
      setTimeout(() => {
        setPrintSuccess(false);
        clearCart();
      }, 3000);
    }, 2000);
  };

  // Table State Handlers
  const updateTableStatus = (tableId: string, status: TableStatus) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { 
          ...t, 
          status,
          // Clear totals/guests if freed
          guests: status === "libre" ? 0 : t.guests === 0 ? 2 : t.guests,
          total: status === "libre" ? 0 : t.total === 0 ? 45.00 : t.total
        };
      }
      return t;
    }));
    setSelectedTableId(null);
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "libre": return "border-emerald-500/30 text-emerald-400 bg-emerald-950/20";
      case "ocupada": return "border-rose-500/30 text-rose-400 bg-rose-950/20";
      case "atendiendo": return "border-sky-500/30 text-sky-400 bg-sky-950/20";
      case "por-cobrar": return "border-amber-500/30 text-amber-400 bg-amber-950/20";
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-8rem)] bg-background flex flex-col p-4 md:p-8 font-mono select-none">
      
      {/* Top Header / Glowing Status Badge */}
      <div className="max-w-7xl mx-auto w-full mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgb(0,212,146)]" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-foreground font-roboto">
                PUNTO DE VENTA (POS)
              </h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Hola, <span className="text-primary font-bold">{session?.user?.username || "Administrador"}</span>. 
              Estamos construyendo el módulo de venta definitiva para tu negocio. Diseñado para optimizar la velocidad operativa de tu personal.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-card border border-primary/20 px-4 py-2 rounded shadow-[0_0_15px_-5px_rgba(0,212,146,0.15)] self-start md:self-auto">
            <span className="material-symbols-rounded text-primary animate-spin text-[18px]">progress_activity</span>
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">
              Módulo en Desarrollo
            </span>
          </div>
        </div>
      </div>

      {/* Main Feature Preview Section & Playground */}
      <div className="max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Side: Descriptions & Info Cards (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-card border border-border p-6 rounded relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                <Zap size={20} className="fill-current" />
              </div>
              <h3 className="font-bold text-lg text-foreground font-roboto">FACTURACIÓN RÁPIDA</h3>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4">
              Emisión de órdenes y comprobantes de pago en menos de 3 clics. Un flujo simplificado con atajos de teclado y buscador instantáneo de platos para minimizar tiempos en horas pico.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] bg-muted text-foreground px-2 py-0.5 rounded border border-border">Ticketera Térmica</span>
              <span className="text-[10px] bg-muted text-foreground px-2 py-0.5 rounded border border-border">Teclado Numérico</span>
              <span className="text-[10px] bg-muted text-foreground px-2 py-0.5 rounded border border-border">Buscador Ágil</span>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                <Layers size={20} />
              </div>
              <h3 className="font-bold text-lg text-foreground font-roboto">CONTROL DE MESAS</h3>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4">
              Gestión no-visual de comandas asignadas a mesas. Monitorea estados de consumo (Libre, Ocupada, Atendiendo, Por Cobrar) en formato de lista y tarjetas, facilitando la adición de consumos continuos.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] bg-muted text-foreground px-2 py-0.5 rounded border border-border">Múltiples Estados</span>
              <span className="text-[10px] bg-muted text-foreground px-2 py-0.5 rounded border border-border">Lista Operativa</span>
              <span className="text-[10px] bg-muted text-foreground px-2 py-0.5 rounded border border-border">Historial de Comas</span>
            </div>
          </div>

          {/* Development Status Dashboard */}
          <div className="bg-card border border-border/60 p-6 rounded flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">ESTADO DEL SPRINT</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">Diseño de Arquitectura</span>
                    <span className="text-primary font-bold">100%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">Modelado de Datos (API)</span>
                    <span className="text-primary font-bold">85%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary w-[85%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">Interfaces de Venta</span>
                    <span className="text-primary/60 font-bold">En Progreso</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary/40 w-[40%] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>PRÓXIMO DESPLIEGUE: SPRINT 4</span>
              <span className="text-primary">V0.9.0-BETA</span>
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Simulators Playground (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-card/30 border border-primary/20 p-4 md:p-6 rounded flex flex-col relative overflow-hidden backdrop-blur-xs">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs text-primary font-semibold tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                PLAYGROUND INTERACTIVO
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">Prueba las bases de la UI</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              
              {/* Simulator 1: Facturación Rápida */}
              <div className="border border-border/80 bg-background/50 rounded p-4 flex flex-col h-[400px]">
                <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-primary fill-current" />
                    <span className="text-xs font-semibold text-foreground">Fast Billing Simulator</span>
                  </div>
                  <button 
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="text-[10px] text-muted-foreground hover:text-rose-400 disabled:opacity-30 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> Limpiar
                  </button>
                </div>

                {/* Items Select Grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-3 overflow-y-auto max-h-[160px] pr-1">
                  {MOCK_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="text-[11px] p-2 bg-card border border-border hover:border-primary/50 text-left rounded hover:bg-primary/5 transition-all active:scale-[0.98] flex flex-col justify-between h-14"
                    >
                      <span className="text-foreground truncate w-full">{item.name}</span>
                      <span className="text-primary font-bold">S/ {item.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>

                {/* Simulated Receipt Area */}
                <div className="flex-1 border border-border bg-card/50 rounded p-3 flex flex-col text-xs overflow-hidden font-mono text-muted-foreground">
                  <div className="text-center text-[10px] border-b border-dashed border-border/60 pb-2 mb-2">
                    <span className="text-foreground font-bold uppercase tracking-wider block">Boleta de Venta Simulación</span>
                    <span className="block text-[8px] mt-0.5">Terminal POS #001</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-[11px]">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/60 py-6">
                        <Coffee size={24} className="mb-2 stroke-1" />
                        <span>Agrega platos arriba para simular la comanda.</span>
                      </div>
                    ) : (
                      cart.map((entry) => (
                        <div key={entry.item.id} className="flex justify-between items-center group/item py-0.5">
                          <span className="truncate text-foreground max-w-[120px]">{entry.item.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button 
                              onClick={() => updateQuantity(entry.item.id, -1)}
                              className="text-[9px] hover:text-primary p-0.5"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="font-bold text-foreground">{entry.quantity}x</span>
                            <button 
                              onClick={() => updateQuantity(entry.item.id, 1)}
                              className="text-[9px] hover:text-primary p-0.5"
                            >
                              <Plus size={10} />
                            </button>
                            <span className="w-12 text-right text-foreground">S/ {(entry.item.price * entry.quantity).toFixed(2)}</span>
                            <button 
                              onClick={() => removeFromCart(entry.item.id)}
                              className="opacity-0 group-hover/item:opacity-100 text-rose-500 hover:text-rose-600 transition-opacity ml-1"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="border-t border-dashed border-border/60 pt-2 mt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between text-[10px]">
                        <span>Op. Gravada</span>
                        <span>S/ {basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span>IGV (18%)</span>
                        <span>S/ {igv.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-foreground font-bold border-t border-border/30 pt-1">
                        <span>TOTAL</span>
                        <span className="text-primary font-bold">S/ {total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Print Trigger Button */}
                <button
                  onClick={handleSimulatePrint}
                  disabled={cart.length === 0 || isPrinting || printSuccess}
                  className="mt-3 w-full bg-primary hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground text-background font-bold py-2 rounded text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isPrinting ? (
                    <>
                      <span className="material-symbols-rounded animate-spin text-[16px]">progress_activity</span>
                      <span>IMPRIMIENDO...</span>
                    </>
                  ) : printSuccess ? (
                    <>
                      <Check size={14} />
                      <span>¡COMANDA ENVIADA!</span>
                    </>
                  ) : (
                    <>
                      <Printer size={14} />
                      <span>EMITIR COMANDA DE PRUEBA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Simulator 2: Control de Mesas (Non-Visual State Dashboard) */}
              <div className="border border-border/80 bg-background/50 rounded p-4 flex flex-col h-[400px]">
                <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <ListFilter size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-foreground">Table Status Manager</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Estado de Caja Abierta</span>
                </div>

                <p className="text-[10px] text-muted-foreground mb-4">
                  Selecciona una mesa para cambiar su estado operativo al instante.
                </p>

                {/* Tables List (Non-Visual List UI) */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {tables.map((table) => {
                    const isActive = selectedTableId === table.id;
                    return (
                      <div key={table.id} className="flex flex-col">
                        <div 
                          onClick={() => setSelectedTableId(isActive ? null : table.id)}
                          className={`flex items-center justify-between p-2.5 rounded border transition-all cursor-pointer active:scale-[0.99]
                            ${isActive 
                              ? "bg-primary/5 border-primary/60 shadow-[0_0_10px_rgba(0,212,146,0.1)]" 
                              : "bg-card border-border hover:border-border/100"
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-muted/60 border border-border flex items-center justify-center font-bold text-xs text-foreground">
                              {table.label}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground">{table.id}</span>
                              {table.status !== "libre" && (
                                <span className="text-[9px] text-muted-foreground">
                                  {table.guests} pers. · S/ {table.total.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getStatusColor(table.status)}`}>
                            {table.status.replace("-", " ")}
                          </span>
                        </div>

                        {/* Status selector drawer when active */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-x border-b border-border/80 bg-muted/20 rounded-b p-2 flex gap-1.5 justify-center flex-wrap"
                            >
                              {(["libre", "ocupada", "atendiendo", "por-cobrar"] as TableStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateTableStatus(table.id, status)}
                                  className={`text-[9px] px-2 py-1 rounded border uppercase tracking-wider font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer
                                    ${table.status === status 
                                      ? "border-primary/50 text-primary bg-primary/10" 
                                      : "border-border/60 text-muted-foreground bg-transparent hover:text-foreground"
                                    }`}
                                >
                                  {status.replace("-", " ")}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Free</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span>Busy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span>Serving</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>Billing</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Under Construction Notice / Action Bar */}
      <div className="max-w-7xl mx-auto w-full bg-card border border-border/80 p-6 rounded flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground uppercase tracking-wide mb-1 font-roboto">
              ¿Dónde está la gestión de Carta?
            </h4>
            <p className="text-xs text-muted-foreground max-w-xl">
              Toda la edición de platos, secciones y traducciones de tu menú digital sigue disponible exactamente igual. Puedes navegar a través del enlace de <span className="text-primary font-bold">Carta</span> en la barra de navegación.
            </p>
          </div>
        </div>

        <button 
          onClick={() => window.location.href = "/backoffice"}
          className="bg-transparent hover:bg-muted text-foreground hover:text-primary border border-border hover:border-primary/40 font-semibold px-5 py-2.5 rounded text-xs tracking-wider transition-all self-start md:self-auto active:scale-98 cursor-pointer"
        >
          IR A LA CARTA / BACKOFFICE
        </button>
      </div>

    </div>
  );
}
