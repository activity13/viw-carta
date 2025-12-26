"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string | null) => void;
  onSearch: (query: string) => void;
  onSelectAll: () => void;
}

export default function CategorySelector({
  categories,
  selectedCategories,
  onToggleCategory,
  onSearch,
  onSelectAll,
}: CategorySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full sticky top-0 z-30 bg-slate-50/95 backdrop-blur supports-backdrop-filter:bg-slate-50/80 py-4 border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Search Bar */}
        <div className="px-4 w-full max-w-md mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              onChange={(e) => onSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Categories List */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-2 px-4 scrollbar-none snap-x justify-start md:justify-center"
        >
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category._id);
            return (
              <button
                key={category._id}
                onClick={() => onToggleCategory(category._id)}
                onDoubleClick={() => onSelectAll()}
                className={cn(
                  "flex-none px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 snap-start border shadow-sm hover:shadow-md active:scale-95",
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 scale-105"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
