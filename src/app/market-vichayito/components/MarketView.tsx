"use client";

import { useState, useMemo, useEffect } from "react";
import CategorySelector from "./CategorySelector";
import PromoCarousel from "./PromoCarousel";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { CartProvider } from "@/providers/CartProvider";
import { OrderFloatingButton } from "@/components/cart/OrderFloatingButton";

interface Restaurant {
  name: string;
  slug: string;
  phone: string;
  direction?: string;
  location?: string;
  description?: string;
  image: string;
  theme?: {
    palette?: string;
    customColors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      text?: string;
      muted?: string;
    };
  };
}

interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  meals?: Meal[];
}

interface Meal {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; alt?: string }[];
  categoryId: string;
  isHighlight?: boolean;
}

interface MarketData {
  restaurant: Restaurant;
  categories: Category[];
  meals?: Meal[];
}

interface MarketViewProps {
  data: MarketData;
}

export default function MarketView({ data }: MarketViewProps) {
  // Ensure categories have valid IDs and are stable
  const categories = useMemo(() => {
    return data.categories
      .filter((c) => c._id || c.id)
      .map((c) => ({
        ...c,
        _id: c._id || c.id || "",
      }));
  }, [data.categories]);

  const allCategoryIds = useMemo(
    () => categories.map((c) => c._id),
    [categories]
  );

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Sync: Initialize with all categories selected
  useEffect(() => {
    if (allCategoryIds.length > 0 && selectedCategoryIds.length === 0) {
      setSelectedCategoryIds(allCategoryIds);
    }
  }, [allCategoryIds, selectedCategoryIds.length]);

  const allMeals = useMemo(() => {
    if (data.meals && data.meals.length > 0) return data.meals as Meal[];
    return categories.flatMap((cat) =>
      (cat.meals || []).map(
        (meal: Record<string, unknown>) =>
          ({
            ...meal,
            id: (meal.id as string) || (meal._id as string),
            categoryId: cat._id,
          } as Meal)
      )
    );
  }, [data.meals, categories]);

  const highlights = useMemo(() => {
    return allMeals
      .filter(
        (meal) =>
          (meal.comparePrice && meal.comparePrice < meal.price) ||
          meal.isHighlight
      )
      .slice(0, 5);
  }, [allMeals]);

  const handleToggleCategory = (categoryId: string | null) => {
    if (categoryId === null) return;

    setSelectedCategoryIds((prev) => {
      // Check if "All" are currently selected (either by length or if prev is empty initially)
      const allSelected =
        prev.length === allCategoryIds.length || prev.length === 0;
      const isCurrentlySelected = prev.includes(categoryId);

      // Case 1: All categories are selected -> Click isolates that one
      if (allSelected) {
        return [categoryId];
      }

      // Case 2: Category is currently selected -> Deselect it
      if (isCurrentlySelected) {
        const remaining = prev.filter((id) => id !== categoryId);
        // If empty, select all
        return remaining.length === 0 ? allCategoryIds : remaining;
      }

      // Case 3: Category is not selected -> Add it
      return [...prev, categoryId];
    });
  };

  const handleSelectAll = () => {
    setSelectedCategoryIds(allCategoryIds);
  };

  // Filter logic
  const filteredCategories = useMemo(() => {
    let cats = categories;

    // 1. Filter by Category Selection
    if (selectedCategoryIds.length > 0) {
      cats = cats.filter((cat) => selectedCategoryIds.includes(cat._id));
    }

    // 2. Filter by Search Query (Global Search)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      return cats
        .map((cat) => {
          // Get meals for this category (either nested or from allMeals)
          const meals =
            cat.meals && cat.meals.length > 0
              ? cat.meals
              : allMeals.filter(
                  (m) => m.categoryId && m.categoryId === cat._id
                );

          const matchingMeals = meals.filter(
            (meal) =>
              meal.name.toLowerCase().includes(query) ||
              (meal.description &&
                meal.description.toLowerCase().includes(query))
          );

          return {
            ...cat,
            meals: matchingMeals,
          };
        })
        .filter((cat) => cat.meals && cat.meals.length > 0);
    }

    return cats;
  }, [categories, selectedCategoryIds, searchQuery, allMeals]);

  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50 pb-20">
        <CategorySelector
          categories={categories}
          selectedCategories={selectedCategoryIds}
          onToggleCategory={handleToggleCategory}
          onSearch={setSearchQuery}
          onSelectAll={handleSelectAll}
        />

        {selectedCategoryIds.length === categories.length &&
          !searchQuery &&
          highlights.length > 0 && <PromoCarousel promos={highlights} />}

        <div className="px-4 mt-6 space-y-8">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => {
              // Resolve meals for display
              const categoryMeals =
                category.meals && category.meals.length > 0
                  ? category.meals
                  : allMeals.filter(
                      (meal) =>
                        meal.categoryId &&
                        category._id &&
                        meal.categoryId === category._id
                    );

              if (!categoryMeals || categoryMeals.length === 0) return null;

              return (
                <div key={category._id}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-slate-800 text-lg">
                      {category.name}
                    </h2>
                    {searchQuery && (
                      <span className="text-xs text-slate-400">
                        {categoryMeals.length} resultados
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {categoryMeals.map((meal) => (
                      <ProductCard
                        key={meal._id}
                        meal={meal}
                        onClick={() => setSelectedMeal(meal)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-slate-400">
              <p>No se encontraron productos.</p>
            </div>
          )}
        </div>

        <ProductModal
          meal={selectedMeal}
          isOpen={!!selectedMeal}
          onClose={() => setSelectedMeal(null)}
        />
        <OrderFloatingButton restaurantPhone={data.restaurant.phone} />
      </div>
    </CartProvider>
  );
}
