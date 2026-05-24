interface PlatoDelDiaProps {
  name: string;
  description?: string;
  price: number;
  ingredients?: string[];
}

export default function PlatoDelDia({
  name,
  description,
  price,
  ingredients = [],
}: PlatoDelDiaProps) {
  return (
    <div className="flex justify-center bg-white w-full mt-2 ">
      <div className="flex  rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
        <div className="flex-1 p-6 max-w-xl items-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{name}</h2>

          {description && (
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {description}
            </p>
          )}

          {ingredients && ingredients.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Plato de fondo de hoy:
              </span>
              <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                {ingredients[0]}
              </span>
            </div>
          )}
        </div>

        <div className="bg-black text-white flex flex-col items-center justify-center px-8 min-w-[140px]">
          <span className="text-xs opacity-70 mb-1">PRECIO</span>
          <span className="text-5xl font-black leading-none mb-1">
            {Math.floor(price)}
          </span>
          <span className="text-sm font-bold mt-1">SOLES</span>
        </div>
      </div>
    </div>
  );
}
