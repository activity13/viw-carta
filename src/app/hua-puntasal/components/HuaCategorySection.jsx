"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export const HuaCategorySection = ({ categories, language = "es" }) => {
  const [activeCategory, setActiveCategory] = useState("");
  const observerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Normalize id field (some data uses `id` instead of `_id`) and use stable anchor prefix `cat-`
    const ids = categories.map((cat) => cat._id || cat.id).filter(Boolean);
    const prefixed = ids.map((id) => `cat-${id}`);
    const els = prefixed
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Use IntersectionObserver for reliable active detection (better for mobile)
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to top that's intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveCategory(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    els.forEach((el) => observerRef.current.observe(el));

    // initial set
    if (els.length > 0) setActiveCategory(els[0].id);

    return () => observerRef.current && observerRef.current.disconnect();
  }, [categories]);

  const scrollToCategory = (id) => {
    const raw = id || (typeof id === "object" && (id._id || id.id));
    const realId = `cat-${raw}`;
    const element = document.getElementById(realId);
    if (element) {
      // Use smooth scroll to the start of the element which respects CSS scroll-margin-top
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // setActiveCategory will also be updated by the observer, but set it now for immediate feedback
      setActiveCategory(realId);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Categorías de la carta"
      className="sticky top-0 z-50 bg-hua-white/95 backdrop-blur-sm border-b-2 border-hua-celeste py-2 shadow-sm"
    >
      <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar snap-x">
        {categories.map((cat) => {
          const raw = cat._id || cat.id;
          const id = `cat-${raw}`;
          const categoryName =
            language === "en" && cat.name_en ? cat.name_en : cat.name;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={activeCategory === id}
              aria-current={activeCategory === id}
              onClick={() => scrollToCategory(raw)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all uppercase tracking-wider border snap-center focus:outline-none focus:ring-2 focus:ring-hua-blue",
                activeCategory === id
                  ? "bg-hua-blue text-hua-gray text-white border-hua-blue shadow-md"
                  : "bg-transparent text-hua-gray border-hua-celeste hover:bg-hua-celeste/20",
              )}
            >
              {categoryName}
            </button>
          );
        })}
      </div>
    </div>
  );
};
