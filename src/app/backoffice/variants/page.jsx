"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
// import { useRestaurant } from "@/context/RestaurantContext"; // Asumiendo que tienes un contexto

// Componente para el formulario de creación/edición
const TemplateForm = ({ onClose, initialData, restaurantId, isEditing }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(
    initialData || {
      restaurantId,
      title: "",
      title_en: "",
      type: "single",
      replacesBasePrice: false,
      isRequired: false,
      options: [{ name: "", name_en: "", price: 0 }],
    },
  );

  const mutation = useMutation({
    mutationFn: async (data) => {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `/api/variants/templates/${data._id}`
        : "/api/variants/templates";
      const payload = isEditing ? { ...data } : { ...data };
      delete payload._id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error saving template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["variant-templates"]);
      toast.success(
        isEditing
          ? "Plantilla actualizada"
          : "Plantilla guardada correctamente",
      );
      onClose();
    },
  });

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { name: "", name_en: "", price: 0 }],
    });
  };

  const handleRemoveOption = (idx) => {
    const newOpts = [...formData.options];
    newOpts.splice(idx, 1);
    setFormData({ ...formData, options: newOpts });
  };

  const updateOption = (idx, field, value) => {
    const newOpts = [...formData.options];
    newOpts[idx][field] = value;
    setFormData({ ...formData, options: newOpts });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nombre de Plantilla (Ej: Tamaños Pizza)</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="Ej: Términos de carne"
        />
      </div>

      <div>
        <Label>Nombre de Plantilla en Inglés (English Template Name)</Label>
        <Input
          value={formData.title_en}
          onChange={(e) =>
            setFormData({ ...formData, title_en: e.target.value })
          }
          placeholder="Ej: Meat Temperatures"
        />
      </div>

      <div className="flex gap-4 p-4 border rounded-lg bg-slate-50">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="req"
            checked={formData.isRequired}
            onCheckedChange={(c) => setFormData({ ...formData, isRequired: c })}
          />
          <Label htmlFor="req">Obligatorio</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="multi"
            checked={formData.type === "multiple"}
            onCheckedChange={(c) =>
              setFormData({
                ...formData,
                type: c ? "multiple" : "single",
              })
            }
          />
          <Label htmlFor="multi">Selección Múltiple</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="replace"
            checked={formData.replacesBasePrice}
            onCheckedChange={(c) =>
              setFormData({ ...formData, replacesBasePrice: c })
            }
          />
          <Label htmlFor="replace">Reemplaza Precio Base</Label>
        </div>
      </div>

      <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
        <Label className="text-sm font-semibold">Opciones</Label>
        {formData.options.map((opt, idx) => (
          <div key={idx} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs text-gray-600">Nombre (Español)</Label>
              <Input
                placeholder="Nombre Opción"
                value={opt.name}
                onChange={(e) => updateOption(idx, "name", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-gray-600">Nombre (English)</Label>
              <Input
                placeholder="Option Name"
                value={opt.name_en || ""}
                onChange={(e) => updateOption(idx, "name_en", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="w-32 relative">
              <Label className="text-xs text-gray-600">Precio</Label>
              <span className="absolute left-2 top-8 text-xs text-gray-500">
                S/.
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={opt.price || opt.priceModifier || 0}
                onChange={(e) =>
                  updateOption(
                    idx,
                    formData.replacesBasePrice ? "price" : "priceModifier",
                    parseFloat(e.target.value),
                  )
                }
                className={`pl-6 text-sm ${
                  formData.replacesBasePrice
                    ? "border-emerald-500 bg-emerald-50"
                    : ""
                }`}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveOption(idx)}
              className="h-9 w-9"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddOption}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" /> Agregar Opción
      </Button>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : isEditing ? (
            "Actualizar Plantilla"
          ) : (
            "Guardar Plantilla"
          )}
        </Button>
      </div>
    </form>
  );
};

export default function VariantsPage() {
  const { data: session, status } = useSession();
  const restaurantId = session?.user?.restaurantId;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["variant-templates", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const res = await fetch(
        `/api/variants/templates?restaurantId=${restaurantId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await fetch(`/api/variants/templates/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["variant-templates"]);
      toast.success("Plantilla eliminada");
    },
  });

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  if (status === "loading" || (isLoading && !!restaurantId))
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );

  if (!restaurantId && status === "authenticated") {
    return (
      <div className="p-8">No se encontró información del restaurante.</div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950">
            Biblioteca de Variantes
          </h1>
          <p className="text-gray-500">
            Crea grupos de opciones reutilizables para tus platos (ej. Tamaños
            de Pizza, Términos de cocción).
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" /> Crear Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate
                  ? "Editar Plantilla"
                  : "Nueva Plantilla de Variantes"}
              </DialogTitle>
            </DialogHeader>
            <TemplateForm
              restaurantId={restaurantId}
              initialData={editingTemplate}
              isEditing={!!editingTemplate}
              onClose={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => (
          <Card
            key={template._id}
            className="relative group hover:border-emerald-500 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {template.title}
                  </CardTitle>
                  {template.title_en && (
                    <p className="text-xs text-gray-500 mt-1">
                      English: {template.title_en}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {template.isRequired && (
                    <Badge variant="secondary" className="text-xs">
                      Obligatorio
                    </Badge>
                  )}
                  {template.type === "multiple" && (
                    <Badge variant="outline" className="text-xs">
                      Múltiple
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 mb-4">
                {template.options.length} opciones configuradas
              </div>
              <ul className="space-y-1.5">
                {template.options.slice(0, 3).map((opt, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{opt.name}</span>
                      <span>
                        +S/. {(opt.price || opt.priceModifier || 0).toFixed(2)}
                      </span>
                    </div>
                    {opt.name_en && (
                      <div className="text-xs text-gray-500">{opt.name_en}</div>
                    )}
                  </li>
                ))}
                {template.options.length > 3 && (
                  <li className="text-xs text-gray-400 pt-1">
                    ... y {template.options.length - 3} más
                  </li>
                )}
              </ul>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (
                      confirm("¿Seguro que quieres eliminar esta plantilla?")
                    ) {
                      deleteMutation.mutate(template._id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {templates?.length === 0 && (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-gray-400">
            No hay plantillas creadas aún.
          </div>
        )}
      </div>
    </div>
  );
}
