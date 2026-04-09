"use client";

import React, { useEffect, useState } from "react";
import Axios from "axios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Search, Users, Edit } from "lucide-react";
import { ClientForm } from "./ClientForm";

interface Client {
  _id: string;
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

export default function ClientUI({}: { restaurantId: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = async (query: string = "") => {
    setIsLoading(true);
    try {
      const res = await Axios.get(
        `/api/clients${query ? `?search=${query}` : ""}`,
      );
      setClients(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los clientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchClients(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsFormOpen(false);
    fetchClients(searchQuery);
  };

  const formatCurrency = (amount?: number) => {
    return `S/. ${Number(amount || 0).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-muted-foreground">
            Gestiona la información de todos tus clientes, su historial y
            métricas de compra.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Users className="w-4 h-4 mr-2" /> Agregar Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por Doc, Nombre o Razón Social..."
                className="w-[300px] border-0 focus-visible:ring-0 px-0 rounded-none shadow-none text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Badge variant="secondary">{clients.length} encontrados</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-20" />
              <p>No se encontraron clientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Total Gastado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={client._id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleEdit(client)}
                    >
                      <TableCell>
                        <div className="font-mono text-sm">
                          {client.documentNumber}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase">
                          {client.documentType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {client.documentType === "ruc"
                            ? client.businessName
                            : `${client.name} ${client.lastName || ""}`}
                        </div>
                        {client.documentType === "ruc" && client.name && (
                          <div className="text-xs text-muted-foreground">
                            Rep: {client.name} {client.lastName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{client.phone || "-"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {client.email || ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.clientType === "vip"
                              ? "default"
                              : client.clientType === "frequent"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            client.clientType === "vip"
                              ? "bg-amber-500 hover:bg-amber-600"
                              : ""
                          }
                        >
                          {client.clientType === "family_and_friends"
                            ? "F&F"
                            : client.clientType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-medium">
                        {client.purchaseStats?.totalOrders || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(client.purchaseStats?.totalSpent)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(client);
                          }}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editing Dialog */}
      <ClientForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingClient}
        onSuccess={handleSaveSuccess}
      />
    </div>
  );
}
