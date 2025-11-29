"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";

// Definición de tipo para el frontend
interface ISystemMessage {
  _id?: string;
  restaurantId: string;
  placement: string;
  type: "info" | "warning" | "alert" | "promotion";
  content: string;
  content_en: string;
  isActive: boolean;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ISystemMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<ISystemMessage | null>(null);

  const currentRestaurantId = session?.user?.restaurantId as string;

  // Estado inicial del formulario
  const initialFormState: ISystemMessage = {
    restaurantId: currentRestaurantId,
    placement: "",
    type: "info",
    content: "",
    content_en: "",
    isActive: true,
  };

  const [formData, setFormData] = useState<ISystemMessage>(initialFormState);

  useEffect(() => {
    if (currentRestaurantId) {
      fetchMessages();
    }
  }, [currentRestaurantId]);

  const fetchMessages = async () => {
    const res = await fetch(
      `/api/backoffice/system-messages?restaurantId=${currentRestaurantId}`
    );
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingMsg ? "PUT" : "POST";

    const res = await fetch("/api/backoffice/system-messages", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingMsg ? { ...formData, _id: editingMsg._id } : formData
      ),
    });

    if (res.ok) {
      setIsOpen(false);
      setEditingMsg(null);
      setFormData(initialFormState);
      fetchMessages();
    }
  };

  const handleEdit = (msg: ISystemMessage) => {
    setEditingMsg(msg);
    setFormData(msg);
    setIsOpen(true);
  };

  const handleCreate = () => {
    setEditingMsg(null);
    setFormData(initialFormState);
    setIsOpen(true);
  };

  return (
    <div className="mt-25 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mensajes del Sistema</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Mensaje
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingMsg ? "Editar Mensaje" : "Crear Nuevo Mensaje"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="placement">Ubicación (ID Interno)</Label>
                <Input
                  id="placement"
                  placeholder="Ej: pizza_menu_footer"
                  value={formData.placement}
                  onChange={(e) =>
                    setFormData({ ...formData, placement: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Clave usada por el programador para mostrar el mensaje.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de Mensaje</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: any) =>
                    setFormData({ ...formData, type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Información</SelectItem>
                    <SelectItem value="warning">Advertencia</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                    <SelectItem value="promotion">Promoción</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">Texto (Español)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content_en">Texto (Inglés)</Label>
                <Textarea
                  id="content_en"
                  value={formData.content_en}
                  onChange={(e) =>
                    setFormData({ ...formData, content_en: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Mensaje Activo</Label>
              </div>

              <Button type="submit" className="w-full">
                Guardar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {messages.map((msg) => (
          <Card key={msg._id} className={!msg.isActive ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mono bg-muted-foreground px-2 py-1 rounded">
                {msg.placement}
              </CardTitle>
              <div
                className={`w-3 h-3 rounded-full ${
                  msg.type === "info"
                    ? "bg-blue-500"
                    : msg.type === "warning"
                    ? "bg-yellow-500"
                    : msg.type === "alert"
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
              />
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold mb-1">ES: {msg.content}</p>
              {msg.content_en && (
                <p className="text-sm text-muted-foreground italic">
                  EN: {msg.content_en}
                </p>
              )}

              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(msg)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {/* Aquí podrías agregar botón de eliminar */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
