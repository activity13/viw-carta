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

interface LogoUploaderProps {
  slug: string;
  onUploadComplete: (url: string) => void;
}

export function LogoUploader({ slug, onUploadComplete }: LogoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        toast.success("Logo actualizado correctamente");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsDialogOpen(true);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    // Renaming logic
    const extension = selectedFile.name.split(".").pop();
    const newName = `logo-${slug}.${extension}`;
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
        {isUploading ? "Subiendo..." : "Cambiar Logo"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro de cambiar el logo?</DialogTitle>
            <DialogDescription>
              Esta acción reemplazará el logo actual inmediatamente. Asegurate
              de tener una copia de seguridad si es necesario.
              <br />
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
