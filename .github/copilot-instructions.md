# Carta Visualizer (Viw) - AI Agent Instructions

This document provides essential context and coding standards for the VIW-CARTA codebase (`viw-carta`), a SaaS platform for digital menu management.

## Note: its important to not use any type declarations in any file because nextjs build system does not admmit them.

## 1. Tech Stack & Environment

- **Core**: Next.js 15.3+ (App Router), React 19.0.1
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI), `lucide-react` icons.
- **Database**: MongoDB with Mongoose.
- **State Management**: React Query (`@tanstack/react-query`) for Backoffice, React Context for global UI state.
- **Emails**: Resend API.
- **Forms**: React Hook Form + Zod (recommended).

## 2. Project Architecture

### A. Public Views (The Menu)

The application supports two types of menu rendering:

1.  **Standard Menu (`StandardMenu.tsx`)**:
    - Used by generic tenants.
      **Estructura interna**:
    - instrucciones para el menu estandar:
      - Header with Restaurant Name & Logo.
      - Category List with Meals.
      - sticky sidebar with category navigation.
      - action buttons (Call Waiter, Order Online, toggle language).
      - Footer with Contact Info & Social Links.
    - **Dynamic Theming**: Uses a Color Palette system (Classic, Ocean, Forest, Sunset, Royal).
    - **Implementation**: Applies CSS variables via `useRestaurantTheme` hook based on `restaurant.theme`.
2.  **Custom Tenants (e.g., `src/app/la-k/`, `src/app/tikimarket/`)**:
    - Have dedicated folders and layouts.
    - Use specific CSS Modules (e.g., `theme.module.css`) or hardcoded Tailwind themes.
    - **Do NOT** use the dynamic Color Palette system.

### B. Backoffice (`src/app/backoffice/`)

- **Theme**: Uses an **Emerald/Green** color scheme (`emerald-600`, `green-50`) to convey a "Matrix/Terminal" or clean tech vibe. Avoid Purple/Pink themes.
- **Components**: heavily relies on `shadcn/ui` (Card, Dialog, Form, Input).
- **Features**: Business Profile, Menu Management, QR Generation.

### C. Application Comercial Home Page (`src/app/(home)/`)

- **Purpose**: Marketing site for attracting new businesses.
- **Theme**: Uses a vibrant **Emerald/Green** color scheme (`emerald-600 `, `green-50`).
- **Components**: heavily relies on `shadcn/ui` (Card, Dialog, Form, Input).
- **Features**: Landing pages, pricing, Our Partners, Form to get a try.

## 3. Data Models (`src/models/`)

### Restaurant

- **Theme Object**:
  ```typescript
  theme: {
    palette: 'classic' | 'ocean' | 'forest' | 'sunset' | 'royal'; // For Standard Menus
    customColors?: { primary, secondary, accent, background };
  }
  ```

### Category

- **Uniqueness**: `code` and `slug` must be unique **per restaurant** (Compound Index), not globally.
- **Fields**:
  - `code`: **String** (e.g., "ENT1", "BEB2"). Do NOT use Numbers.
  - `slug`: String (normalized, e.g., "entradas-main").
  - `order`: Number.

### Meal (Product)

- **Availability**: `availability.schedule` is an **Object** (Monday, Tuesday...), NOT an Array.
- **Pricing**: `basePrice` (Number).
- **I18n**: Fields with `_en` suffix (e.g., `name_en`, `description_en`).

## 4. Key Workflows & Patterns

### Theming System (Standard Menu)

- **Selection**: Users choose a palette in `BusinessProfileForm`.
- **Storage**: Saved in `Restaurant.theme`.
- **Application**: The API (`/api/public/menu/[subdomain]`) returns the theme. The frontend applies it to CSS variables (`--primary`, `--background`).

### Data Fetching

- **Public**: Server Components fetch via internal API with `force-dynamic` or revalidation tags.
- **Backoffice**: Client Components use `useQuery` / `useMutation`.

### UI/UX Guidelines

- **Feedback**: Use `sonner` or `toast` for notifications.
- **Loading**: Use `Loader2` from lucide-react with `animate-spin`.
- **Confirmations**: Use custom Dialog components for destructive actions (Delete), not `window.confirm()`.
- **Inputs**: Ensure high contrast for inputs in dark/light modes (avoid `bg-transparent`).

## 5. Directory Structure

- `src/app/backoffice/`: Admin panel (Protected).
- `src/app/api/`: API Routes (Public & Private).
- `src/components/templates/`: Reusable menu layouts (e.g., `StandardMenu`).
- `src/utils/`: Helpers for colors, slugs, and formatting.
