import { useMemo, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  existingImageUrl?: string | null; // URL del logo actual (fallback si no hay preview local)
  maxSizeMB?: number; // tamaño máximo (MB)
  minRatio?: number; // ancho/alto mínimo permitido (por defecto 0.5 => 1:2)
  maxRatio?: number; // ancho/alto máximo permitido (por defecto 2.0 => 2:1)
  previewMode?: "contain" | "cover";
};

export default function LogoImageUploader({
  onFileSelect,
  disabled = false,
  existingImageUrl = null,
  maxSizeMB = 5,
  minRatio = 0.5,
  maxRatio = 2.0,
  previewMode = "contain",
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ratioText = useMemo(() => {
    // minRatio=0.5 => 1:2 | maxRatio=2 => 2:1
    const toText = (r: number) =>
      r >= 1
        ? `${Math.round(r * 10) / 10}:1`
        : `1:${Math.round((1 / r) * 10) / 10}`;
    return `${toText(minRatio)} a ${toText(maxRatio)}`;
  }, [minRatio, maxRatio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    setPreview(null);
    onFileSelect(null);

    if (!file) return;

    // Validar tipo (png, jpeg, webp)
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Formato no permitido. Usa PNG, JPEG o WEBP.");
      return;
    }

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`La imagen no debe superar ${maxSizeMB} MB.`);
      return;
    }

    // Validar proporción flexible
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError("No se pudo leer la imagen. Intenta con otro archivo.");
    };
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      URL.revokeObjectURL(objectUrl);

      if (aspectRatio < minRatio || aspectRatio > maxRatio) {
        setError(`La imagen debe tener proporción entre ${ratioText} aprox.`);
        setPreview(null);
        onFileSelect(null);
        return;
      }

      // Previsualización
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      onFileSelect(file);
    };
    img.src = objectUrl;
  };

  const shownImage = preview || existingImageUrl || null;

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-sm text-white/80">Logo del Negocio</Label>

      {/* Previsualización */}
      <div className="relative w-28 h-28 flex items-center justify-center bg-white/10 border border-white/30 rounded-xl overflow-hidden">
        {shownImage ? (
          <Image
            src={shownImage}
            alt="Previsualización del logo"
            fill
            className={
              previewMode === "contain" ? "object-contain" : "object-cover"
            }
            sizes="112px"
            priority={false}
          />
        ) : (
          <span className="text-white/60 text-xs">Sin imagen</span>
        )}
      </div>

      <Input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        disabled={disabled}
        aria-disabled={disabled}
        className="cursor-pointer text-sm text-white/70 border border-white/30 bg-transparent rounded-lg px-3 py-1 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
