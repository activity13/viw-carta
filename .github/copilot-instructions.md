# Carta Visualizer - AI Agent Instructions

This document provides essential information for AI agents working with the Carta Visualizer codebase (`viw-carta`), a Next.js 15 application for restaurant menu management.

## Tech Stack & Environment

- **Framework**: Next.js 15 (App Router), React 19
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI), `lucide-react` icons
- **Database**: MongoDB with Mongoose (Schemas in `src/models/`)
- **Auth**: NextAuth.js v4
- **State**: React Query (`@tanstack/react-query`), React Context
- **Package Manager**: npm

## Project Architecture

### Core Components

- **Menu Visualization**: `src/app/la-k/` contains the tenant-specific logic (e.g., "La K").
  - `page.tsx`: Server Component. Fetches data from internal API (`/api/public/menu/...`). Uses `force-dynamic`.
  - `components/Karta.tsx`: Main Client Component. Handles:
    - **Dual Mode**: Toggles between "principal" (regular menu) and "pizzas" views.
    - **I18n**: Uses `LanguageProvider` to switch between Spanish (default) and English (`name_en`, `description_en`).
    - **Layout**: Responsive grid (1 col mobile, 2 cols desktop for principal, 1 col for pizzas).
- **Shared UI**: `src/components/ui/` (shadcn/ui components).
- **API Routes**: `src/app/api/` handles data fetching and updates.
  - `api/public/menu/[subdomain]`: Aggregates restaurant, categories, and meals data.

### Data Models (`src/models/`)

- **Meal (`Meal.js`)**: Complex schema including:
  - **I18n**: `name`/`name_en`, `description`/`description_en`.
  - **Variants**: `variants` array with `VariantGroupSchema` (single/multiple choice).
  - **Availability**: `availability.schedule` (weekly slots), `isAvailable`.
  - **Nutrition & Allergens**: `nutrition` sub-schema, `allergens` array.
  - **Display**: `display.order`, `display.isFeatured`.
- **Category**: Groups meals.
- **Restaurant**: Tenant configuration.

## Key Workflows & Patterns

### Data Fetching

1. **Server-Side**: `page.tsx` calls internal API.
   ```typescript
   const res = await fetch(`${baseUrl}/api/public/menu/${subdomain}`, {
     next: { tags: [`menu-${subdomain}`] },
   });
   ```
2. **Client-Side**: Data passed as props to `Karta.tsx`.

### Internationalization (I18n)

- **Data Level**: Models have `_en` suffix fields (e.g., `name_en`).
- **Component Level**: `useLanguage` hook provides `language` context.
- **Helper**: `t(es, en)` function in components selects string based on current language.

### Styling & Layout

- **Mobile-First**: Extensive use of Tailwind breakpoints (`md:`, `xl:`).
- **Scroll Behavior**: Smooth scrolling to category anchors (`id="cat-${id}"`).
- **Theming**: `globals.css` and `theme.module.css` (in tenant folders).

## Development Guidelines

- **Run Dev**: `npm run dev --turbopack`
- **Database**: Ensure `MONGODB_URI` is set. Connection logic in `src/lib/mongodb.ts`.
- **New Components**: Prefer "use client" only when interaction is needed. Use `shadcn/ui` patterns.
- **Type Safety**: Use TypeScript interfaces matching Mongoose schemas (see `Karta.tsx` interfaces).

## Directory Structure

- `src/app/la-k/`: Specific implementation for "La K" restaurant.
- `src/models/`: Mongoose schemas (Note: mix of `.js` and `.ts`).
- `src/lib/`: Utilities (`mongodb.ts`, `auth.ts`).
