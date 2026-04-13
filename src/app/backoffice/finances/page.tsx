import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FinancesClient from "./FinancesClient";

export default async function FinancesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/backoffice/login");
  }

  // Verificar que tenga el rol adecuado para las finanzas (admin o superadmin)
  const role = session.user?.role;
  if (role !== "admin" && role !== "superadmin") {
    redirect("/backoffice");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Panel Financiero</h1>
        <p className="text-muted-foreground mb-8 border-b border-border pb-4">
          Control de caja, reporte de utilidades y movimientos.
        </p>
        
        <FinancesClient />
      </div>
    </div>
  );
}
