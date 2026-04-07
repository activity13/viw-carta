"use client";

import * as React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { ActionKey, Role } from "@/config/role-permissions";

interface RoleGateProps {
  children: React.ReactNode;
  /**
   * Acción específica que el usuario debe tener permitida.
   */
  action?: ActionKey;
  /**
   * Roles explícitos requeridos para ver el contenido (ej. ["admin", "superadmin"]).
   * Si se provee, se debe cumplir esta condición o la de `action`.
   */
  allowedRoles?: Role[];
  /**
   * Componente a mostrar si el usuario no tiene permisos (por defecto es nulo).
   */
  fallback?: React.ReactNode;
}

export function RoleGate({
  children,
  action,
  allowedRoles,
  fallback = null,
}: RoleGateProps) {
  const { can, hasRole, isLoading } = usePermissions();

  if (isLoading) return null;

  let isAllowed = false;

  if (action && can(action)) {
    isAllowed = true;
  }
  
  if (allowedRoles && hasRole(allowedRoles)) {
    isAllowed = true;
  }

  // Si no se pasó ni action ni allowedRoles, permitimos el render por defecto
  if (!action && !allowedRoles) {
    isAllowed = true;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
