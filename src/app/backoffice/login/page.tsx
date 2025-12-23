"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/backoffice";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const responseLogin = await signIn("credentials", {
        redirect: false,
        username: formData.get("username"),
        password: formData.get("password"),
      });
      if (responseLogin?.error) {
        setError(responseLogin.error as string);
        setLoading(false);
        return;
      }
      if (responseLogin?.ok) router.push(callbackUrl);
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-950 via-black to-green-900">
      <Card className="w-full max-w-md mx-auto bg-green-950/90 border-4 border-green-900 rounded-2xl shadow-2xl backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white text-3xl font-extrabold tracking-wide uppercase drop-shadow-lg text-center">
            Acceso Backoffice
          </CardTitle>
          <CardDescription className="text-green-300 text-center font-mono">
            Ingresa tus credenciales para acceder a la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="username"
                  className="text-green-200 font-semibold"
                >
                  Usuario
                </Label>
                <Input
                  type="text"
                  className="bg-green-900/80 border border-green-700 text-white placeholder:text-green-300 rounded-xl px-4 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
                  id="username"
                  name="username"
                  placeholder="Tu usuario"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="text-green-200 font-semibold"
                >
                  Contraseña
                </Label>
                <Input
                  type="password"
                  className="bg-green-900/80 border border-green-700 text-white placeholder:text-green-300 rounded-xl px-4 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
                  id="password"
                  name="password"
                  placeholder="******"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="grid gap-2 mt-2">
              {error && (
                <p className="text-red-400 text-center font-semibold">
                  {error}
                </p>
              )}
              <Button
                className="bg-gradient-to-r from-green-900 via-green-800 to-green-700 border-2 border-green-300 text-yellow-300 font-bold text-xl px-6 py-3 rounded-xl shadow-lg tracking-wide uppercase hover:bg-green-700 hover:text-white hover:border-yellow-300 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-green-700 flex items-center justify-center gap-2"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Accediendo...
                  </>
                ) : (
                  "Acceder"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
