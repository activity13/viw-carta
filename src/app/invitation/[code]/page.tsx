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
import {
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <CardTitle className="text-white">Invitación no válida</CardTitle>
            <CardDescription className="text-zinc-400">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <CardTitle className="text-white">¡Registro Exitoso!</CardTitle>
            <CardDescription className="text-zinc-400">{success}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isStaffInvite = invitation?.type === "staff_invitation";

  return (
    <div className="min-h-screen bg-[#050505] py-12 px-4 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-600/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <img src="/logo-c.svg" alt="Logo" className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase font-roboto">
            {isStaffInvite ? "Únete al Equipo" : "Bienvenido a VIW Carta"}
          </h1>
          <p className="text-zinc-400 mt-2 max-w-md mx-auto">
            {isStaffInvite 
              ? `Has sido invitado a unirte a ${invitation?.restaurantName}. Completa tu perfil para empezar.`
              : "Estás a un paso de digitalizar tu restaurante. Completa tu registro."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  Información de la Cuenta
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  {isStaffInvite 
                    ? `Te unirás como ${invitation?.role?.toUpperCase()}` 
                    : "Configura tus credenciales de acceso"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-zinc-950 border-zinc-800 text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-zinc-300">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Ej. Juan Pérez"
                    className="bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-zinc-300">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="juanperez"
                    className="bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="******"
                      className="bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-zinc-300">Confirmar</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="******"
                      className="bg-zinc-950 border-zinc-800 text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={isRegistering}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
            >
              {isRegistering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "FINALIZAR REGISTRO"
              )}
            </Button>
          </div>

          {!isStaffInvite ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  Tu Restaurante
                </CardTitle>
                <CardDescription className="text-zinc-400">Datos principales de tu establecimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="text-zinc-300">Nombre</Label>
                  <Input
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                    placeholder="Restaurante"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantSlug" className="text-zinc-300">Slug (URL)</Label>
                  <Input
                    id="restaurantSlug"
                    name="restaurantSlug"
                    value={formData.restaurantSlug}
                    onChange={handleChange}
                    required
                    placeholder="mi-restaurante"
                    className="bg-zinc-950 border-zinc-800 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantDirection" className="text-zinc-300">Dirección</Label>
                  <Input
                    id="restaurantDirection"
                    name="restaurantDirection"
                    value={formData.restaurantDirection}
                    onChange={handleChange}
                    required
                    placeholder="Av. Principal 123"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantPhone" className="text-zinc-300">Teléfono</Label>
                  <Input
                    id="restaurantPhone"
                    name="restaurantPhone"
                    value={formData.restaurantPhone}
                    onChange={handleChange}
                    required
                    placeholder="+51..."
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-emerald-500">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Negocio Asociado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Building2 className="text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">{invitation?.restaurantName}</h3>
                      <p className="text-zinc-400 text-sm">Registro como colaborador {invitation?.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
                <h4 className="text-emerald-500 font-bold flex items-center gap-2">
                  <CheckCircle size={18} />
                  ¿Qué puedes hacer ahora?
                </h4>
                <ul className="space-y-3 text-zinc-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    Acceder al panel de gestión de pedidos en tiempo real.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    Visualizar y gestionar el stock del menú digital.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    Personalizar tu perfil de colaborador.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-center text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
