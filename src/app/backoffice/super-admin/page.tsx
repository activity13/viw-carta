"use client";

import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import AdminGuard from "@/components/AdminGuard";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Users,
  Building2,
  Mail,
  Calendar,
  Clock,
  Plus,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface Invitation {
  _id: string;
  code: string;
  email: string;
  restaurantName: string;
  status: "pending" | "used" | "expired";
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  notes: string;
}

interface Stats {
  totalRestaurants: number;
  totalUsers: number;
  pendingInvitations: number;
  usedInvitations: number;
}

export default function SuperAdminPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRestaurants: 0,
    totalUsers: 0,
    pendingInvitations: 0,
    usedInvitations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Formulario nueva invitación
  const [newInvitation, setNewInvitation] = useState({
    email: "",
    restaurantName: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invitationsRes, statsRes] = await Promise.all([
        axios.get("/api/admin/invitations"),
        axios.get("/api/admin/stats"),
      ]);
      setInvitations(invitationsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const createInvitation = async () => {
    if (!newInvitation.email || !newInvitation.restaurantName) {
      toast.error("Email y nombre del restaurante son obligatorios");
      return;
    }

    try {
      setIsCreating(true);
      const response = await axios.post(
        "/api/admin/invitations",
        newInvitation
      );
      toast.success(`Invitación creada con código: ${response.data.code}`);
      setNewInvitation({ email: "", restaurantName: "", notes: "" });
      loadData(); // Recargar la lista
    } catch (error: unknown) {
      let errorMessage = "Error al crear la invitación";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (
        error instanceof AxiosError &&
        typeof error.response?.data?.error === "string"
      ) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    const inviteUrl = `${window.location.origin}/invitation/${code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedCode(code);
      toast.success("URL de invitación copiada al portapapeles");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Error al copiar al portapapeles");
    }
  };

  const deleteInvitation = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta invitación?")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/invitations/${id}`);
      toast.success("Invitación eliminada");
      loadData();
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Error al eliminar la invitación");
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (isExpired && status === "pending") {
      return <Badge variant="destructive">Expirado</Badge>;
    }

    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>;
      case "used":
        return <Badge variant="default">Usado</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto py-10 px-4 max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Panel de Administración
              </h1>
              <p className="text-muted-foreground">
                Centro de control VIW • Gestión de clientes y invitaciones
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Restaurantes
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRestaurants}</div>
              <p className="text-xs text-muted-foreground">Total registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Invitaciones
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingInvitations}
              </div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversiones
              </CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usedInvitations}</div>
              <p className="text-xs text-muted-foreground">Usadas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Crear Nueva Invitación */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nueva Invitación
                </CardTitle>
                <CardDescription>
                  Crea un código único para invitar a un nuevo restaurante.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email del Cliente</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="gerente@restaurante.com"
                    value={newInvitation.email}
                    onChange={(e) =>
                      setNewInvitation({
                        ...newInvitation,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nombre del Restaurante</Label>
                  <Input
                    id="restaurantName"
                    placeholder="Pizzería La K"
                    value={newInvitation.restaurantName}
                    onChange={(e) =>
                      setNewInvitation({
                        ...newInvitation,
                        restaurantName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Información adicional..."
                    rows={3}
                    value={newInvitation.notes}
                    onChange={(e) =>
                      setNewInvitation({
                        ...newInvitation,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={createInvitation}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? "Creando..." : "Crear Invitación"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Invitaciones */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Invitaciones Recientes
                </CardTitle>
                <CardDescription>
                  Gestiona los códigos de invitación enviados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse h-16 bg-muted rounded-lg"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation._id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {invitation.code}
                            </Badge>
                            {getStatusBadge(
                              invitation.status,
                              invitation.expiresAt
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(invitation.code)}
                              disabled={invitation.status !== "pending"}
                            >
                              {copiedCode === invitation.code ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteInvitation(invitation._id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-sm">
                          <p className="font-medium">
                            {invitation.restaurantName}
                          </p>
                          <p className="text-muted-foreground">
                            {invitation.email}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              invitation.createdAt
                            ).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expira:{" "}
                            {new Date(
                              invitation.expiresAt
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        {invitation.notes && (
                          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {invitation.notes}
                          </p>
                        )}
                      </div>
                    ))}

                    {invitations.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay invitaciones creadas aún.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
