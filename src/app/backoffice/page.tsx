"use client";

import { useEffect, useState } from "react";
import Master from "@/components/master";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.restaurantId) {
      const fetchLogo = async () => {
        try {
          const { data } = await axios.get(
            `/api/settings/${session.user.restaurantId}`,
          );
          if (data?.image) {
            setBusinessLogo(data.image);
          }
        } catch (error) {
          console.error("Error fetching business logo:", error);
        }
      };
      fetchLogo();
    }
  }, [session?.user?.restaurantId]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-36 w-36 border-2 border-emerald-100 shadow-sm">
              <AvatarImage
                src={businessLogo || undefined}
                className="object-cover"
              />
              <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold text-xl">
                {session?.user?.slug?.slice(0, 2).toUpperCase() || "CN"}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-7xl font-bold tracking-tight">
              {session?.user?.slug || "Panel de Administración"}
            </h1>
          </div>
          <p className="text-muted-foreground mb-10">
            Gestiona tu menú, precios y disponibilidad desde aquí.
          </p>
        </div>

        <Master />
      </div>
    </div>
  );
}
