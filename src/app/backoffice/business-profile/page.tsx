"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Store,
  MapPin,
  Phone,
  Globe,
  Save,
  Edit2,
  X,
  ImageIcon,
  QrCode,
  Building2,
} from "lucide-react";

import QRFrameUploader from "@/components/QrFrameUploader";
import LogoImageUploader from "@/components/LogoImageUploader";
import GenerateQRSection from "@/components/GenerateQRSection";

interface Business {
  _id: string;
  name: string;
  slug: string;
  direction: string;
  location?: string;
  phone: string;
  description?: string;
  image?: string;
  frameQR?: string;
  QrCode?: string;
}

interface BusinessFormData extends Business {
  frameQRFile?: File | null;
  imageFile?: File | null;
}

export default function BusinessProfileForm() {
  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;

  const [business, setBusiness] = useState<Business | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessFormData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchBusiness = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(
          `/api/settings/${session.user.restaurantId}`
        );
        setBusiness(data);
        setFormData(data);
      } catch (error) {
        console.error("Error al cargar el negocio:", error);
        toast.error("Error al cargar la información del negocio");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
  }, [session, restaurantId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const promise = axios.put(
      `/api/settings/update/${business?._id}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    toast.promise(promise, {
      loading: "Guardando cambios...",
      success: (res) => {
        setBusiness(res.data.business);
        setFormData(res.data.business);
        setIsEditing(false);
        return "Perfil actualizado correctamente";
      },
      error: "Error al actualizar los datos",
    });
  };

  const handleCancel = () => {
    if (business) {
      setFormData(business);
    }
    setIsEditing(false);
    toast.info("Edición cancelada");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-5xl space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!business)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">
          No se encontró información del negocio.
        </p>
      </div>
    );

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            Perfil del Negocio
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra la información pública, logotipos y códigos QR de tu
            establecimiento.
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="shadow-sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={isEditing ? "border-primary/50 shadow-md" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                Información General
              </CardTitle>
              <CardDescription>
                Estos datos aparecerán en tu carta digital y en los resultados
                de búsqueda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Negocio</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="pl-9"
                      placeholder="Ej. Pizzería La K"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono de Contacto</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="pl-9"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction">Dirección Física</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="direction"
                    name="direction"
                    value={formData.direction || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="pl-9"
                    placeholder="Av. Principal 123, Ciudad"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Link de Google Maps</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="pl-9"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Negocio</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Cuéntanos sobre tu negocio..."
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Branding y QR */}
        <div className="space-y-6">
          {/* Branding Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                Identidad Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs uppercase text-muted-foreground font-bold">
                  Logotipo
                </Label>
                <div className="bg-muted/30 p-4 rounded-lg border border-dashed flex flex-col items-center justify-center">
                  <LogoImageUploader
                    disabled={!isEditing}
                    existingImageUrl={
                      business.image
                        ? `/${business.slug}/images/${business.image}`
                        : null
                    }
                    onFileSelect={(file) =>
                      setFormData({ ...formData, imageFile: file })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase text-muted-foreground font-bold">
                  Marco QR Personalizado
                </Label>
                <div className="bg-muted/30 p-4 rounded-lg border border-dashed flex flex-col items-center justify-center">
                  <QRFrameUploader
                    disabled={!isEditing}
                    existingImageUrl={
                      business.image
                        ? `/${business.slug}/images/${business.frameQR}`
                        : null
                    }
                    onFileSelect={(file) =>
                      setFormData({ ...formData, frameQRFile: file })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card className="overflow-hidden border-primary/20">
            <div className="bg-primary/5 p-2 border-b border-primary/10">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="w-5 h-5 text-primary" />
                  Código QR Digital
                </CardTitle>
                <CardDescription>
                  Descarga el QR para que tus clientes accedan al menú.
                </CardDescription>
              </CardHeader>
            </div>
            <CardContent className="p-6 flex justify-center">
              <GenerateQRSection
                businessId={business._id}
                businessSlug={business.slug}
                existingImageUrl={
                  business.image
                    ? `/${business.slug}/qr/${business.QrCode}`
                    : null
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
