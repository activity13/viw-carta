"use client";

import { useMemo } from "react";
import { HuaProductItem } from "./HuaProductItem";

export const HuaCategoryBlock = ({ category, meals, language = "es" }) => {
  // Detectar variantes automáticamente para construir las columnas
  // Regla: Si AL MENOS UN plato tiene variantes, extraemos los nombres únicos de las opciones del PRIMER grupo de variantes
  // Esto asume consistencia en los datos (ej: todos en "Entradas" usan la plantilla "Tamaños")
  const variantColumns = useMemo(() => {
    const columns = [];
    let hasVariants = false;

    meals.forEach((meal) => {
      if (meal.variants && meal.variants.length > 0) {
        // Tomamos solo el primer grupo de variantes para definir las columnas de la tabla
        // Ej: Grupo "Tamaño" -> Opciones "Personal", "Fuente"
        const primaryGroup = meal.variants[0];
        if (primaryGroup && primaryGroup.options) {
          hasVariants = true;
          primaryGroup.options.forEach((opt) => {
            // Guardar objeto con nombre y nombre_en para soporte de traducción
            if (!columns.find((c) => c.name === opt.name)) {
              columns.push({
                name: opt.name,
                name_en: opt.name_en || opt.name,
              });
            }
          });
        }
      }
    });

    // Ordenar o convertir a array.
    // TODO: Idealmente esto debería venir definido por configuración, pero aquí lo inferimos.
    return hasVariants ? columns : [];
  }, [meals]);

  // Helper para obtener nombre traducido de variante
  const getVariantName = (variantCol) => {
    if (language === "en" && variantCol.name_en) {
      return variantCol.name_en;
    }
    return variantCol.name;
  };

  if (!meals || meals.length === 0) return null;

  const rawId = category._id || category.id;
  const categoryName =
    language === "en" && category.name_en ? category.name_en : category.name;

  return (
    <div
      id={`cat-${rawId}`}
      className="mb-8 break-inside-avoid category-anchor scroll-mt-20"
    >
      {/* Header Fila 1: Título Categoría + Títulos Variantes */}
      <div className="flex justify-between items-end border-b gap-4 mb-2 pb-1 border-dashed border-hua-blue">
        <h3 className="hua-category-title text-base sm:text-lg tracking-wider">
          {categoryName}
        </h3>

        {variantColumns.length > 0 && (
          <div className="flex gap-4 sm:gap-8 text-right shrink-0 pb-0.5">
            {variantColumns.map((col) => (
              <span
                key={col.name}
                className="w-12 sm:w-16 text-[10px] sm:text-[15px] font-bold text-hua-dark-blue uppercase text-center"
              >
                {getVariantName(col)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Platos - Sin espacio vertical entre items */}
      <div className="space-y-0">
        {meals.map((meal) => (
          <HuaProductItem
            key={meal._id || meal.id}
            meal={meal}
            variantColumns={variantColumns}
            language={language}
          />
        ))}
      </div>
    </div>
  );
};
