"use client";

import { useEffect, useMemo, useState, memo } from "react";
import Axios from "axios";
import { Reorder, useDragControls } from "motion/react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FeatureGate } from "@/components/auth/FeatureGate";

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
  PlusCircle,
  ShoppingCart,
  Settings2,
  Plus,
  Lock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { useFab } from "@/providers/ActionProvider";
import { usePermission } from "@/hooks/use-permission";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrderManager } from "@/hooks/use-order-manager";
import { ActiveOrderModal } from "@/components/orders/ActiveOrderModal";
import { OrdersListModal } from "@/components/orders/OrdersListModal";

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
              type === "number" ? Number(e.target.value) : e.target.value,
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
      value: string | number,
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
  },
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
      value: string | number,
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
          <FeatureGate feature="add_to_order">
            <button
              onClick={() => handleAddToOrder(meal._id)}
              className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary"
              title="Agregar al pedido"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </FeatureGate>
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
  },
);

DraggableRow.displayName = "DraggableRow";

export default function Master() {
  const { setActions } = useFab();
  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;
  const userId = session?.user?.id;

  const orderManager = useOrderManager(restaurantId, userId);
  const {
    activeOrder,
    holdOrders,
    handleNewOrder,
    handleAddToOrder,
    handleOpenOrdersList,
    setIsOrderModalOpen,
  } = orderManager;

  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
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

  // Register FAB Actions
  const { can } = usePermission();
  const { hasRole } = usePermissions();

  useEffect(() => {
    const actions: any[] = [];

    if (hasRole(["superadmin", "admin"])) {
      actions.push({
        label: "Nuevo Plato",
        icon: Plus,
        onClick: () => {
          setProductId(null);
          setIsDialogEditing(true);
        },
      });
    }

    if (can("create_orders")) {
      actions.push({
        label: "Nueva Orden",
        icon: ShoppingCart,
        onClick: handleNewOrder,
      });
    } else {
      // Opción A: Mostrar deshabilitado con candado (Upselling)
      actions.push({
        label: "Nueva Orden (Premium)",
        icon: Lock,
        onClick: () => toast("Función disponible en planes Premium"),
      });
    }

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
    handleNewOrder,
    handleOpenOrdersList,
    setIsOrderModalOpen,
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
          new Set(catsRes.data.map((c: Category) => c._id)),
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
    value: string | number,
  ) => {
    // Optimistic update
    setMeals((prev) =>
      prev.map((m) => (m._id === id ? { ...m, [field]: value } : m)),
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
    currentState: boolean,
  ) => {
    setLoadingId(mealId);
    // Optimistic
    setMeals((prev) =>
      prev.map((m) =>
        m._id === mealId
          ? { ...m, display: { ...m.display, showInMenu: !currentState } }
          : m,
      ),
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
        <div className="flex flex-wrap gap-2 p-4">
          {categories.map((cat) => {
            const isSelected = selectedCategories.has(cat._id);
            return (
              <Badge
                key={cat._id}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer select-none transition-all hover:scale-105 px-3 py-3 text-sm ${
                  isSelected
                    ? "bg-primary text-black shadow-lg shadow-emerald-500/20 hover:bg-primary/90"
                    : "bg-muted hover:bg-inactive-background text-muted-foreground"
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
        <p className="text-[10px] text-muted-foreground text-left">
          * Doble click para seleccionar todas
        </p>
      </div>

      {/* Product List */}
      <div className="w-full bg-black border-none shadow-none rounded-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between space-y-0 p-6 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            Productos
            {isSavingOrder && (
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Guardando orden...
              </span>
            )}
          </h3>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <Select
              value={filterStatus}
              onValueChange={(val: "all" | "active" | "inactive") =>
                setFilterStatus(val)
              }
            >
              <SelectTrigger className="w-[130px] rounded-2xl bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-800 bg-gray-900 text-white">
                <SelectItem className="rounded-xl" value="all">
                  Todos
                </SelectItem>
                <SelectItem className="rounded-xl" value="active">
                  Activos
                </SelectItem>
                <SelectItem className="rounded-xl" value="inactive">
                  Inactivos
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 w-80"
              />
            </div>
          </div>
        </div>
        <div className="p-6 pt-0">
          <div className="rounded-2xl border border-gray-800 bg-black">
            {/* Desktop View (Table-like Grid) */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[5%_55%_20%_20%] bg-inactive-background p-3 font-medium text-sm text-muted-foreground border-b">
                <div className="text-center">#</div>
                <div>Nombre</div>
                <div
                  className="cursor-pointer hover:text-primary flex items-center gap-1"
                  onClick={() =>
                    setSortOrder((prev) =>
                      prev === "asc" ? "desc" : prev === "desc" ? null : "asc",
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
        </div>
      </div>

      {/* Order Modal */}
      <ActiveOrderModal manager={orderManager} meals={meals} />

      {/* Orders List Modal */}
      <OrdersListModal manager={orderManager} />

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
