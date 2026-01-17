export type SubscriptionPlan = "standard" | "premium";

export type FeatureKey =
  | "view_dashboard" // Acceso básico
  | "manage_products" // Crear/Editar platos
  | "manage_categories" // Crear/Editar categorías
  | "manage_profile" // Editar perfil de negocio
  // Premium Features
  | "add_to_order" // (Futuro) Permitir agregar platos al pedido desde el menú público
  | "create_orders" // Sistema de órdenes
  | "manage_translations" // Traducciones AI y manuales
  | "manage_texts"
  | "custom_branding" // Textos personalizados, etc.
  | "advanced_analytics"; // (Futuro)

export const PLAN_CONFIG: Record<
  SubscriptionPlan,
  { label: string; features: FeatureKey[] }
> = {
  standard: {
    label: "Estándar",
    features: [
      "view_dashboard",
      "manage_products",
      "manage_categories",
      "manage_profile",
    ],
  },
  premium: {
    label: "Premium",
    features: [
      "view_dashboard",
      "manage_products",
      "manage_categories",
      "manage_profile",
      "create_orders",
      "manage_translations",
      "custom_branding",
      "advanced_analytics",
      "add_to_order",
      "manage_texts",
    ],
  },
};

/**
 * Verifica si un plan tiene acceso a una funcionalidad específica.
 */
export function hasPermission(
  plan: SubscriptionPlan = "standard",
  feature: FeatureKey
): boolean {
  const config = PLAN_CONFIG[plan];
  if (!config) return false;
  return config.features.includes(feature);
}

/**
 * Verifica si un plan tiene acceso a TODAS las funcionalidades listadas.
 */
export function hasAllPermissions(
  plan: SubscriptionPlan,
  features: FeatureKey[]
): boolean {
  return features.every((f) => hasPermission(plan, f));
}
