import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface Meal {
  _id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
}

interface ProductCardProps {
  meal: Meal;
  onClick?: () => void;
}

export default function ProductCard({ meal, onClick }: ProductCardProps) {
  const image = meal.images?.find((img) => img.url) || meal.images?.[0];
  console.log(meal);
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
    >
      <div className="aspect-square relative overflow-hidden bg-slate-50">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || meal.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
        {meal.comparePrice && meal.comparePrice < meal.price && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            OFERTA
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col grow">
        <h3 className="font-medium text-slate-800 text-sm line-clamp-2 mb-1">
          {meal.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 grow">
          {meal.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {meal.comparePrice && meal.comparePrice < meal.price && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatPrice(meal.price)}
              </span>
            )}
            {meal.comparePrice ? (
              <span className="font-bold text-blue-600 text-sm">
                {formatPrice(meal.comparePrice)}
              </span>
            ) : (
              <span className="font-bold text-blue-600 text-sm">
                {formatPrice(meal.price)}
              </span>
            )}
          </div>
          <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
