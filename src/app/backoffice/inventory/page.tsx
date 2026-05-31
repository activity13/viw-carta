"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";
import Axios from "axios";
import { Loader2, Save, AlertTriangle, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryMeal {
  _id: string;
  name: string;
  basePrice: number;
  categoryId: { _id: string; name: string };
  availability: {
    isAvailable: boolean;
    availableQuantity: number;
    lowStockThreshold: number;
  };
  status: string;
  images: Array<{ url: string; isPrimary: boolean }>;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;
  const { can } = usePermissions();
  const isAdmin = can("edit_menu");

  const [meals, setMeals] = useState<InventoryMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data } = await Axios.get("/api/backoffice/inventory");
      setMeals(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId && isAdmin) {
      fetchInventory();
    }
  }, [restaurantId, isAdmin]);

  const handleUpdateStock = async (id: string, newQty: number) => {
    try {
      setSavingId(id);
      await Axios.post("/api/master/quick-update", {
        id,
        field: "availability.availableQuantity",
        value: newQty,
      });
      // Optionally update local state to avoid full refetch if you want it faster
      setMeals((prev) =>
        prev.map((m) =>
          m._id === id
            ? { ...m, availability: { ...m.availability, availableQuantity: newQty, isAvailable: newQty > 0 ? m.availability.isAvailable : false } }
            : m
        )
      );
    } catch (error) {
      console.error("Error updating stock:", error);
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <AccessDeniedCard message="No tienes los permisos necesarios para gestionar el inventario." />
    );
  }

  if (!restaurantId) return null;

  const filteredMeals = meals.filter((meal) =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const restockingNeeded = meals.filter(
    (m) => m.availability.availableQuantity <= (m.availability.lowStockThreshold ?? 5)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-500" />
            Control de Inventario
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestiona el stock de tus productos limitados rápidamente.
          </p>
        </div>
        
        {restockingNeeded.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-900/50 text-amber-500 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm">
            <AlertTriangle className="h-4 w-4" />
            {restockingNeeded.length} producto(s) necesitan reabastecimiento
          </div>
        )}
      </div>

      <div className="bg-[#111111] rounded-xl shadow-sm border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1A1A1A]">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-700 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-[#111111] text-white placeholder-gray-500"
            />
          </div>
          <Button onClick={fetchInventory} variant="outline" size="sm" className="w-full sm:w-auto h-9 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800">
            Actualizar
          </Button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <Package className="h-12 w-12 text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-200 mb-1">Sin productos con stock</h3>
            <p className="text-sm max-w-sm mx-auto">
              No tienes ningún producto con el control de cantidades activado, o no coincide con tu búsqueda. Edita un producto y asígnale una cantidad en la pestaña de disponibilidad.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1A1A1A] text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-3 border-b border-gray-800">Producto</th>
                  <th className="px-6 py-3 border-b border-gray-800">Categoría</th>
                  <th className="px-6 py-3 border-b border-gray-800 text-center">Estado</th>
                  <th className="px-6 py-3 border-b border-gray-800 text-center">Stock Actual</th>
                  <th className="px-6 py-3 border-b border-gray-800">Actualización Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredMeals.map((meal) => {
                  const qty = meal.availability.availableQuantity;
                  const threshold = meal.availability.lowStockThreshold ?? 5;
                  const isLowStock = qty <= threshold;
                  const isOutOfStock = qty <= 0;
                  
                  return (
                    <tr key={meal._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 shrink-0">
                            {meal.images?.[0]?.url ? (
                              <img src={meal.images[0].url} alt={meal.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-200">{meal.name}</p>
                            <p className="text-xs text-gray-500">S/ {meal.basePrice?.toFixed(2)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {meal.categoryId?.name || "Sin categoría"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Agotado
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Poco Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Disponible
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        <span className={isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-400" : "text-gray-200"}>
                          {qty}
                        </span>
                        <span className="text-xs text-gray-500 ml-1 block">/ min: {threshold}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            defaultValue={qty}
                            className="w-20 p-2 text-sm border border-gray-700 bg-[#1A1A1A] text-white rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            id={`qty-${meal._id}`}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = parseInt((e.target as HTMLInputElement).value, 10);
                                if (!isNaN(val) && val >= 0) handleUpdateStock(meal._id, val);
                              }
                            }}
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById(`qty-${meal._id}`) as HTMLInputElement;
                              const val = parseInt(input?.value, 10);
                              if (!isNaN(val) && val >= 0) handleUpdateStock(meal._id, val);
                            }}
                            disabled={savingId === meal._id}
                            className="h-9 px-3 border-gray-700 bg-[#1A1A1A] hover:bg-gray-800 text-gray-300 hover:text-white"
                          >
                            {savingId === meal._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
