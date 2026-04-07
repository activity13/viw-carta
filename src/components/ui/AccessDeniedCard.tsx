"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AccessDeniedCardProps {
  title?: string;
  message?: string;
  returnUrl?: string;
  returnLabel?: string;
}

export function AccessDeniedCard({
  title = "Acceso Denegado",
  message = "No tienes los permisos necesarios para acceder a esta sección.",
  returnUrl = "/backoffice",
  returnLabel = "Volver al Panel",
}: AccessDeniedCardProps) {
  return (
    <div className="container mx-auto py-20 px-4 max-w-md animate-in fade-in duration-500">
      <Card className="border-destructive/20 bg-card/50 backdrop-blur-sm shadow-md">
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-5 border border-destructive/20">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-destructive mb-2 uppercase font-roboto tracking-tight">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm mb-8 font-mono">
            {message}
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = returnUrl)}
            className="w-full rounded-full border-destructive/30 hover:bg-destructive/10 hover:text-destructive font-mono"
          >
            {returnLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
