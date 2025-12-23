"use client";

import { useState } from "react";
import { Loader2, Plus, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CategoryFormData {
  name: string;
  name_en: string;
  code: string;
  slug: string;
  description: string;
  description_en: string;
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  loading: boolean;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: CategoryFormDialogProps) {
  const [form, setForm] = useState({
    name: "",
    name_en: "",
    code: "",
    slug: "",
    description: "",
    description_en: "",
  });
  const [showTranslation, setShowTranslation] = useState(false);

  const generateSlug = (text: string): string => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
    // Reset form on success (parent handles closing)
    setForm({
      name: "",
      name_en: "",
      code: "",
      slug: "",
      description: "",
      description_en: "",
    });
    setShowTranslation(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Categoría</DialogTitle>
          <DialogDescription>
            Crea una nueva categoría para tu menú.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej. Entradas"
              value={form.name}
              onChange={(e) => {
                const val = e.target.value;
                const slug = generateSlug(val);
                const code = val.substring(0, 3).toUpperCase();

                setForm((f) => ({
                  ...f,
                  name: val,
                  slug: f.slug || slug,
                  code: f.code || code,
                }));

                if (!form.slug || form.slug === generateSlug(form.name)) {
                  setForm((prev) => ({ ...prev, slug }));
                }
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="ENT"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Identificador URL</Label>
              <Input
                id="slug"
                placeholder="entradas"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Breve descripción..."
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Sección de Traducción (Colapsable) */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowTranslation(!showTranslation)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Traducción (Inglés)
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showTranslation ? "rotate-180" : ""
                }`}
              />
            </button>
            {showTranslation && (
              <div className="px-3 pb-3 space-y-3 border-t pt-3">
                <div className="space-y-2">
                  <Label htmlFor="name_en">Nombre en Inglés</Label>
                  <Input
                    id="name_en"
                    placeholder="Ej. Starters"
                    value={form.name_en}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name_en: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_en">Descripción en Inglés</Label>
                  <Textarea
                    id="description_en"
                    placeholder="Brief description..."
                    value={form.description_en}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description_en: e.target.value }))
                    }
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Crear Categoría
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
