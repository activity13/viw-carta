"use client";

import React, { useState, useEffect } from "react";
import Axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Client {
  _id?: string;
  documentType: string;
  documentNumber: string;
  name: string;
  lastName?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  clientType: string;
  purchaseStats?: {
    totalOrders: number;
    totalSpent: number;
  };
}

interface ClientFormData {
  documentType: string;
  documentNumber: string;
  name: string;
  lastName: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  clientType: string;
}

interface ClientFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Client | null;
  onSuccess?: () => void;
}

export function ClientForm({ isOpen, onOpenChange, initialData, onSuccess }: ClientFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<ClientFormData>({
    documentType: "dni",
    documentNumber: "",
    name: "",
    lastName: "",
    businessName: "",
    phone: "",
    email: "",
    address: "",
    clientType: "standard",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          documentType: initialData.documentType || "dni",
          documentNumber: initialData.documentNumber || "",
          name: initialData.name || "",
          lastName: initialData.lastName || "",
          businessName: initialData.businessName || "",
          phone: initialData.phone || "",
          email: initialData.email || "",
          address: initialData.address || "",
          clientType: initialData.clientType || "standard",
        });
      } else {
        setFormData({
          documentType: "dni",
          documentNumber: "",
          name: "",
          lastName: "",
          businessName: "",
          phone: "",
          email: "",
          address: "",
          clientType: "standard",
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.documentNumber || !formData.name) {
      toast.error("El número de documento y el nombre son campos requeridos");
      return;
    }

    setIsSaving(true);
    try {
      if (initialData && initialData._id) {
        // Edit
        await Axios.put(`/api/clients/${initialData._id}`, formData);
        toast.success("Cliente actualizado");
      } else {
        // Create
        await Axios.post("/api/clients", formData);
        toast.success("Cliente creado");
      }
      onSuccess?.();
    } catch (error: unknown) {
      console.error(error);
      const msg = Axios.isAxiosError(error) ? error.response?.data?.error : "Error al guardar cliente";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo Documento</label>
            <Select 
              value={formData.documentType} 
              onValueChange={(v) => setFormData(p => ({ ...p, documentType: v }))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="ruc">RUC</SelectItem>
                <SelectItem value="passport">Pasaporte</SelectItem>
                <SelectItem value="ce">CE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nro Documento *</label>
            <Input name="documentNumber" value={formData.documentNumber} onChange={handleChange} className="h-10 font-mono text-base" />
          </div>

          {formData.documentType === "ruc" ? (
            <div className="col-span-full space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Razón Social *</label>
              <Input name="businessName" value={formData.businessName} onChange={handleChange} className="h-10" />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombres *</label>
            <Input name="name" value={formData.name} onChange={handleChange} className="h-10" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Apellidos</label>
            <Input name="lastName" value={formData.lastName} onChange={handleChange} className="h-10" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teléfono / Celular</label>
            <Input name="phone" value={formData.phone} onChange={handleChange} className="h-10" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
            <Input name="email" value={formData.email} onChange={handleChange} className="h-10" />
          </div>

          <div className="col-span-full space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dirección</label>
            <Input name="address" value={formData.address} onChange={handleChange} className="h-10" />
          </div>
          
          <div className="col-span-full space-y-2 mt-2 pt-4 border-t">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Categoría de Cliente</label>
            <Select 
              value={formData.clientType} 
              onValueChange={(v) => setFormData(p => ({ ...p, clientType: v }))}
            >
              <SelectTrigger className="h-10 w-full sm:max-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="frequent">Frecuente</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="family_and_friends">Family & Friends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
