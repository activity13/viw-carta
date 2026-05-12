import StandardMenu from "@/components/templates/StandardMenu";
import ServiceSuspended from "@/components/public/ServiceSuspended";
import { notFound } from "next/navigation";
import { getPublicMenuData } from "@/lib/public-menu";

export const revalidate = 60; // Forzar que esta página se revalide de manera estática al menos cada 60s

type Props = {
  params: Promise<{ domain: string }>;
};

export default async function TenantPage({ params }: Props) {
  const { domain } = await params;

  try {
    // Al usar getPublicMenuData, Next.js invocará unstable_cache
    // y resolverá esto en 0 ms si está en caché, sin tocar la base de datos ni hacer peticiones HTTP.
    const data = await getPublicMenuData(domain);

    return <StandardMenu data={data} restaurant={data.restaurant} />;
  } catch (error: any) {
    console.error("Error fetching menu:", error);
    if (error.message === "Service Suspended") return <ServiceSuspended />;
    return notFound();
  }
}
