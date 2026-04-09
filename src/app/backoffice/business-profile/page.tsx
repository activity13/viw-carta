"use client";

// Bibliotecas de React
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Bibliotecas de conexión
import axios from "axios";

// Componentes y hooks encargados del sistema
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDeniedCard } from "@/components/ui/AccessDeniedCard";

// Bibliotecas de performance y optimización del sitio
import Image from "next/image";

// Componentes de UI
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

// Bibliotecas de efectos visuales
import { toast } from "sonner";

// Iconos de Lucide React
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
  Palette,
  Utensils,
  ShoppingBag,
} from "lucide-react";

// Componentes de la aplicación
import { LogoUploader } from "@/components/LogoUploader";
import { FrameUploader } from "@/components/FrameUploader";
import GenerateQRSection from "@/components/GenerateQRSection";
import { ColorPaletteSelector } from "@/components/ColorPaletteSelector";
import { type RestaurantTheme } from "@/utils/colorPalettes";

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
  businessType?: "restaurant" | "store";
  theme?: {
    palette?: string;
    customColors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      text?: string;
      muted?: string;
    };
    // Legacy fields
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    logoUrl?: string;
    coverImageUrl?: string;
  };
}

interface BusinessFormData extends Business {
  frameQRFile?: File | null;
  imageFile?: File | null;
  selectedTheme?: RestaurantTheme;
}

export default function BusinessProfileForm() {
  const { can } = usePermissions();
  const isAdmin = can("manage_business");
  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;

  const [business, setBusiness] = useState<Business | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessFormData>>({});
  const [selectedTheme, setSelectedTheme] = useState<RestaurantTheme>({
    palette: "viw",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId || !isAdmin) return;

    const fetchBusiness = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(
          `/api/settings/${session.user.restaurantId}`,
        );
        setBusiness(data);
        setFormData(data);

        // Initialize theme from database or use default
        if (data.theme?.palette) {
          setSelectedTheme({
            palette: data.theme.palette,
            customColors: data.theme.customColors,
          });
        } else {
          setSelectedTheme({ palette: "viw" });
        }
      } catch (error) {
        console.error("Error al cargar el negocio:", error);
        toast.error("Error al cargar la información del negocio");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
  }, [session, restaurantId, isAdmin]);

  if (!isAdmin) {
    return (
      <AccessDeniedCard 
        message="No tienes los permisos necesarios para gestionar el perfil del negocio. Esta sección es exclusiva para administradores."
      />
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const formDataToSend = new FormData();

    // 1. Agregar solo los campos de texto editables
    const EDITABLE_TEXT_FIELDS = [
      "name",
      "direction",
      "location",
      "phone",
      "description",
      "image",
      "frameQR",
      "businessType",
    ];
    Object.entries(formData).forEach(([key, value]) => {
      if (!EDITABLE_TEXT_FIELDS.includes(key)) return;
      if (value === undefined || value === null) return;
      formDataToSend.append(key, String(value));
    });

    // 2. Agregar el tema como JSON string
    if (selectedTheme.palette) {
      const themeData = {
        palette: selectedTheme.palette,
        customColors: selectedTheme.customColors,
      };
      formDataToSend.append("theme", JSON.stringify(themeData));
    }

    // 3. Agregar archivos si existen
    if (formData.frameQRFile) {
      formDataToSend.append("frameQRFile", formData.frameQRFile);
    }
    if (formData.imageFile) {
      formDataToSend.append("imageFile", formData.imageFile);
    }

    const promise = axios.put(
      `/api/settings/update/${business?._id}`,
      formDataToSend,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
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
      // Reset theme to original values
      if (business.theme?.palette) {
        setSelectedTheme({
          palette: business.theme.palette,
          customColors: business.theme.customColors,
        });
      } else {
        setSelectedTheme({ palette: "viw" });
      }
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
                      className="pl-9 border-gray-300/30"
                      placeholder="Ej. Pizzería El Buen Vino"
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
                      className="pl-9 border-gray-300/30"
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
                    className="pl-9 border-gray-300/30"
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
                    className="pl-9 border-gray-300/30"
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
                  className="resize-none border-gray-300/30"
                />
              </div>

              {/* Business Type */}
              <div className="space-y-3">
                <Label>Tipo de Vista Pública</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() =>
                      setFormData({ ...formData, businessType: "restaurant" })
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      (formData.businessType ?? "restaurant") === "restaurant"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <Utensils className="w-6 h-6 text-primary" />
                    <span className="text-sm font-semibold">Restaurante</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Carta digital con categorías y platos
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() =>
                      setFormData({ ...formData, businessType: "store" })
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      formData.businessType === "store"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <span className="text-sm font-semibold">
                      Tienda / E-commerce
                    </span>
                    <span className="text-xs text-muted-foreground text-center">
                      Catálogo de productos con CTA
                    </span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection Card */}
          <Card
            className={
              isEditing
                ? "border-primary/50 shadow-md bg-accent text-slate-950"
                : "bg-accent text-slate-950"
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Palette className="w-5 h-5 text-muted-foreground" />
                Paleta de Colores
              </CardTitle>
              <CardDescription>
                Selecciona los colores que mejor representen tu marca en la
                carta digital.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColorPaletteSelector
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                disabled={!isEditing}
              />
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
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  Logo del Restaurante
                </label>

                {formData.image && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted/10">
                    <Image
                      src={
                        formData.image.startsWith("http")
                          ? formData.image
                          : `/${formData.slug}/images/${formData.image}`
                      }
                      alt="Logo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {isEditing && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setFormData({ ...formData, image: "" })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                <LogoUploader
                  slug={business?.slug || "business"}
                  onUploadComplete={(url) => {
                    setBusiness((prev) =>
                      prev ? { ...prev, image: url } : null,
                    );
                    setFormData((prev) => ({ ...prev, image: url }));
                  }}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase text-muted-foreground font-bold">
                  Marco QR Personalizado
                </Label>

                {formData.frameQR && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted/10 mb-2">
                    <Image
                      src={
                        formData.frameQR.startsWith("http")
                          ? formData.frameQR
                          : `/${formData.slug}/images/${formData.frameQR}`
                      }
                      alt="Marco QR"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                    {isEditing && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() =>
                          setFormData({ ...formData, frameQR: "" })
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                <FrameUploader
                  slug={business?.slug || "business"}
                  onUploadComplete={async (url) => {
                    setBusiness((prev) =>
                      prev ? { ...prev, frameQR: url } : null,
                    );
                    setFormData((prev) => ({ ...prev, frameQR: url }));

                    // 🔄 Auto-regenerate QR when frame changes
                    if (business?._id) {
                      try {
                        toast.info(
                          "Actualizando código QR con el nuevo marco...",
                        );
                        const res = await fetch(
                          `/api/qr/generate/${business._id}`,
                        );
                        const data = await res.json();
                        if (res.ok && data.qrPath) {
                          setBusiness((prev) =>
                            prev ? { ...prev, QrCode: data.qrPath } : null,
                          );
                          toast.success(
                            "Código QR actualizado automáticamente",
                          );
                        }
                      } catch (error) {
                        console.error("Error auto-regenerating QR:", error);
                        toast.error(
                          "El marco se subió, pero hubo un error actualizando el QR final.",
                        );
                      }
                    }
                  }}
                />
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
                  business.QrCode
                    ? business.QrCode.startsWith("http")
                      ? business.QrCode
                      : `/${business.slug}/qr/${business.QrCode}`
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
