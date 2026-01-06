"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string | null) => void;
  onSelectAll: () => void;
}

export default function CategorySelector({
  categories,
  selectedCategories,
  onToggleCategory,
  onSelectAll,
}: CategorySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full sticky top-0 z-30 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 py-4 border-b border-border shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Categories List */}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden px-4 md:px-8 scrollbar-none scroll-px-4 md:scroll-px-8"
        >
          <div className="flex items-center gap-4 w-max mx-auto py-1">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category._id);
              return (
                <button
                  key={category._id}
                  onClick={() => onToggleCategory(category._id)}
                  onDoubleClick={() => onSelectAll()}
                  className={cn(
                    "flex-none px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 snap-start border shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary scale-105"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
