"use client";
import React from "react";
import { Languages } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

export default function HuaLanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={toggleLanguage}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileTap={{ scale: 0.9 }}
        animate={{
          backgroundColor: hovered
            ? "rgba(132, 204, 228, 0.3)"
            : "rgba(255, 255, 255, 1)",
          boxShadow: hovered
            ? "0 4px 15px rgba(0,0,0,0.15)"
            : "0 2px 6px rgba(0,0,0,0.1)",
        }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex items-center justify-center w-14 h-14 rounded-full border-4 hua-border-blue transition-all duration-300"
      >
        <motion.div
          animate={{
            rotate: hovered ? 15 : 0,
            scale: hovered ? 1.15 : 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          <Languages className="w-6 h-6 text-hua-blue" />
        </motion.div>

        {/* Led indicador de idioma con colores Hua */}
        <motion.div
          layout
          animate={{
            backgroundColor: language === "es" ? "#4361EE" : "#84CCE4",
          }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full shadow-sm border border-white"
          style={{
            boxShadow:
              language === "es"
                ? "0 0 6px rgba(67, 97, 238, 0.6)"
                : "0 0 6px rgba(132, 204, 228, 0.6)",
          }}
        />
      </motion.button>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: hovered ? 1 : 0,
          y: hovered ? 0 : 10,
        }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-full mb-2 right-0 bg-hua-dark-blue text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-lg pointer-events-none"
      >
        {language === "es" ? "Switch to English" : "Cambiar a Español"}
        <div className="absolute top-full right-4 -mt-1">
          <div className="w-2 h-2 bg-hua-dark-blue transform rotate-45"></div>
        </div>
      </motion.div>
    </div>
  );
}
