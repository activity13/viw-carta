"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { data: session, status } = useSession();

  // Mientras carga la sesión
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Verificando permisos...
          </p>
        </div>
      </div>
    );
  }

  // Si no hay sesión o el rol no es superadmin
  if (!session?.user || session.user.role !== "superadmin") {
    return (
      fallback || (
        <div className="container mx-auto py-20 px-4 max-w-md">
          <Card className="border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">
                Acceso Denegado
              </CardTitle>
              <CardDescription>
                No tienes permisos para acceder a esta sección.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Esta área está reservada para el personal autorizado de VIW.
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  // Si es superadmin, renderizar el contenido
  return <>{children}</>;
}
