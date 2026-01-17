"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import axios, { AxiosError } from "axios";
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
  Mail,
  Building2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface InvitationData {
  valid: boolean;
  email: string;
  restaurantName: string;
  expiresAt: string;
  notes?: string;
}

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

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
        restaurant: {
          name: formData.restaurantName,
          slug: formData.restaurantSlug,
          direction: formData.restaurantDirection,
          location: formData.restaurantLocation,
          phone: formData.restaurantPhone,
          description: formData.restaurantDescription,
        },
        user: {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        },
      };

      const response = await axios.post(
        "/api/invitations/register",
        registrationData
      );

      setSuccess("¡Registro exitoso! Iniciando sesión...");
      toast.success("¡Bienvenido a VIW Carta!");

      // Auto-login con NextAuth
      // NextAuth espera 'username' pero acepta email también en el authorize
      const signInResult = await signIn("credentials", {
        redirect: false,
        username: formData.email, // NextAuth usa 'username' pero el authorize acepta email
        password: formData.password,
      });

      console.log("SignIn result:", signInResult);

      if (signInResult?.error) {
        console.error("Error en signIn:", signInResult.error);
        setError(
          "Registro exitoso pero error al iniciar sesión. Intenta hacer login manualmente."
        );
        setTimeout(() => router.push("/backoffice/login"), 2000);
        return;
      }

      // Verificar que el signIn fue exitoso
      if (!signInResult?.ok) {
        console.error("SignIn no fue exitoso:", signInResult);
        setError(
          "Error al iniciar sesión automáticamente. Redirigiendo al login..."
        );
        setTimeout(() => router.push("/backoffice/login"), 2000);
        return;
      }

      // Redirigir al onboarding con navegación completa para asegurar que las cookies de sesión se carguen
      const redirectPath = response.data.redirectTo || "/backoffice";

      // Usar window.location.href para forzar una recarga completa con la sesión establecida
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

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-muted-foreground">Validando invitación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <Card className="w-full max-w-md border-destructive/20">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">
              Invitación no válida
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4 hover:cursor-pointer hover:bg-green-500"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md border-emerald-200">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <CardTitle className="text-emerald-700">
              ¡Registro Exitoso!
            </CardTitle>
            <CardDescription>{success}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido a VIW Carta!
          </h1>
          <p className="text-gray-600 mt-2">
            Completa tu registro para empezar
          </p>
        </div>

        {/* Invitation Info */}
        <Card className="mb-8 border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-emerald-800">
                  Invitación para: {invitation?.restaurantName}
                </p>
                <p className="text-sm text-emerald-600">{invitation?.email}</p>
                {invitation?.notes && (
                  <p className="text-sm text-emerald-700 mt-2 bg-emerald-100/50 p-2 rounded border border-emerald-200">
                    <span className="font-medium">Mensaje:</span>{" "}
                    {invitation.notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className="border-emerald-200 text-emerald-700"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Expira:{" "}
                  {invitation
                    ? new Date(invitation.expiresAt).toLocaleDateString()
                    : ""}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Restaurant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Información del Restaurante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Nombre del Restaurante</Label>
                  <Input
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Restaurante El Buen Sabor"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantSlug">Subdominio único (URL)</Label>
                  <Input
                    id="restaurantSlug"
                    name="restaurantSlug"
                    value={formData.restaurantSlug}
                    onChange={handleChange}
                    required
                    placeholder="ej: restaurante-mar-azul"
                    pattern="[a-z0-9-]+"
                    title="Solo letras minúsculas, números y guiones"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tu menú estará disponible en: {formData.restaurantSlug}
                    .viw-carta.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantDirection">Dirección</Label>
                  <Input
                    id="restaurantDirection"
                    name="restaurantDirection"
                    value={formData.restaurantDirection}
                    onChange={handleChange}
                    required
                    placeholder="Av. Los Olivos 456, Centro"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantPhone">Teléfono</Label>
                  <Input
                    id="restaurantPhone"
                    name="restaurantPhone"
                    value={formData.restaurantPhone}
                    onChange={handleChange}
                    required
                    placeholder="+51 999 888 777"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantLocation">
                    Google Maps (opcional)
                  </Label>
                  <Input
                    id="restaurantLocation"
                    name="restaurantLocation"
                    value={formData.restaurantLocation}
                    onChange={handleChange}
                    placeholder="https://maps.google.com/..."
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantDescription">
                    Descripción (opcional)
                  </Label>
                  <Textarea
                    id="restaurantDescription"
                    name="restaurantDescription"
                    value={formData.restaurantDescription}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Breve descripción de tu restaurante..."
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Usuario Administrador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="María Pérez"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="mariaperez"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled // Email viene de la invitación
                    className="bg-muted/30 border-2 border-muted-foreground/10 text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Repite tu contraseña"
                    className="bg-card border-2 border-muted-foreground/20 hover:border-muted-foreground/40 focus:border-primary/60 shadow-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isRegistering}
              className="min-w-48 bg-emerald-600 hover:bg-emerald-700"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Completar Registro"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
