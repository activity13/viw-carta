"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Plus,
  MessageSquare,
  Globe,
  AlertCircle,
  Info,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  XCircle,
  LayoutTemplate,
} from "lucide-react";

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

const MESSAGE_TYPE_CONFIG = {
  info: {
    label: "Información",
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
  warning: {
    label: "Advertencia",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  },
  alert: {
    label: "Alerta",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700 hover:bg-red-200",
  },
  promotion: {
    label: "Promoción",
    icon: Megaphone,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  },
};

export default function MessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ISystemMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<ISystemMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/backoffice/system-messages?restaurantId=${currentRestaurantId}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingMsg ? "PUT" : "POST";

    // Asegurar que el restaurantId esté presente si es nuevo
    const payload = editingMsg
      ? { ...formData, _id: editingMsg._id }
      : { ...formData, restaurantId: currentRestaurantId };

    const res = await fetch("/api/backoffice/system-messages", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    setFormData({ ...initialFormState, restaurantId: currentRestaurantId });
    setIsOpen(true);
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mensajes del Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los avisos, alertas y promociones que aparecen en tu carta
            digital.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Mensaje
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] h-[85vh] md:h-[95vh] overflow-y-auto scrollbar-none">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingMsg ? "Editar Mensaje" : "Crear Nuevo Mensaje"}
              </DialogTitle>
              <DialogDescription>
                Configura el contenido y la ubicación del mensaje en la carta.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 md:space-y-6 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="placement"
                    className="flex items-center gap-2"
                  >
                    <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                    Ubicación (ID)
                  </Label>
                  <Input
                    id="placement"
                    placeholder="Ej: pizza_menu_footer"
                    value={formData.placement}
                    onChange={(e) =>
                      setFormData({ ...formData, placement: e.target.value })
                    }
                    required
                    className="font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Identificador único para la posición en la UI.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    Tipo de Mensaje
                  </Label>
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
                      {Object.entries(MESSAGE_TYPE_CONFIG).map(
                        ([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon
                                className={`w-4 h-4 ${config.color}`}
                              />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="content" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Contenido (Español)
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Escribe el mensaje aquí..."
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="content_en"
                    className="flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Contenido (Inglés)
                  </Label>
                  <Textarea
                    id="content_en"
                    placeholder="Write the message here..."
                    value={formData.content_en}
                    onChange={(e) =>
                      setFormData({ ...formData, content_en: e.target.value })
                    }
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-base">
                    Estado del Mensaje
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Activa o desactiva la visibilidad de este mensaje.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingMsg ? "Guardar Cambios" : "Crear Mensaje"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-muted animate-pulse"
            ></div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/10">
          <div className="bg-muted p-4 rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No hay mensajes creados</h3>
          <p className="text-muted-foreground max-w-sm mt-2 mb-6">
            Comienza creando mensajes para informar a tus clientes sobre
            ofertas, horarios o avisos importantes.
          </p>
          <Button onClick={handleCreate} variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Crear primer mensaje
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {messages.map((msg) => {
            const config = MESSAGE_TYPE_CONFIG[msg.type];
            const Icon = config.icon;

            return (
              <Card
                key={msg._id}
                className={`group relative overflow-hidden transition-all hover:shadow-md border-l-4 ${
                  msg.isActive
                    ? config.border.replace("border", "border-l")
                    : "border-l-muted"
                } ${!msg.isActive ? "opacity-75 grayscale-[0.5]" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs tracking-tight"
                    >
                      {msg.placement}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`${
                        msg.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {msg.isActive ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <CardTitle className="text-base font-medium">
                      {config.label}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                        ES
                      </span>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                  {msg.content_en && (
                    <div className="space-y-1 pt-2 border-t border-dashed">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">
                          EN
                        </span>
                        <p className="text-sm leading-relaxed text-muted-foreground italic">
                          {msg.content_en}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 pb-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(msg)}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Editar Mensaje
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
