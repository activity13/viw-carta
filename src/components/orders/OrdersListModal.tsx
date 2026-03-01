import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { calculateOrderTotal } from "@/lib/order-utils";
import { useOrderManager } from "@/hooks/use-order-manager";

type OrderManager = ReturnType<typeof useOrderManager>;

interface OrdersListModalProps {
  manager: OrderManager;
}

export function OrdersListModal({ manager }: OrdersListModalProps) {
  const {
    holdOrders,
    isOrdersListModalOpen,
    setIsOrdersListModalOpen,
    isOrdersBusy,
    handleActivateOrder,
  } = manager;

  return (
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
  );
}
