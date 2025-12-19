"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadThing } from "@/utils/uploadthing";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface FrameUploaderProps {
  slug: string;
  onUploadComplete: (url: string) => void;
}

export function FrameUploader({ slug, onUploadComplete }: FrameUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("frameUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        toast.success("Marco QR actualizado correctamente");
        onUploadComplete(res[0].url);
        setIsDialogOpen(false);
        setSelectedFile(null);
      }
    },
    onUploadError: (error: Error) => {
      toast.error(`Error al subir: ${error.message}`);
      setIsDialogOpen(false);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validar Tamaño (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("El archivo excede el tamaño máximo de 4MB.");
      e.target.value = "";
      return;
    }

    // 2. Validar Resolución
    const isValidResolution = await new Promise<boolean>((resolve) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        // Resolución máxima sugerida: 2048x2048
        if (img.width > 2048 || img.height > 2048) {
          toast.error(
            `La resolución (${img.width}x${img.height}) es demasiado alta. Máximo recomendado: 2048x2048px.`
          );
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        toast.error("Error al leer el archivo de imagen.");
        resolve(false);
      };
    });

    if (!isValidResolution) {
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setIsDialogOpen(true);
    // Reset input so same file can be selected again if needed
    e.target.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    // Renaming logic
    const extension = selectedFile.name.split(".").pop();
    const newName = `frame-${slug}.${extension}`;
    const renamedFile = new File([selectedFile], newName, {
      type: selectedFile.type,
    });

    await startUpload([renamedFile]);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />
      <Button
        variant="secondary"
        size="sm"
        className="w-full mt-2 hover:bg-primary"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        {isUploading ? "Subiendo..." : "Cambiar Marco QR"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro de cambiar el Marco QR?</DialogTitle>
            <DialogDescription>
              Esta acción reemplazará el marco actual inmediatamente.
              <br />
              Asegurese de tener una copia de seguridad si es necesario.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmUpload} disabled={isUploading}>
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar y Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
