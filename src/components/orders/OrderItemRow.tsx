import { useState, useEffect, memo } from "react";
import { Plus, Minus, Save, Trash2, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { OrderItem } from "@/types/order";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderItemRowProps {
  item: OrderItem;
  isOrderBusy: boolean;
  handleSetItemQty: (id: string, qty: number) => void;
  handleAddToOrder: (id: string) => void;
  handleUpdateItemNotes: (id: string, notes: string) => void;
}

export const OrderItemRow = memo(
  ({
    item,
    isOrderBusy,
    handleSetItemQty,
    handleAddToOrder,
    handleUpdateItemNotes,
  }: OrderItemRowProps) => {
    const [note, setNote] = useState(item.notes ?? "");
    const [isDirty, setIsDirty] = useState(false);
    const [showNotes, setShowNotes] = useState(!!item.notes);
    const [localQty, setLocalQty] = useState(item.qty.toString());

    useEffect(() => {
      if (parseFloat(localQty) !== item.qty) {
        setLocalQty(item.qty.toString());
      }
    }, [item.qty]);

    useEffect(() => {
      setNote(item.notes ?? "");
      setIsDirty(false);
      if (item.notes) setShowNotes(true);
    }, [item.notes]);

    const handleSaveNote = () => {
      handleUpdateItemNotes(item.mealId, note);
      setIsDirty(false);
    };

    const handleDelete = () => {
      if (confirm("¿Eliminar este producto?")) {
        handleSetItemQty(item.mealId, 0);
      }
    };

    return (
      <div className="group relative flex flex-col bg-card hover:bg-muted/50 border border-border rounded-xl transition-all duration-200 mb-3 overflow-hidden">
        {/* Subtle hover strip */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary/0 group-hover:bg-primary transition-colors" />

        {/* Main Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
          {/* 1. Image Placeholder */}
          <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground/60 shrink-0">
            {item.name.substring(0, 2).toUpperCase()}
          </div>

          {/* 2. Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="font-semibold text-sm text-foreground uppercase tracking-wide leading-tight">
              {item.name}
            </h4>
            <div className="text-[10px] text-muted-foreground/50 mt-1 font-mono uppercase tracking-widest">
              PU: S/. {item.unitPrice.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
            {/* 3. Controls Pill */}
            <div className="flex items-center gap-2 bg-muted border border-border rounded-full px-2 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => handleSetItemQty(item.mealId, item.qty - 1)}
                disabled={isOrderBusy || item.qty <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-14 bg-transparent text-center font-mono text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 rounded py-1 -my-1"
                value={localQty}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => {
                  setLocalQty(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    handleSetItemQty(item.mealId, val);
                  }
                }}
                onBlur={() => {
                  if (localQty === "" || isNaN(parseFloat(localQty))) {
                    handleSetItemQty(item.mealId, 0);
                    setLocalQty("0");
                  } else {
                    // Format to what is currently set on parent
                    setLocalQty(item.qty.toString());
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => handleAddToOrder(item.mealId)}
                disabled={isOrderBusy}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* 4. Total Price */}
            <div className="text-right min-w-[80px]">
              <div className="font-mono text-base font-bold text-primary tracking-wider">
                S/{(item.qty * item.unitPrice).toFixed(2)}
              </div>
            </div>

            {/* 5. Actions (Note & Trash) */}
            <div className="flex items-center gap-1 pl-2 sm:pl-4 border-l border-border">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded text-muted-foreground/60 hover:text-foreground hover:bg-accent",
                  (showNotes || note) && "text-primary bg-primary/10",
                )}
                onClick={() => setShowNotes(!showNotes)}
                title="Nota"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isOrderBusy}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notes Section (Collapsible) */}
        {(showNotes || isDirty) && (
          <div className="px-5 pb-4 pt-0 animate-in slide-in-from-top-2 fade-in">
            <div className="relative border-t border-border pt-3">
              <Textarea
                placeholder="OBSERVACIONES (EJ: SIN CEBOLLA, PARA LLEVAR...)"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setIsDirty(e.target.value !== (item.notes ?? ""));
                }}
                className="text-xs uppercase tracking-wide min-h-[60px] resize-none pr-12 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg text-foreground placeholder:text-muted-foreground/30 transition-colors"
                disabled={isOrderBusy}
              />
              {isDirty && (
                <Button
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 bg-primary hover:opacity-90 text-primary-foreground shadow-lg rounded"
                  onClick={handleSaveNote}
                  disabled={isOrderBusy}
                  title="Guardar nota"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

OrderItemRow.displayName = "OrderItemRow";
