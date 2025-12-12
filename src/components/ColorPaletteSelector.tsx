"use client";

import React from "react";
import { Check, Palette, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COLOR_PALETTES,
  FONT_PAIRINGS,
  type RestaurantTheme,
} from "@/utils/colorPalettes";

interface ColorPaletteSelectorProps {
  selectedTheme: RestaurantTheme;
  onThemeChange: (theme: RestaurantTheme) => void;
  disabled?: boolean;
  className?: string;
}

export function ColorPaletteSelector({
  selectedTheme,
  onThemeChange,
  disabled = false,
  className,
}: ColorPaletteSelectorProps) {
  const handlePaletteSelect = (paletteKey: string) => {
    if (disabled) return;

    onThemeChange({
      ...selectedTheme,
      palette: paletteKey,
      customColors: undefined, // Reset custom colors when changing palette
    });
  };

  const handleFontSelect = (fontKey: string) => {
    if (disabled) return;

    onThemeChange({
      ...selectedTheme,
      font: fontKey,
    });
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Color Palettes */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Palette className="w-4 h-4" />
          Estilo de Color
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(COLOR_PALETTES).map(([key, palette]) => {
            const isSelected = selectedTheme.palette === key;

            return (
              <div
                key={key}
                onClick={() => handlePaletteSelect(key)}
                className={cn(
                  "relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200",
                  "hover:shadow-md",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-md"
                    : "border-muted hover:border-muted-foreground/50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {/* Color Preview */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded shadow-sm border border-white/20"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded shadow-sm border border-white/20"
                      style={{ backgroundColor: palette.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded shadow-sm border border-white/20"
                      style={{ backgroundColor: palette.accent }}
                    />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{palette.name}</span>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="text-xs text-muted-foreground mb-3">
                  {palette.description}
                </div>

                {/* Mini Preview */}
                <div
                  className="rounded-md p-2 border"
                  style={{ backgroundColor: palette.background }}
                >
                  <div
                    className="text-xs font-semibold mb-1"
                    style={{ color: palette.primary }}
                  >
                    Pizza Margherita
                  </div>
                  <div
                    className="text-xs mb-1"
                    style={{ color: palette.secondary }}
                  >
                    Tomate, mozzarella, albahaca
                  </div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: palette.accent }}
                  >
                    $ 12.00
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Font Selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Type className="w-4 h-4" />
          Tipografía
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(FONT_PAIRINGS).map(([key, font]) => {
            const isSelected = (selectedTheme.font || "sans") === key;

            return (
              <div
                key={key}
                onClick={() => handleFontSelect(key)}
                className={cn(
                  "relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200",
                  "hover:shadow-md flex flex-col gap-2",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 shadow-md"
                    : "border-muted hover:border-muted-foreground/50",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm">{font.name}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 mt-2">
                  <div
                    className="text-lg font-bold leading-none"
                    style={{ fontFamily: font.heading }}
                  >
                    Aa
                  </div>
                  <div
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: font.body }}
                  >
                    The quick brown fox jumps over the lazy dog.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
