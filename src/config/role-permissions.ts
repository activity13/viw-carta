export type Role = "superadmin" | "admin" | "staff" | "waiter";

export type ActionKey =
  | "manage_settings"  // Acceso general a configuración
  | "manage_team"      // Invitar/editar usuarios y roles
  | "edit_menu"        // Crear/editar/eliminar productos y categorías
  | "view_orders"      // Ver pedidos entrantes y el panel de caja
  | "manage_business" // Gestionar cuenta del restaurante
  | "manage_translations" //  Gestionar traducciones
  | "manage_messages" // Gestionar mensajes
  | "manage_variants" //  Gestionar variantes
  // Permisos para el modal de orden.
  | "can_register_client" //  Permite sobreescribir el nombre del cliente
  | "can_search_client" //  Buscar cliente por numero de documento
  | "can_add_item" //  agregar productos a la orden
  | "can_remove_item" //  eliminar productos de la orden
  | "can_register_payment" //  agregar metodos de pago
  | "can_set_adjustment" //  agregar descuentos o recargos
  | "can_submit_order" //  procesar el pago y la orden en general
  | "delete_restaurant"; // (Futuro) Eliminar cuenta completamente

export const ROLE_PERMISSIONS: Record<Role, ActionKey[]> = {
  superadmin: [
    "manage_settings",
    "manage_team",
    "edit_menu",
    "view_orders",
    "delete_restaurant",
    "manage_business",
    "manage_translations",
   "manage_variants" ,
    "manage_messages",
    "manage_messages",
    "can_register_client",
    "can_search_client",
    "can_add_item",
    "can_remove_item",
    "can_register_payment",
    "can_set_adjustment",
    "can_submit_order",
  ],
  admin: [
    "manage_settings",
    "manage_team",
    "edit_menu",
    "view_orders",
    "manage_business",
    "manage_translations",
    "manage_messages",
    "can_register_client",
    "can_search_client",
    "can_add_item",
    "can_remove_item",
    "can_register_payment",
    "can_set_adjustment",
    "can_submit_order",
"manage_variants"
  ],
  staff: [
    "edit_menu",
    "view_orders",
    "can_register_client",
    "can_search_client",
    "can_add_item",
    "can_remove_item",
    "can_register_payment",
    "can_set_adjustment",
    "can_submit_order",
  ],
  waiter: [
    "can_add_item",
  ],
};

/**
 * Verifica si un rol específico tiene un permiso determinado.
 * @param role Rol del usuario (ej. 'admin', 'waiter')
 * @param action Acción a verificar
 */
export function hasRolePermission(role: Role | string | null | undefined, action: ActionKey): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;
  return permissions.includes(action);
}
