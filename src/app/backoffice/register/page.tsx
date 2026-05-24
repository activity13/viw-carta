"use client";

import Axios, { AxiosError } from "axios";
import { FormEvent, useState } from "react";

export default function SignUp() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Restaurante
      const restaurantData = {
        name: formData.get("restaurantName"),
        slug: formData.get("restaurantSlug"),
        direction: formData.get("restaurantDirection"),
        location: formData.get("restaurantLocation"),
        phone: formData.get("restaurantPhone"),
        description: formData.get("restaurantDescription"),
        image: formData.get("restaurantImage"),
      };

      // Usuario admin
      const userData = {
        fullName: formData.get("fullName"),
        username: formData.get("username"),
        email: formData.get("email"),
        password: formData.get("password"),
      };

      const res = await Axios.post("/api/auth/signup", {
        restaurant: restaurantData,
        user: userData,
      });

      setSuccess(res.data.message || "Registro exitoso");
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(
          error.response?.data?.error ||
            "Error desconocido al registrar restaurante"
        );
      } else {
        setError("Error inesperado");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-black/80 border-4 border-green-900 rounded-2xl shadow-2xl px-8 py-10 w-full max-w-xl flex flex-col gap-6"
      >
        <h1 className="text-3xl font-extrabold text-green-300 tracking-wide mb-2 text-center uppercase drop-shadow-lg">
          Registro de Restaurante
        </h1>
        <fieldset className="border-none flex flex-col gap-4">
          <legend className="text-lg text-green-200 font-semibold mb-2 text-center">
            Configuración básica
          </legend>
          <input
            type="text"
            name="restaurantName"
            placeholder="Nombre del restaurante"
            required
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="text"
            name="restaurantSlug"
            placeholder="Slug único (ej: mi-restaurante)"
            required
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="text"
            name="restaurantDirection"
            placeholder="Dirección"
            required
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="text"
            name="restaurantLocation"
            placeholder="URL de ubicación (Google Maps, opcional)"
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="text"
            name="restaurantPhone"
            placeholder="Teléfono"
            required
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="text"
            name="restaurantDescription"
            placeholder="Descripción (opcional)"
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="text"
            name="restaurantImage"
            placeholder="URL de imagen (opcional)"
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </fieldset>
        <fieldset className="border-none flex flex-col gap-4 mt-2">
          <legend className="text-lg text-green-200 font-semibold mb-2 text-center">
            Usuario administrador
          </legend>
          <input
            type="text"
            name="fullName"
            placeholder="Nombre completo"
            required
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="text"
            name="username"
            placeholder="Usuario para iniciar sesión"
            required
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            required
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            required
            className="bg-green-950/60 border-2 border-green-900 text-white placeholder:text-green-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </fieldset>
        {error && (
          <p className="text-red-400 text-center font-semibold">{error}</p>
        )}
        {success && (
          <p className="text-green-400 text-center font-semibold">{success}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-green-900 via-green-800 to-green-700 border-2 border-green-300 text-yellow-300 font-bold text-xl px-6 py-3 rounded-xl shadow-lg tracking-wide uppercase hover:bg-green-700 hover:text-white hover:border-yellow-300 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-green-700"
        >
          {loading ? "Registrando..." : "Registrar restaurante"}
        </button>
      </form>
    </div>
  );
}
