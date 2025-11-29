"use client";

import { useEffect, useState, useMemo } from "react";
import { ObjectId } from "mongoose";
import Axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateMealForm from "@/components/createMeal";
import { Loader2, ArrowUpDown, Search, Edit3, Check, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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
            className="min-h-[80px] pr-8"
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

export default function Master() {
  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;

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

  // Category Logic
  const toggleCategory = (id: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCategories(newSet);
  };

  const toggleAllCategories = () => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(categories.map((c) => c._id)));
    }
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
        if (!sortOrder) return 0;
        return sortOrder === "asc"
          ? a.basePrice - b.basePrice
          : b.basePrice - a.basePrice;
      });
  }, [meals, selectedCategories, searchTerm, sortOrder, filterStatus]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Category Filter */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Categorías</h3>
          <span className="text-xs text-muted-foreground">
            {selectedCategories.size} de {categories.length} visibles
          </span>
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
          * Doble click para seleccionar/deseleccionar todas
        </p>
      </div>

      {/* Product List */}
      <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Productos</CardTitle>
          <div className="flex items-center gap-2">
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
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Nombre</TableHead>
                  <TableHead
                    className="w-[20%] cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      setSortOrder((prev) =>
                        prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      Precio
                      <ArrowUpDown
                        className={`h-4 w-4 ${
                          sortOrder ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[20%] text-center">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeals.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeals.map((meal) => (
                    <TableRow key={meal._id}>
                      <TableCell className="font-medium align-top overflow-hidden">
                        <EditableCell
                          value={meal.name}
                          onSave={(val) =>
                            handleQuickUpdate(meal._id, "name", val)
                          }
                          className="truncate block"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <EditableCell
                          type="number"
                          value={meal.basePrice}
                          onSave={(val) =>
                            handleQuickUpdate(meal._id, "basePrice", val)
                          }
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex flex-col items-center">
                            <Switch
                              checked={meal.display?.showInMenu}
                              onCheckedChange={() =>
                                handleToggleAvailable(
                                  meal._id,
                                  meal.display?.showInMenu
                                )
                              }
                              disabled={loadingId === meal._id}
                            />
                            <span className="text-[10px] text-muted-foreground mt-1">
                              {meal.display?.showInMenu ? "Visible" : "Oculto"}
                            </span>
                          </div>
                          <button
                            onClick={() => openFullEdit(meal._id)}
                            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary"
                            title="Edición completa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
