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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  ReceiptText,
  Eye,
  EyeOff,
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
  fiscal?: {
    ruc?: string;
    legalName?: string;
    taxName?: string;
    taxPercentage?: number;
    invoiceSeries?: string;
    receiptSeries?: string;
    provider?: string;
    apiEndpoint?: string;
    apiKey?: string;
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
  const [showApiKey, setShowApiKey] = useState(false);

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
    const { name, value } = e.target;
    
    // Handle nested fiscal fields
    if (name.startsWith('fiscal.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        fiscal: {
          ...prev.fiscal,
          [field]: field === 'taxPercentage' ? Number(value) : value
        }
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

    // 2. Agregar el tema y fiscal como JSON string
    if (selectedTheme.palette) {
      const themeData = {
        palette: selectedTheme.palette,
        customColors: selectedTheme.customColors,
      };
      formDataToSend.append("theme", JSON.stringify(themeData));
    }
    if (formData.fiscal) {
      formDataToSend.append("fiscal", JSON.stringify(formData.fiscal));
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

          {/* Tarjeta de Datos Fiscales */}
          <Card className={isEditing ? "border-primary/50 shadow-md" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ReceiptText className="w-5 h-5 text-muted-foreground" />
                Datos Fiscales e Impuestos
              </CardTitle>
              <CardDescription>
                Configura los datos formales para la emisión de pre-cuentas y boletas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fiscal.ruc">RUC</Label>
                  <Input
                    id="fiscal.ruc"
                    name="fiscal.ruc"
                    value={formData.fiscal?.ruc || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="20123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal.legalName">Razón Social</Label>
                  <Input
                    id="fiscal.legalName"
                    name="fiscal.legalName"
                    value={formData.fiscal?.legalName || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Mi Empresa S.A.C."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal.taxName">Nombre del Impuesto</Label>
                  <Input
                    id="fiscal.taxName"
                    name="fiscal.taxName"
                    value={formData.fiscal?.taxName || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="IGV"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal.taxPercentage">Porcentaje (%)</Label>
                  <Input
                    id="fiscal.taxPercentage"
                    name="fiscal.taxPercentage"
                    type="number"
                    step="0.1"
                    value={formData.fiscal?.taxPercentage ?? 18}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="18"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal.invoiceSeries">Serie Facturas</Label>
                  <Input
                    id="fiscal.invoiceSeries"
                    name="fiscal.invoiceSeries"
                    value={formData.fiscal?.invoiceSeries || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="F001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal.receiptSeries">Serie Boletas</Label>
                  <Input
                    id="fiscal.receiptSeries"
                    name="fiscal.receiptSeries"
                    value={formData.fiscal?.receiptSeries || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="B001"
                  />
                </div>

                {/* Sección Facturación Electrónica */}
                <div className="md:col-span-2 border-t pt-6 mt-4">
                  <h3 className="text-sm font-bold text-foreground/80 mb-1">
                    Credenciales del Proveedor de Facturación
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Configura la conexión con tu Proveedor de Servicios Electrónicos (PSE) para la firma y envío oficial a SUNAT.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiscal.provider">Proveedor Fiscal</Label>
                  <Select
                    value={formData.fiscal?.provider || "nubefact"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        fiscal: {
                          ...prev.fiscal,
                          provider: value,
                        },
                      }))
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="nubefact">Nubefact</SelectItem>
                      <SelectItem value="efact">Efact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiscal.apiEndpoint">API Endpoint</Label>
                  <Input
                    id="fiscal.apiEndpoint"
                    name="fiscal.apiEndpoint"
                    value={formData.fiscal?.apiEndpoint || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://api.nubefact.com/api/v1/..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fiscal.apiKey">Token API / Clave de Acceso</Label>
                  <div className="relative">
                    <Input
                      id="fiscal.apiKey"
                      name="fiscal.apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={formData.fiscal?.apiKey || ""}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="pr-10 border-gray-300/30 font-mono"
                      placeholder="Token secreto de Nubefact o Efact"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      disabled={!formData.fiscal?.apiKey}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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
