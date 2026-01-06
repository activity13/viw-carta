import React from "react";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";

interface Meal {
  _id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice: number;
  images?: { url: string; alt?: string }[];
  isHighlight?: boolean;
}

interface ShowcaseCarouselProps {
  items: Meal[];
  title?: string;
  subtitle?: string;
}

export default function ShowcaseCarousel({
  items,
  title = "Destacados",
  subtitle = "Destacados del día",
}: ShowcaseCarouselProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full pt-6">
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-none snap-x scroll-px-4">
        {items.map((meal) => {
          const image = meal.images?.find((img) => img.url) || meal.images?.[0];
          const isPromo = Boolean(
            meal.comparePrice && meal.comparePrice < meal.price
          );
          const badge = isPromo
            ? "OFERTA"
            : meal.isHighlight
            ? "DESTACADO"
            : null;

          return (
            <article
              key={meal._id}
              className={cn(
                "flex-none w-[300px] snap-center rounded-2xl overflow-hidden",
                "bg-card  text-card-foreground border border-border",
                "shadow-sm hover:shadow-md transition-shadow"
              )}
            >
              <div className="flex">
                <div className="w-1/2 p-4 flex flex-col">
                  {badge && (
                    <span className="inline-flex w-fit items-center rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground mb-2">
                      {badge}
                    </span>
                  )}

                  <h3 className="font-bold text-base leading-tight line-clamp-2">
                    {meal.name}
                  </h3>

                  {meal.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {meal.description}
                    </p>
                  )}

                  <div className="mt-auto pt-3">
                    {isPromo && (
                      <span className="text-xs text-muted-foreground line-through block">
                        {formatPrice(meal.price)}
                      </span>
                    )}

                    <span className="font-bold text-lg">
                      {formatPrice(isPromo ? meal.comparePrice : meal.price)}
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
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        Sin foto
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
