"use client";

export const HuaProductItem = ({ meal, variantColumns, language = "es" }) => {
  // variantColumns es un array de objetos ej: [{ name: "Personal", name_en: "Personal" }, { name: "Fuente", name_en: "Family" }]

  // Función auxiliar para encontrar el precio correspondiente a una columna
  const getPriceForColumn = (colName, colNameEn) => {
    // Si no hay varianteColumns definida (caso simple), retornamos basePrice o "-"
    if (!variantColumns || variantColumns.length === 0) {
      return meal.price;
    }

    // Buscar en las opciones de variantes del plato
    // Asumimos que la estructura de variantes en el plato ya fue procesada o viene del backend
    // Aquí buscamos coincidencia flexible (ignorando mayúsculas/minúsculas)
    // Buscamos en TODOS los grupos de variantes, por si acaso
    let option = null;
    if (meal.variants && meal.variants.length > 0) {
      for (const group of meal.variants) {
        const found = group.options.find(
          (opt) =>
            opt.name.toLowerCase() === colName.toLowerCase() ||
            (colNameEn &&
              opt.name_en?.toLowerCase() === colNameEn.toLowerCase()),
        );
        if (found) {
          option = found;
          break;
        }
      }
    }

    // Lógica de precio:
    // Si la variante reemplaza el precio base (replacesBasePrice: true en template), usamos option.price
    // Si es un modificador, sumamos al basePrice (aunque en la carta física parece ser precios absolutos)
    // Para Hua, dado el diseño "Personal S/22 | Fuente S/40", son precios absolutos.
    if (option) {
      return option.price || option.priceModifier || "-";
    }

    // Fallback inteligente:
    // Si la categoría tiene columnas (ej: Personal | Fuente) pero este plato NO tiene variantes (es precio único),
    // mostramos el precio base en la primera columna (índice 0) o si la columna se llama "Personal"/"Unidad".
    // Aquí implementamos lógica simple: Si es la primera columna y no encontramos opción, mostramos basePrice si el plato no tiene variantes complejas.
    const isFirstColumn =
      variantColumns.findIndex(
        (c) => c.name === colName || (colNameEn && c.name_en === colNameEn),
      ) === 0;
    if (isFirstColumn && (!meal.variants || meal.variants.length === 0)) {
      return meal.price;
    }

    return "-";
  };

  const mealName = language === "en" && meal.name_en ? meal.name_en : meal.name;
  const mealDescription =
    language === "en" && meal.description_en
      ? meal.description_en
      : meal.description;

  return (
    // CAMBIO: py-2 -> py-0.5 para reducir drásticamente el espacio vertical entre platos
    <div className="flex justify-between items-center py-0.5 px-2 -mx-2 rounded-lg group hover:bg-hua-dark-blue hover:text-white transition-all duration-300 hover:scale-[0.98] hover:font-bold cursor-default">
      <div className="pr-4 flex-1 leading-tight">
        <span className="text-hua-gray group-hover:text-white text-sm uppercase tracking-tight">
          {mealName}
        </span>
        {mealDescription && (
          <span className="text-hua-gray group-hover:text-white text-xs ml-1 font-medium lowercase first-letter:capitalize inline">
            ({mealDescription})
          </span>
        )}
      </div>

      <div className="flex gap-4 sm:gap-8 text-right shrink-0">
        {variantColumns.length > 0 ? (
          variantColumns.map((col) => (
            <div
              key={`${meal._id}-${col.name}`}
              className="w-12 sm:w-16 font-heading text-hua-gray group-hover:text-white text-sm"
            >
              {(() => {
                const price = getPriceForColumn(col.name, col.name_en);
                return price !== "-" ? `S/${price}` : "";
              })()}
            </div>
          ))
        ) : (
          <div className="w-12 sm:w-16 font-heading text-hua-gray group-hover:text-white text-sm">
            S/{meal.price}
          </div>
        )}
      </div>
    </div>
  );
};
