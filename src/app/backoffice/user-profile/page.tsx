"use client";

import React, { useMemo, useState, type FormEvent } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { KeyRound, Loader2, User } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UserProfilePage() {
  const { data: session, status } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const user = session?.user;
  const userSummary = useMemo(() => {
    return {
      id: user?.id ?? "—",
      email: user?.email ?? "—",
      role: user?.role ?? "—",
      restaurantId: user?.restaurantId ?? "—",
      slug: user?.slug ?? "—",
      username: user?.username ?? "—",
    };
  }, [user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      const res = await fetch("/api/backoffice/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error ?? "No se pudo cambiar la contraseña");
        return;
      }

      toast.success(data?.message ?? "Contraseña actualizada");

      await signOut({ callbackUrl: "/backoffice/login" });
    } catch (error) {
      console.error(error);
      toast.error("Error inesperado al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <User className="h-5 w-5" />
              Perfil de usuario
            </CardTitle>
            <CardDescription>
              Información de tu cuenta en el Backoffice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando perfil...
              </div>
            ) : (
              <div className="grid gap-3 text-sm">
                <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-medium break-all">
                    {userSummary.id}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium break-all">
                    {userSummary.email}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2">
                    <span className="text-muted-foreground">Rol</span>
                    <span className="font-medium">{userSummary.role}</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2">
                    <span className="text-muted-foreground">Negocio</span>
                    <span className="font-medium break-all">
                      {userSummary.slug}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2">
                    <span className="text-muted-foreground">User</span>
                    <span className="font-medium break-all">
                      {userSummary.username}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2">
                  <span className="text-muted-foreground">Restaurant ID</span>
                  <span className="font-medium break-all">
                    {userSummary.restaurantId}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <KeyRound className="h-5 w-5" />
              Cambiar contraseña
            </CardTitle>
            <CardDescription>
              Mínimo 6 caracteres. Al guardar se cerrará tu sesión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-slate-700">
                  Contraseña actual
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-700">
                  Nueva contraseña
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword" className="text-slate-700">
                  Confirmar nueva contraseña
                </Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </span>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
