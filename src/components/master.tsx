"use client";
import { useEffect, useState } from "react";
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
import CreateMealForm from "@/components/createMeal";
import { Loader2, ArrowUpDown } from "lucide-react";
import { useSession } from "next-auth/react";
interface Meal {
  name: string;
  basePrice: string;
  _id: ObjectId;
  restaurantId: ObjectId;
  display: {
    showInMenu: boolean;
  };
}

// Filtro por nombre, disponibilidad y rango de precio
function filterMeals(
  meals: Meal[],
  filters: {
    name: string;
    available: string;
    minPrice: string;
    maxPrice: string;
  }
) {
  return meals.filter((meal) => {
    const matchesName = meal.name
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const matchesAvailable =
      filters.available === "all"
        ? true
        : filters.available === "yes"
        ? meal.display.showInMenu
        : !meal.display.showInMenu;
    const price = parseFloat(meal.basePrice);
    const min = filters.minPrice ? parseFloat(filters.minPrice) : -Infinity;
    const max = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
    const matchesPrice = price >= min && price <= max;
    return matchesName && matchesAvailable && matchesPrice;
  });
}

export default function Master() {
  const { data: session } = useSession();

  const restaurantId = session?.user?.restaurantId;
  const [loadingId, setLoadingId] = useState<ObjectId | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [productId, setProductId] = useState<ObjectId | null>(null);
  const [isDialogEditing, setIsDialogEditing] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    name: "",
    available: "all",
    minPrice: "",
    maxPrice: "",
  });

  // Orden de la columna precio
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  // Solo consulta si hay sesión y restaurantId
  const fetchMeals = async () => {
    if (!session?.user?.restaurantId) return;
    try {
      const response = await Axios.get("/api/master/get", {
        params: { restaurantId: session.user.restaurantId },
      });
      setMeals(response.data);
    } catch (error) {
      console.error("Error fetching meals:", error);
    }
  };
  const toggleDialog = (id: ObjectId) => {
    setProductId(id);
    setIsDialogEditing(!isDialogEditing);
  };

  const handleToggleAvailable = async (
    mealId: ObjectId,
    currentState: boolean
  ) => {
    setLoadingId(mealId);
    try {
      await Axios.put("/api/master/update-availability", {
        mealId,
        isAvailable: !currentState,
      });
      fetchMeals();
    } catch (error) {
      console.error("Error updating availability:", error);
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    fetchMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.restaurantId]);

  // Filtra y ordena los platos según los filtros y el orden
  const filteredMeals = filterMeals(meals, filters).sort((a, b) => {
    if (!sortOrder) return 0;
    const priceA = parseFloat(a.basePrice);
    const priceB = parseFloat(b.basePrice);
    return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
  });

  return (
    <>
      <Card className="max-w-4xl mx-auto overflow-y-auto max-h-[80vh] bg-gradient-to-r from-green-900 via-green-800 to-green-700 border-4 border-green-900 shadow-2xl shadow-green-900/40 rounded-2xl backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="text-center text-white text-3xl font-extrabold tracking-wide uppercase drop-shadow-lg">
            Lista de Platos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="
    w-full mb-4
    grid grid-cols-1 md:grid-cols-4 gap-4
    bg-green-950/90 border-2 border-green-900 rounded-2xl
    p-4 shadow-lg
    transition-all
  "
          >
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              value={filters.name}
              onChange={(e) =>
                setFilters((f) => ({ ...f, name: e.target.value }))
              }
              className="
      bg-green-900/80 border border-green-700 text-white placeholder:text-green-300
      rounded-xl px-4 py-2 w-full
      focus:outline-none focus:ring-2 focus:ring-green-400
      font-mono text-base
      transition-all
    "
            />
            <select
              value={filters.available}
              onChange={(e) =>
                setFilters((f) => ({ ...f, available: e.target.value }))
              }
              className="
      bg-green-900/80 border border-green-700 text-white
      rounded-xl px-4 py-2 w-full
      focus:outline-none focus:ring-2 focus:ring-green-400
      font-mono text-base
      transition-all
    "
            >
              <option value="all">Todos</option>
              <option value="yes">Disponibles</option>
              <option value="no">No disponibles</option>
            </select>
            <input
              type="number"
              placeholder="Precio mínimo"
              value={filters.minPrice}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minPrice: e.target.value }))
              }
              className="
      bg-green-900/80 border border-green-700 text-white placeholder:text-green-300
      rounded-xl px-4 py-2 w-full
      focus:outline-none focus:ring-2 focus:ring-green-400
      font-mono text-base
      transition-all
    "
              min={0}
            />
            <input
              type="number"
              placeholder="Precio máximo"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters((f) => ({ ...f, maxPrice: e.target.value }))
              }
              className="
      bg-green-900/80 border border-green-700 text-white placeholder:text-green-300
      rounded-xl px-4 py-2 w-full
      focus:outline-none focus:ring-2 focus:ring-green-400
      font-mono text-base
      transition-all
    "
              min={0}
            />
          </div>
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[65%]" /> {/* Nombre */}
              <col className="w-[15%]" /> {/* Precio */}
              <col className="w-[20%]" /> {/* Activo */}
            </colgroup>
            <TableHeader className="bg-green-900">
              <TableRow>
                <TableHead className="w-[65%] text-white font-extrabold text-lg uppercase tracking-wide">
                  Plato
                </TableHead>
                <TableHead
                  className="w-[15%] text-white font-extrabold text-sm uppercase tracking-wide flex items-center gap-2 cursor-pointer select-none"
                  onClick={() =>
                    setSortOrder((prev) =>
                      prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
                    )
                  }
                >
                  Precio
                  <ArrowUpDown
                    className={`w-5 h-5 transition-transform ${
                      sortOrder === "asc"
                        ? "rotate-180 text-green-300"
                        : sortOrder === "desc"
                        ? "text-green-300"
                        : "text-white opacity-50"
                    }`}
                  />
                </TableHead>
                <TableHead className="w-[20%] text-white font-extrabold text-lg uppercase tracking-wide text-center">
                  ✅
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeals.map((meal, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-green-800/30 transition-all"
                >
                  <TableCell className="text-white font-semibold max-w-[100px] overflow-x-auto responsive whitespace-nowrap scrollbar-none ">
                    <button
                      className="hover:cursor-pointer hover:text-white hover:font-bold transition-all"
                      onClick={() => toggleDialog(meal._id)}
                    >
                      {meal.name}
                    </button>
                  </TableCell>
                  <TableCell className="font-semibold text-white">
                    S/. {meal.basePrice}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center min-h-[1.5rem]">
                      {loadingId === meal._id ? (
                        <Loader2
                          className="animate-spin text-white"
                          size={24}
                        />
                      ) : (
                        <Switch
                          checked={meal.display?.showInMenu}
                          onCheckedChange={() =>
                            handleToggleAvailable(
                              meal._id,
                              meal.display?.showInMenu
                            )
                          }
                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-green-950"
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CreateMealForm
        restaurantId={restaurantId}
        isOpen={isDialogEditing}
        onClose={toggleDialog}
        fetchMeals={fetchMeals}
        mealId={productId}
      />
    </>
  );
}
