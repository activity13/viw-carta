import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { checkMealAvailability, MealAvailability } from "@/lib/availability";
import { useLanguage } from "@/hooks/useLanguage";

interface Meal {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
  availability?: MealAvailability;
}

interface ProductCardProps {
  meal: Meal;
  onClick?: () => void;
}

export default function ProductCard({ meal, onClick }: ProductCardProps) {
  const image = meal.images?.find((img) => img.url) || meal.images?.[0];
  const comparePrice =
    typeof meal.comparePrice === "number" ? meal.comparePrice : undefined;
  const isDiscount =
    typeof comparePrice === "number" &&
    comparePrice > 0 &&
    comparePrice < meal.price;

  const { language } = useLanguage();
  const availabilityResult = checkMealAvailability(meal, language);

  const handleClick = (e: React.MouseEvent) => {
    if (!availabilityResult.available) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 ${availabilityResult.available ? "hover:shadow-md cursor-pointer" : "opacity-50 grayscale cursor-not-allowed"}`}
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
        {isDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            OFERTA
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col grow">
        <h3 className={`font-medium text-slate-800 text-sm line-clamp-2 mb-1 ${!availabilityResult.available ? 'line-through' : ''}`}>
          {meal.name}
        </h3>
        
        {!availabilityResult.available && (
          <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 whitespace-nowrap mb-2 w-fit">
            {availabilityResult.message || (language === "en" ? "Unavailable" : "Agotado")}
          </span>
        )}
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 grow">
          {meal.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {isDiscount && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatPrice(meal.price)}
              </span>
            )}
            <span className="font-bold text-blue-600 text-sm">
              {formatPrice(isDiscount ? comparePrice! : meal.price)}
            </span>
          </div>
          {/* choose comparePrice if it's lower than base price */}
          {availabilityResult.available ? (
            <AddToCartButton
              meal={{
                id: meal.id || meal._id,
                name: meal.name,
                price: isDiscount ? meal.comparePrice! : meal.price,
              }}
              className="h-8"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-xs font-bold">-</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
