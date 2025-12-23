"use client";

import Master from "@/components/master";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {session?.user?.slug || "Panel de Administración"}
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu menú, precios y disponibilidad desde aquí.
          </p>
        </div>

        <Master />
      </div>
    </div>
  );
}
