"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { signIn } from "next-auth/react";
import axios, { AxiosError } from "axios";
import { useTheme } from "next-themes";
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
import {
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

interface InvitationData {
  valid: boolean;
  email: string;
  restaurantName: string;
  expiresAt: string;
  notes?: string;
  type: "restaurant_registration" | "staff_invitation";
  role: string;
}

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      setSelectedTheme(theme);
    }
  }, [theme]);

  const handleThemeSelection = (themeName: "light" | "dark") => {
    setSelectedTheme(themeName);
    setTheme(themeName);
  };

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulario de registro
  const [formData, setFormData] = useState({
    // Datos del restaurante
    restaurantName: "",
    restaurantSlug: "",
    restaurantDirection: "",
    restaurantLocation: "",
    restaurantPhone: "",
    restaurantDescription: "",

    // Datos del usuario
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (code) {
      validateInvitation();
    }
  }, [code]);

  const validateInvitation = async () => {
    try {
      setIsValidating(true);
      const response = await axios.get(`/api/invitations/validate/${code}`);
      setInvitation(response.data);

      // Precargar datos de la invitación
      setFormData((prev) => ({
        ...prev,
        restaurantName: response.data.restaurantName,
        email: response.data.email,
      }));
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error || "Código de invitación no válido"
        );
      } else {
        setError("Error al validar la invitación");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones del lado cliente
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setIsRegistering(true);

      const registrationData = {
        code,
        restaurant: invitation?.type === "restaurant_registration" ? {
          name: formData.restaurantName,
          slug: formData.restaurantSlug,
          direction: formData.restaurantDirection,
          location: formData.restaurantLocation,
          phone: formData.restaurantPhone,
          description: formData.restaurantDescription,
        } : null,
        user: {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          backofficeTheme: selectedTheme,
        },
      };

      const response = await axios.post(
        "/api/invitations/register",
        registrationData
      );

      setSuccess("¡Registro exitoso! Iniciando sesión...");
      toast.success("¡Bienvenido a VIW Carta!");

      // Auto-login con NextAuth
      const signInResult = await signIn("credentials", {
        redirect: false,
        username: formData.email,
        password: formData.password,
      });

      if (signInResult?.error) {
        setError("Registro exitoso pero error al iniciar sesión. Intenta hacer login manualmente.");
        setTimeout(() => router.push("/backoffice/login"), 2000);
        return;
      }

      const redirectPath = response.data.redirectTo || "/backoffice";
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 800);
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.error || "Error al registrar");
      } else {
        setError("Error inesperado al registrar");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-foreground">Invitación no válida</CardTitle>
            <CardDescription className="text-muted-foreground">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")} className="bg-primary hover:opacity-90 text-primary-foreground w-full font-bold">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-foreground">¡Registro Exitoso!</CardTitle>
            <CardDescription className="text-muted-foreground">{success}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isStaffInvite = invitation?.type === "staff_invitation";

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Image src="/logo-c.svg" alt="Logo" width={40} height={40} />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight uppercase font-roboto">
            {isStaffInvite ? "Únete al Equipo" : "Bienvenido a VIW Carta"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {isStaffInvite 
              ? `Has sido invitado a unirte a ${invitation?.restaurantName}. Completa tu perfil para empezar.`
              : "Estás a un paso de digitalizar tu restaurante. Completa tu registro."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  Información de la Cuenta
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {isStaffInvite 
                    ? `Te unirás como ${invitation?.role?.toUpperCase()}` 
                    : "Configura tus credenciales de acceso"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/90">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted border-border text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground/90">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Ej. Juan Pérez"
                    className="bg-background border-border text-foreground focus-visible:ring-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground/90">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="juanperez"
                    className="bg-background border-border text-foreground focus-visible:ring-primary transition-colors font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground/90">Contraseña</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="******"
                      className="bg-background border-border text-foreground focus-visible:ring-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground/90">Confirmar</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="******"
                      className="bg-background border-border text-foreground focus-visible:ring-primary transition-colors"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferencia Visual */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                  <Palette className="w-5 h-5 text-primary" />
                  Preferencia Visual
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Elige el estilo visual para tu panel de administración
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Option Dark: Original */}
                  <button
                    type="button"
                    onClick={() => handleThemeSelection("dark")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                      selectedTheme === "dark"
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    {selectedTheme === "dark" && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                    <div className="w-full aspect-video rounded bg-zinc-950 p-1 mb-2 border border-zinc-800 flex flex-col gap-1 justify-between transition-transform group-hover:scale-102">
                      <div className="flex justify-between items-center pb-0.5 border-b border-zinc-800">
                        <div className="w-6 h-1 bg-zinc-850 rounded" />
                        <div className="w-2 h-2 bg-zinc-800 rounded-full" />
                      </div>
                      <div className="flex gap-1 flex-1 items-stretch py-0.5">
                        <div className="w-1/3 bg-zinc-900 rounded p-0.5 flex flex-col gap-0.5">
                          <div className="w-full h-0.5 bg-zinc-800 rounded" />
                          <div className="w-full h-0.5 bg-zinc-800 rounded" />
                        </div>
                        <div className="flex-1 bg-zinc-900 rounded p-1 flex flex-col justify-between">
                          <div className="space-y-0.5">
                            <div className="w-3/4 h-1 bg-zinc-800 rounded" />
                            <div className="w-1/2 h-0.5 bg-zinc-800 rounded" />
                          </div>
                          <div className="w-full h-2 bg-zinc-850 rounded" />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground font-roboto uppercase tracking-wider">
                      Original
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5 text-center leading-none">
                      Tema oscuro clásico
                    </span>
                  </button>

                  {/* Option Light: Luz */}
                  <button
                    type="button"
                    onClick={() => handleThemeSelection("light")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                      selectedTheme === "light"
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    {selectedTheme === "light" && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                    )}
                    <div className="w-full aspect-video rounded bg-zinc-100 p-1 mb-2 border border-zinc-200 flex flex-col gap-1 justify-between transition-transform group-hover:scale-102">
                      <div className="flex justify-between items-center pb-0.5 border-b border-zinc-200">
                        <div className="w-6 h-1 bg-zinc-350 rounded" />
                        <div className="w-2 h-2 bg-zinc-350 rounded-full" />
                      </div>
                      <div className="flex gap-1 flex-1 items-stretch py-0.5">
                        <div className="w-1/3 bg-zinc-200 rounded p-0.5 flex flex-col gap-0.5">
                          <div className="w-full h-0.5 bg-zinc-300 rounded" />
                          <div className="w-full h-0.5 bg-zinc-300 rounded" />
                        </div>
                        <div className="flex-1 bg-zinc-200 rounded p-1 flex flex-col justify-between">
                          <div className="space-y-0.5">
                            <div className="w-3/4 h-1 bg-zinc-350 rounded" />
                            <div className="w-1/2 h-0.5 bg-zinc-300 rounded" />
                          </div>
                          <div className="w-full h-2 bg-zinc-250 rounded" />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground font-roboto uppercase tracking-wider">
                      Luz (Claro)
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5 text-center leading-none">
                      Estilo Apple Claro
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={isRegistering}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-6 rounded-xl transition-all shadow-lg"
            >
              {isRegistering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "FINALIZAR REGISTRO"
              )}
            </Button>
          </div>

          {!isStaffInvite ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  Tu Restaurante
                </CardTitle>
                <CardDescription className="text-muted-foreground">Datos principales de tu establecimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="text-foreground/90">Nombre</Label>
                  <Input
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                    placeholder="Restaurante"
                    className="bg-background border-border text-foreground focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantSlug" className="text-foreground/90">Slug (URL)</Label>
                  <Input
                    id="restaurantSlug"
                    name="restaurantSlug"
                    value={formData.restaurantSlug}
                    onChange={handleChange}
                    required
                    placeholder="mi-restaurante"
                    className="bg-background border-border text-foreground font-mono focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantDirection" className="text-foreground/90">Dirección</Label>
                  <Input
                    id="restaurantDirection"
                    name="restaurantDirection"
                    value={formData.restaurantDirection}
                    onChange={handleChange}
                    required
                    placeholder="Av. Principal 123"
                    className="bg-background border-border text-foreground focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantPhone" className="text-foreground/90">Teléfono</Label>
                  <Input
                    id="restaurantPhone"
                    name="restaurantPhone"
                    value={formData.restaurantPhone}
                    onChange={handleChange}
                    required
                    placeholder="+51..."
                    className="bg-background border-border text-foreground focus-visible:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              <Card className="bg-card border-border border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Negocio Asociado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Building2 className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-bold text-xl">{invitation?.restaurantName}</h3>
                      <p className="text-muted-foreground text-sm">Registro como colaborador {invitation?.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                <h4 className="text-primary font-bold flex items-center gap-2">
                  <CheckCircle size={18} />
                  ¿Qué puedes hacer ahora?
                </h4>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Acceder al panel de gestión de pedidos en tiempo real.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Visualizar y gestionar el stock del menú digital.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Personalizar tu perfil de colaborador.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-center text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
