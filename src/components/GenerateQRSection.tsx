"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);

  // 🔹 Descargar QR (usa el endpoint de descarga)
  const handleDownload = async () => {
    try {
      setLoading(true);
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

      toast.success("QR descargado correctamente");
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 px-8 rounded-2xl bg-[#0f3d2e] text-white shadow-lg max-w-md mx-auto w-full">
      {/* Previsualización */}
      <div className="relative px-2 w-64 h-64 border-2 border-white/20 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
        {existingImageUrl ? (
          <Image
            src={existingImageUrl}
            alt="Código QR generado"
            fill
            className="object-contain bg-white p-2"
            unoptimized
          />
        ) : (
          <div className="text-center p-4 text-white/50">
            <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Sube un marco QR para generar tu código automáticamente.
            </p>
          </div>
        )}
      </div>

      {/* Botón de Descarga */}
      <Button
        onClick={handleDownload}
        disabled={loading || !existingImageUrl}
        variant="outline"
        className="w-full bg-transparent border-white text-white hover:bg-white hover:text-[#0f3d2e] transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Descargar QR
      </Button>

      <p className="text-xs text-center text-white/60 max-w-[250px]">
        Este es el código final que verán tus clientes. Se actualiza
        automáticamente al cambiar el marco.
      </p>
    </div>
  );
}
