"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, QrCode } from "lucide-react";

interface GenerateQRSectionProps {
  businessId: string;
  businessSlug: string;
  existingImageUrl?: string | null;
}

export default function GenerateQRSection({
  businessId,
  businessSlug,
  existingImageUrl,
}: GenerateQRSectionProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  // 🔹 Generar QR (llama al endpoint de generación)
  const handleGenerate = async () => {
    console.log("Generando QR para el negocio:", existingImageUrl);
    if (existingImageUrl) {
      confirm(
        "Ya existe un código QR generado para este negocio. ¿estás seguro de que quieres generar uno nuevo?"
      );
    }
    setLoading(true);
    setStatus("Generando QR...");
    try {
      const res = await fetch(`/api/qr/generate/${businessId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error generando el QR");

      setQrUrl(data.qrPath);
      setStatus(data.message);
    } catch (err) {
      setStatus(
        `❌ ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Descargar QR (usa el endpoint de descarga)
  const handleDownload = async () => {
    try {
      setStatus("Descargando QR...");
      const res = await fetch(`/api/qr/download/${businessId}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al descargar el QR");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${businessSlug}-qr.png`;
      link.click();
      window.URL.revokeObjectURL(url);

      setStatus("✅ QR descargado correctamente");
    } catch (err) {
      setStatus(
        `❌ ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    }
  };
  const shownImage = qrUrl || existingImageUrl || null;

  return (
    <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-[#0f3d2e] text-white shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-semibold">Generador de QR</h2>

      {/* Botones */}
      <div className="flex gap-4">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-[#0f3d2e] px-5 py-2 rounded-xl font-medium hover:bg-opacity-90 transition"
        >
          <QrCode className="w-5 h-5" />
          {loading ? "Generando..." : "Generar QR"}
        </button>

        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-2 bg-transparent border border-white px-5 py-2 rounded-xl font-medium hover:bg-white hover:text-[#0f3d2e] transition"
        >
          <Download className="w-5 h-5" />
          Descargar
        </button>
      </div>

      {/* Estado */}
      {status && (
        <p
          className={`text-sm ${
            status.startsWith("❌") ? "text-red-400" : "text-green-400"
          }`}
        >
          {status}
        </p>
      )}

      {/* Previsualización */}
      {shownImage && (
        <div className="relative w-64 h-64 mt-4 border-2 border-white rounded-xl overflow-hidden">
          <Image
            src={shownImage}
            alt="Código QR generado"
            fill
            className="object-contain bg-white p-2 rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
