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
      <div className="group relative flex flex-col bg-card hover:bg-muted/30 border rounded-lg transition-all duration-200 shadow-sm hover:shadow-md mb-3 overflow-hidden">
        {/* Main Row */}
        <div className="flex items-center p-3 gap-3">
          {/* 1. Image/Icon Placeholder (Optional, can be added if available) */}
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
            {item.name.substring(0, 2).toUpperCase()}
          </div>

          {/* 2. Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate leading-tight">
              {item.name}
            </h4>
            <div className="text-xs text-muted-foreground mt-0.5 font-mono">
              S/. {item.unitPrice.toFixed(2)} unit.
            </div>
          </div>

          {/* 3. Controls */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 border">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => handleSetItemQty(item.mealId, item.qty - 1)}
              disabled={isOrderBusy || item.qty <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className="w-8 text-center font-mono text-sm font-bold">
              {item.qty}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => handleAddToOrder(item.mealId)}
              disabled={isOrderBusy}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* 4. Total & Actions */}
          <div className="flex items-center gap-3 pl-2 border-l ml-1">
            <div className="text-right min-w-[60px]">
              <div className="font-bold text-sm font-mono">
                S/. {(item.qty * item.unitPrice).toFixed(2)}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 text-muted-foreground hover:text-foreground",
                  (showNotes || note) && "text-primary bg-primary/10",
                )}
                onClick={() => setShowNotes(!showNotes)}
                title="Nota"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isOrderBusy}
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notes Section (Collapsible) */}
        {(showNotes || isDirty) && (
          <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 fade-in">
            <div className="relative">
              <Textarea
                placeholder="Observaciones (ej: sin cebolla, término medio...)"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setIsDirty(e.target.value !== (item.notes ?? ""));
                }}
                className="text-sm min-h-[60px] resize-none pr-10 bg-muted/20 focus:bg-background transition-colors"
                disabled={isOrderBusy}
              />
              {isDirty && (
                <Button
                  size="icon"
                  className="absolute right-2 bottom-2 h-7 w-7 shadow-sm"
                  onClick={handleSaveNote}
                  disabled={isOrderBusy}
                  title="Guardar nota"
                >
                  <Save className="h-3.5 w-3.5" />
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
