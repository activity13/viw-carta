"use client";

// Bibliotecas de React
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Componentes y hooks encargados del sistema
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";

// Bibliotecas de conexión
import axios from "axios";

// Iconos de Lucide React
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  UserX, 
  Edit2, 
  Loader2, 
  CheckCircle2,
  XCircle,
  User,
  Clock,
  Send,
} from "lucide-react";

// Bibliotecas de efectos visuales
import { toast } from "sonner";

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamMember {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  _id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  code: string;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { can, role } = usePermissions();
  const isAdmin = can("manage_team");
  const isSuperAdmin = role === "superadmin";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "waiter",
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/backoffice/team");
      setTeam(data.users || []);
      setInvitations(data.invitations || []);
      setOwnerId(data.ownerId || null);
    } catch (error) {
      console.error("Error fetching team:", error);
      toast.error("Error al cargar el equipo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTeam();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <AccessDeniedCard 
        message="No tienes los permisos necesarios para gestionar el equipo. Esta sección es exclusiva para administradores."
      />
    );
  }

  const handleOpenAddDialog = () => {
    setEditingMember(null);
    setForm({
      fullName: "",
      email: "",
      role: "waiter",
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setForm({
      fullName: member.fullName,
      email: member.email,
      role: member.role,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingMember) {
        await axios.patch(`/api/backoffice/team/${editingMember._id}`, {
          fullName: form.fullName,
          role: form.role,
        });
        toast.success("Colaborador actualizado");
      } else {
        const { data } = await axios.post("/api/backoffice/team", form);
        if (data.message && data.message.includes("error al enviar")) {
          toast.warning(data.message, { duration: 10000 });
        } else {
          toast.success("Invitación enviada exitosamente");
        }
      }
      setDialogOpen(false);
      fetchTeam();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error : "Error al procesar la solicitud");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (member: TeamMember) => {
    try {
      const message = member.isActive 
        ? "¿Estás seguro de desactivar a este colaborador? El registro se mantendrá en el sistema pero no podrá acceder."
        : `¿Estás seguro de que deseas activar a ${member.fullName}?`;

      if (!confirm(message)) return;

      await axios.patch(`/api/backoffice/team/${member._id}`, {
        isActive: !member.isActive,
      });
      toast.success(`Colaborador ${!member.isActive ? "activado" : "desactivado"}`);
      fetchTeam();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Error al cambiar el estado");
    }
  };

  const handleCancelInvitation = async (id: string) => {
    if (!confirm("¿Estás seguro de cancelar esta invitación?")) return;

    try {
      await axios.delete(`/api/backoffice/team/invitations/${id}`);
      toast.success("Invitación cancelada");
      fetchTeam();
    } catch (error) {
      console.error("Error canceling invitation:", error);
      toast.error(axios.isAxiosError(error) ? error.response?.data?.error : "Error al cancelar");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Admin</Badge>;
      case "staff":
        return <Badge variant="secondary">Staff</Badge>;
      case "waiter":
        return <Badge variant="outline">Mesero</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-10 w-10 text-primary" />
            Equipo
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los perfiles y permisos de tus colaboradores.
          </p>
        </div>
        <Button 
          onClick={handleOpenAddDialog}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar Colaborador
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-muted/50 border border-border mb-4">
          <TabsTrigger value="active" className="gap-2">
            <Users size={14} />
            Activos ({team.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock size={14} />
            Pendientes ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground animate-pulse">Cargando equipo...</p>
                </div>
              ) : team.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No hay colaboradores activos</h3>
                    <p className="text-muted-foreground">Tus colaboradores aparecerán aquí cuando acepten la invitación.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[300px]">Colaborador</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((member) => (
                      <TableRow key={member._id} className="border-border hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                              <User size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{member.fullName}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail size={12} /> {member.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(member.role)}
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex items-center gap-2 transition-opacity hover:opacity-80"
                          >
                            {member.isActive ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium text-primary">Activo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-destructive" />
                                <span className="text-xs font-medium text-destructive">Inactivo</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {member._id !== ownerId && (isSuperAdmin || member.role !== 'superadmin') && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOpenEditDialog(member)}
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Editar colaborador"
                              >
                                <Edit2 size={14} />
                              </Button>
                            )}
                            {member._id !== ownerId && member._id !== session?.user?.id && (isSuperAdmin || member.role !== 'superadmin') && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => toggleStatus(member)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title={member.isActive ? "Desactivar colaborador" : "Activar colaborador"}
                              >
                                <UserX size={14} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground animate-pulse">Cargando invitaciones...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <Send className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No hay invitaciones pendientes</h3>
                    <p className="text-muted-foreground">Envía una invitación para sumar nuevos colaboradores.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="w-[300px]">Email</TableHead>
                      <TableHead>Rol asignado</TableHead>
                      <TableHead>Enviada el</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invite) => (
                      <TableRow key={invite._id} className="border-border hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          {invite.email}
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(invite.role)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-xs text-primary font-mono border border-border">
                            {invite.code}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCancelInvitation(invite._id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Cancelar invitación"
                          >
                            <XCircle size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {editingMember ? <Edit2 className="h-5 w-5 text-primary" /> : <Send className="h-5 w-5 text-primary" />}
              {editingMember ? "Editar Colaborador" : "Invitar Colaborador"}
            </DialogTitle>
            <DialogDescription>
              {editingMember 
                ? "Actualiza la información y permisos de este miembro del equipo." 
                : "Se enviará un correo electrónico con un enlace de registro al colaborador."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre (Opcional)</Label>
              <Input
                id="fullName"
                placeholder="Ej. Juan Pérez"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="bg-background border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={!!editingMember}
                className="bg-background border-border focus:ring-primary"
              />
              {!editingMember && (
                <p className="text-[10px] text-muted-foreground">
                  Asegúrate de que el correo sea correcto. No se puede cambiar después de enviada la invitación.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol en el Negocio</Label>
              <Select 
                value={form.role} 
                onValueChange={(value) => setForm({ ...form, role: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="staff">Staff / Cocina</SelectItem>
                  <SelectItem value="waiter">Mesero</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Shield className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                  <span>
                    {form.role === 'admin' && "Tiene acceso total a la configuración del negocio y gestión de equipo."}
                    {form.role === 'staff' && "Acceso a la gestión de productos, categorías y pedidos."}
                    {form.role === 'waiter' && "Acceso limitado a la gestión de pedidos y visualización del menú."}
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
              >
                {formLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : editingMember ? (
                  "Guardar Cambios"
                ) : (
                  "Enviar Invitación"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
