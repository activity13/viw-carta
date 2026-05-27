"use client";

import { useEffect, useState } from "react";
import styles from "../theme.module.css";

export default function ThemeApplicator() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add(styles.themeSirena);
    setMounted(true);
    return () => {
      document.documentElement.classList.remove(styles.themeSirena);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
        {/* Loader elegante y moderno */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#059669] animate-spin border-opacity-80"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-[#059669] rounded-full animate-pulse"></div>
          </div>
          <p className="mt-6 text-sm font-medium text-gray-500 tracking-widest uppercase animate-pulse">
            Configurando tu experiencia...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
