"use client";

import React from "react";
import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { ActionKey } from "@/config/role-permissions";

interface RoleGuardProps {
  action: ActionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ action, children, fallback = null }: RoleGuardProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    // Evitar parpadeos mientras carga la sesión
    return null; 
  }

  if (!can(action)) {
    // Renderiza el contenido alternativo o nada si el usuario no tiene permisos
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
