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

interface PromoCarouselProps {
  promos: Meal[];
}

export default function PromoCarousel({ promos }: PromoCarouselProps) {
  if (!promos || promos.length === 0) return null;

  return (
    <div className="w-full py-6">
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold text-slate-800">Highlights</h2>
        <p className="text-sm text-slate-500">Lo mejor de Vichayito</p>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar snap-x">
        {promos.map((meal) => {
          const image = meal.images?.find((img) => img.url) || meal.images?.[0];
          return (
            <div
              key={meal._id}
              className="flex-none w-[280px] snap-center bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl overflow-hidden shadow-lg text-white relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

              <div className="flex h-full">
                <div className="w-1/2 p-4 flex flex-col justify-center z-10">
                  <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm rounded-md text-[10px] font-medium mb-2 w-fit">
                    DESTACADO
                  </span>
                  <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">
                    {meal.name}
                  </h3>
                  <div className="mt-auto">
                    {meal.comparePrice && (
                      <span className="text-xs text-blue-200 line-through block">
                        {formatPrice(meal.comparePrice)}
                      </span>
                    )}
                    <span className="font-bold text-xl">
                      {formatPrice(meal.price)}
                    </span>
                  </div>
                </div>
                <div className="w-1/2 relative h-40 self-center">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.alt || meal.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className="text-xs opacity-50">Sin foto</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
