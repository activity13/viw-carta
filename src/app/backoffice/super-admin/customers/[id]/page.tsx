"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import AdminGuard from "@/components/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Layers, UtensilsCrossed, ReceiptText } from "lucide-react";

type SubscriptionPlan = "standard" | "premium";
type SubscriptionStatus =
  | "trialing"
  | "active"
  | "paused"
  | "past_due"
  | "canceled";

type Restaurant = {
  _id: string;
  name: string;
  slug: string;
  direction?: string;
  phone?: string;
  plan?: SubscriptionPlan;
  subscription?: {
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
    startedAt?: string | null;
    trialEndsAt?: string | null;
    currentPeriodEnd?: string | null;
    notes?: string;
  };
};

type UserRow = {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  role: "superadmin" | "admin" | "staff" | "viewer";
  isActive: boolean;
};

function toInputDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SuperAdminCustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [counts, setCounts] = useState<{
    categories: number;
    meals: number;
    orders: number;
  } | null>(null);

  const [plan, setPlan] = useState<SubscriptionPlan>("standard");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [startedAt, setStartedAt] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [auditNote, setAuditNote] = useState("");

  const hydrateFormFromRestaurant = (r: Restaurant) => {
    const sub = r.subscription ?? {};
    setPlan((sub.plan ?? r.plan ?? "standard") as SubscriptionPlan);
    setStatus((sub.status ?? "active") as SubscriptionStatus);
    setStartedAt(toInputDate(sub.startedAt ?? null));
    setTrialEndsAt(toInputDate(sub.trialEndsAt ?? null));
    setCurrentPeriodEnd(toInputDate(sub.currentPeriodEnd ?? null));
    setNotes(typeof sub.notes === "string" ? sub.notes : "");
  };

  useEffect(() => {
    if (!restaurant) return;
    hydrateFormFromRestaurant(restaurant);
  }, [restaurant]);

  const load = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/admin/customers/${id}`);
      const r = res.data.restaurant as Restaurant;
      setRestaurant(r);
      setUsers(res.data.users ?? []);
      setCounts(res.data.counts ?? null);
      hydrateFormFromRestaurant(r);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el cliente");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveSubscription = async () => {
    try {
      const res = await axios.patch(`/api/admin/customers/${id}`, {
        subscription: {
          plan,
          status,
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
          currentPeriodEnd: currentPeriodEnd
            ? new Date(currentPeriodEnd).toISOString()
            : null,
          notes,
        },
        note: auditNote,
      });
      const r = res.data.restaurant as Restaurant;
      setRestaurant(r);
      hydrateFormFromRestaurant(r);
      setAuditNote("");
      toast.success("Suscripción actualizada");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar suscripción");
    }
  };

  const patchUser = async (
    userId: string,
    patch: { isActive?: boolean; role?: UserRow["role"] }
  ) => {
    try {
      const res = await axios.patch(`/api/admin/users/${userId}`, patch);
      const updated = res.data.user as UserRow;
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, ...updated } : u))
      );
      toast.success("Usuario actualizado");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar usuario");
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
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight truncate">
                {restaurant?.name ?? "Cliente"}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {restaurant?.slug ? `Subdominio: ${restaurant.slug}` : ""}
              </p>
            </div>
          </div>

          <Link
            href="/backoffice/super-admin/customers"
            className="text-sm text-muted-foreground hover:underline"
          >
            Volver a clientes
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : !restaurant ? (
          <div className="text-sm text-muted-foreground">
            Cliente no encontrado.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Suscripción (manual)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Select
                        value={plan}
                        onValueChange={(v) => setPlan(v as SubscriptionPlan)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={status}
                        onValueChange={(v) =>
                          setStatus(v as SubscriptionStatus)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="trialing">Trial</SelectItem>
                          <SelectItem value="paused">Pausado</SelectItem>
                          <SelectItem value="past_due">
                            Pago pendiente
                          </SelectItem>
                          <SelectItem value="canceled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Inicio</Label>
                      <Input
                        type="date"
                        value={startedAt}
                        onChange={(e) => setStartedAt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fin trial</Label>
                      <Input
                        type="date"
                        value={trialEndsAt}
                        onChange={(e) => setTrialEndsAt(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fin periodo</Label>
                      <Input
                        type="date"
                        value={currentPeriodEnd}
                        onChange={(e) => setCurrentPeriodEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notas internas</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nota de auditoría (opcional)</Label>
                    <Input
                      placeholder="Ej: upgrade por pago confirmado"
                      value={auditNote}
                      onChange={(e) => setAuditNote(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={saveSubscription}>Guardar</Button>
                    <Button variant="outline" onClick={load}>
                      Recargar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Métricas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="w-4 h-4" /> Categorías
                    </span>
                    <span className="font-medium">
                      {counts?.categories ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <UtensilsCrossed className="w-4 h-4" /> Platos
                    </span>
                    <span className="font-medium">{counts?.meals ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <ReceiptText className="w-4 h-4" /> Órdenes
                    </span>
                    <span className="font-medium">{counts?.orders ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Usuarios del tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No hay usuarios asociados.
                  </div>
                ) : (
                  users.map((u) => (
                    <div
                      key={u._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">
                            {u.fullName || u.username || u.email || "Usuario"}
                          </p>
                          <Badge variant="outline">{u.role}</Badge>
                          {u.isActive ? (
                            <Badge className="bg-emerald-600">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email || ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            patchUser(u._id, { role: v as UserRow["role"] })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">viewer</SelectItem>
                            <SelectItem value="staff">staff</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="superadmin">
                              superadmin
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          onClick={() =>
                            patchUser(u._id, { isActive: !u.isActive })
                          }
                        >
                          {u.isActive ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                )
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminGuard>
  );
}
