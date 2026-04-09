"use client";

import React from "react";
import ClientUI from "@/components/clients/ClientUI";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";
import { Loader2 } from "lucide-react";

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const restaurantId = session?.user?.restaurantId;
  const { hasRole, isLoading } = usePermissions();
  
  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isAdmin = hasRole(["superadmin", "admin"]);

  if (!isAdmin) {
    return (
      <AccessDeniedCard 
        message="No tienes los permisos necesarios para gestionar la base de clientes. Esta sección requiere acceso administrativo."
      />
    );
  }

  if (!restaurantId) return null;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <ClientUI restaurantId={restaurantId} />
    </div>
  );
}
