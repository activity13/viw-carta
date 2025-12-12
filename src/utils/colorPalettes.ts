export interface ColorPalette {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
}

export const COLOR_PALETTES: Record<string, ColorPalette> = {
  classic: {
    name: "Clásico",
    description: "Elegante, alto contraste y profesional",
    primary: "#09090B", // Zinc 950
    secondary: "#27272A", // Zinc 800
    accent: "#D97706", // Amber 600
    background: "#FFFFFF", // White
    foreground: "#09090B", // Zinc 950
    muted: "#F4F4F5", // Zinc 100
    mutedForeground: "#52525B", // Zinc 600 (Darker for better contrast)
  },
  ocean: {
    name: "Pacífico",
    description: "Inspirado en el mar de Grau",
    primary: "#082F49", // Sky 950
    secondary: "#0369A1", // Sky 700
    accent: "#0EA5E9", // Sky 500
    background: "#F0F9FF", // Sky 50
    foreground: "#082F49", // Sky 950
    muted: "#E0F2FE", // Sky 100
    mutedForeground: "#0369A1", // Sky 700
  },
  forest: {
    name: "Amazonía",
    description: "Vibrante como la selva peruana",
    primary: "#022C22", // Emerald 950
    secondary: "#047857", // Emerald 700
    accent: "#10B981", // Emerald 500
    background: "#ECFDF5", // Emerald 50
    foreground: "#022C22", // Emerald 950
    muted: "#D1FAE5", // Emerald 100
    mutedForeground: "#047857", // Emerald 700
  },
  sunset: {
    name: "Desierto Costero",
    description: "Tonos cálidos de la costa y el atardecer",
    primary: "#431407", // Orange 950
    secondary: "#C2410C", // Orange 700
    accent: "#F97316", // Orange 500
    background: "#FFF7ED", // Orange 50
    foreground: "#431407", // Orange 950
    muted: "#FFEDD5", // Orange 100
    mutedForeground: "#9A3412", // Orange 800
  },
  royal: {
    name: "Chicha",
    description: "La esencia del maíz morado y lo andino",
    primary: "#4A044E", // Fuchsia 950
    secondary: "#A21CAF", // Fuchsia 700
    accent: "#D946EF", // Fuchsia 500
    background: "#FDF4FF", // Fuchsia 50
    foreground: "#4A044E", // Fuchsia 950
    muted: "#FAE8FF", // Fuchsia 100
    mutedForeground: "#A21CAF", // Fuchsia 700
  },
  viw: {
    name: "VIW",
    description: "Tema tecnológico matrix",
    primary: "#065F46",
    secondary: "#059669",
    accent: "#10B981",
    background: "#ECFDF5",
    foreground: "#064E3B",
    muted: "#D1FAE5",
    mutedForeground: "#047857",
  },
};

export interface FontPairing {
  name: string;
  heading: string;
  body: string;
}

export const FONT_PAIRINGS: Record<string, FontPairing> = {
  sans: {
    name: "Moderno (Sans)",
    heading: "ui-sans-serif, system-ui, sans-serif",
    body: "ui-sans-serif, system-ui, sans-serif",
  },
  serif: {
    name: "Elegante (Serif)",
    heading: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
    body: "ui-sans-serif, system-ui, sans-serif",
  },
  tech: {
    name: "Tech (VIW)",
    heading: "var(--font-orbitron), ui-sans-serif, system-ui",
    body: "var(--font-mono), ui-monospace, monospace",
  },
};

export interface RestaurantTheme {
  palette: string;
  font?: string;
  customColors?: Partial<ColorPalette>;
}

/**
 * Genera CSS variables para aplicar un tema
 */
export function generateThemeCSS(theme: RestaurantTheme): string {
  const basePalette = COLOR_PALETTES[theme.palette] || COLOR_PALETTES.classic;
  const colors = { ...basePalette, ...theme.customColors };
  const font = FONT_PAIRINGS[theme.font || "sans"] || FONT_PAIRINGS.sans;

  return `
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-accent: ${colors.accent};
      --color-background: ${colors.background};
      --color-foreground: ${colors.foreground};
      --color-muted: ${colors.muted};
      --color-muted-foreground: ${colors.mutedForeground};
      
      --color-primary-foreground: #ffffff;
      --color-secondary-foreground: #ffffff;
      --color-accent-foreground: #ffffff;
      
      /* Fonts */
      --font-heading: ${font.heading};
      --font-body: ${font.body};

      /* CSS Custom Properties para Tailwind */
      --primary: ${colors.primary};
      --secondary: ${colors.secondary};
      --accent: ${colors.accent};
      --background: ${colors.background};
      --foreground: ${colors.foreground};
      --muted: ${colors.muted};
      --muted-foreground: ${colors.mutedForeground};
      
      --card: ${colors.background};
      --card-foreground: ${colors.foreground};
      --popover: ${colors.background};
      --popover-foreground: ${colors.primary};
      --primary-foreground: #ffffff;
      --secondary-foreground: #ffffff;
      --accent-foreground: #ffffff;
      --muted-foreground: #64748b;
      --border: #e2e8f0;
      --input: #f1f5f9;
      --ring: ${colors.accent};
    }

    /* Global Font Application */
    body {
      font-family: var(--font-body);
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }
  `;
}

/**
 * Genera CSS variables para aplicar en el DOM
 */
export function generateCSSVariables(
  colors: ColorPalette
): Record<string, string> {
  return {
    "--color-primary": colors.primary,
    "--color-secondary": colors.secondary,
    "--color-accent": colors.accent,
    "--color-background": colors.background,
    "--color-muted": colors.muted,
    "--primary": colors.primary,
    "--secondary": colors.secondary,
    "--accent": colors.accent,
    "--background": colors.background,
    "--muted": colors.muted,
    "--card": colors.background,
    "--card-foreground": colors.primary,
    "--popover": colors.background,
    "--popover-foreground": colors.primary,
    "--primary-foreground": "#ffffff",
    "--secondary-foreground": "#ffffff",
    "--accent-foreground": "#ffffff",
    "--muted-foreground": "#64748b",
    "--border": "#e2e8f0",
    "--input": "#f1f5f9",
    "--ring": colors.accent,
  };
}

/**
 * Hook para aplicar tema del restaurante
 */
export function applyRestaurantTheme(theme: RestaurantTheme): void {
  const themeCSS = generateThemeCSS(theme);

  // Remover tema anterior si existe
  const existingTheme = document.getElementById("restaurant-theme");
  if (existingTheme) {
    existingTheme.remove();
  }

  // Aplicar nuevo tema
  const styleElement = document.createElement("style");
  styleElement.id = "restaurant-theme";
  styleElement.textContent = themeCSS;
  document.head.appendChild(styleElement);
}

/**
 * Obtiene el tema por defecto
 */
export function getDefaultTheme(): RestaurantTheme {
  return {
    palette: "classic",
    customColors: undefined,
  };
}

/**
 * Valida si una paleta existe
 */
export function isValidPalette(palette: string): boolean {
  return palette in COLOR_PALETTES;
}
