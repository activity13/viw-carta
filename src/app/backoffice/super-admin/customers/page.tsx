"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import AdminGuard from "@/components/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Search, Crown } from "lucide-react";
import { toast } from "sonner";

type SubscriptionPlan = "standard" | "premium";
type SubscriptionStatus =
  | "trialing"
  | "active"
  | "paused"
  | "past_due"
  | "canceled";

type RestaurantListItem = {
  _id: string;
  name: string;
  slug: string;
  plan?: SubscriptionPlan;
  subscription?: {
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
  };
  ownerId?: {
    _id: string;
    fullName?: string;
    email?: string;
    username?: string;
    role?: string;
    isActive?: boolean;
  } | null;
  activeUsersCount: number;
};

export default function SuperAdminCustomersPage() {
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<RestaurantListItem[]>([]);

  const effectiveQuery = useMemo(() => q.trim(), [q]);

  const load = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/admin/customers", {
        params: effectiveQuery ? { q: effectiveQuery } : {},
      });
      console.log("🚀 ~ page.tsx:55 ~ load ~ res:", res);
      setItems(res.data.items ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planBadge = (plan?: SubscriptionPlan) => {
    if (plan === "premium")
      return <Badge className="bg-emerald-600">Premium</Badge>;
    return <Badge variant="secondary">Standard</Badge>;
  };

  const statusBadge = (status?: SubscriptionStatus) => {
    if (!status) return <Badge variant="outline">—</Badge>;
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-600">Activo</Badge>;
      case "trialing":
        return <Badge variant="outline">Trial</Badge>;
      case "paused":
        return <Badge variant="secondary">Pausado</Badge>;
      case "past_due":
        return <Badge variant="destructive">Pago pendiente</Badge>;
      case "canceled":
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto py-10 px-4 max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
              <p className="text-sm text-muted-foreground">
                Lista de tenants y control manual de suscripción.
              </p>
            </div>
          </div>

          <Link
            href="/backoffice/super-admin"
            className="text-sm text-muted-foreground hover:underline"
          >
            Volver al panel
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Input
              placeholder="Buscar por nombre o subdominio (slug)..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button onClick={load} disabled={isLoading} className="sm:w-auto">
              {isLoading ? "Cargando..." : "Buscar"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No se encontraron clientes.
            </div>
          ) : (
            items.map((r) => {
              const plan = r.subscription?.plan ?? r.plan;
              const status = r.subscription?.status;
              const ownerLabel = r.ownerId?.email || r.ownerId?.username || "—";

              return (
                <Card key={r._id}>
                  <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{r.name}</p>
                        <Badge variant="outline" className="font-mono">
                          {r.slug}
                        </Badge>
                        {planBadge(plan)}
                        {statusBadge(status)}
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {r.activeUsersCount} usuarios activos
                        </span>
                        <span className="truncate">Owner: {ownerLabel}</span>
                        {r.ownerId?.role === "superadmin" && (
                          <span className="flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Owner superadmin
                          </span>
                        )}
                      </div>
                    </div>

                    <Link href={`/backoffice/super-admin/customers/${r._id}`}>
                      <Button variant="outline">Ver perfil</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
