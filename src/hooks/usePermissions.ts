"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { ActionKey, hasRolePermission, Role } from "@/config/role-permissions";

export function usePermissions() {
  const { data: session, status } = useSession();
  
  const role = session?.user?.role as Role | undefined;
  
  /**
   * Verifica si el usuario autenticado tiene el permiso especificado
   * @param action Acción a verificar
   */
  const can = (action: ActionKey) => {
    return hasRolePermission(role, action);
  };
  
  const hasRole = (allowedRoles: Role[]) => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };
  
  return {
    can,
    hasRole,
    role,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
