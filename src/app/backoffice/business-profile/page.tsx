"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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

  useEffect(() => {
    if (!restaurantId) return;

    const fetchBusiness = async () => {
      try {
        const { data } = await axios.get(
          `/api/settings/${session.user.restaurantId}`
        );
        setBusiness(data);
        setFormData(data);
      } catch (error) {
        console.error("Error al cargar el negocio:", error);
      }
    };

    fetchBusiness();
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(
        `/api/settings/update/${business?._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setBusiness(res.data.business);
      setIsEditing(false);
      if (res.status === 200) {
        alert("Datos actualizados correctamente");
        setIsEditing(false);
        // Opcional: refresca el estado con los nuevos datos
        setFormData(res.data.business);
      } else {
        alert("Error al actualizar los datos");
      }
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al guardar");
    }
  };

  if (!business) return <p className="text-center py-6">Cargando datos...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#041b15] to-[#143d26] py-16 px-4 flex justify-center items-center">
      <Card className="w-full max-w-2xl bg-geen-900/30 backdrop-blur-md border border-white/20 shadow-lg rounded-3xl text-white">
        <CardContent className="space-y-6 p-8">
          <h2 className="text-3xl font-bold text-center tracking-wide text-white">
            Perfil del Negocio
          </h2>

          {/* Imagen principal */}
          <div className="flex flex-col items-center justify-center space-y-3">
            {business.image ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-white/40">
                <Image
                  src={`/la-k/images/${business.image}`}
                  alt="Logo del negocio"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-white/10 border border-white/30 rounded-full text-white/60">
                Sin imagen
              </div>
            )}
          </div>

          {/* Campos */}
          {[
            { label: "Nombre", name: "name" },
            { label: "Dirección", name: "direction" },
            { label: "Link de Google Maps", name: "location" },
            { label: "Teléfono", name: "phone" },
            { label: "Descripción", name: "description" },
          ].map(({ label, name }) => (
            <div key={name}>
              <Label className="text-sm text-white/80">{label}</Label>
              <Input
                name={name}
                value={formData[name as keyof Business] || ""}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-1 bg-transparent border border-white/30 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition-all"
              />
            </div>
          ))}
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

          {/* Frame QR */}
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

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            {session?.user?.role === "admin" && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-lime-500 hover:bg-lime-400 text-[#0f2e1d] font-semibold rounded-xl px-5"
              >
                Editar
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  onClick={handleSave}
                  className="bg-lime-500 hover:bg-lime-400 text-[#0f2e1d] font-semibold rounded-xl px-5"
                >
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(business);
                    setIsEditing(false);
                  }}
                  className="border-white/40 text-white hover:bg-white/10 rounded-xl px-5"
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
          <GenerateQRSection
            businessId={business._id}
            businessSlug={business.slug}
            existingImageUrl={
              business.image ? `/${business.slug}/qr/${business.QrCode}` : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
