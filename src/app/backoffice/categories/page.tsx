"use client";

import React from "react";
import CategoryUI from "@/components/categoryUI";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";

export default function CategoriesPage() {
  // Aquí puedes obtener el restaurantId de alguna manera, por ejemplo, de la sesión o props

  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;
  const { can } = usePermissions();
  const isAdmin = can("edit_menu");

  if (!isAdmin) {
    return (
      <AccessDeniedCard 
        message="No tienes los permisos necesarios para gestionar el menú. Esta sección es exclusiva para administradores."
      />
    );
  }

  if (!restaurantId) return null;

  return (
    <>
      <CategoryUI restaurantId={restaurantId} />
    </>
  );
}
