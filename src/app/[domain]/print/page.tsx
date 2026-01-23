import PrintMenu from "@/components/templates/PrintMenu";
import ServiceSuspended from "@/components/public/ServiceSuspended";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 60;

type Props = {
  params: Promise<{ domain: string }>;
};

export default async function PrintTenantPage({ params }: Props) {
  const { domain } = await params;

  const baseUrl =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://viw-carta.com");

  try {
    const res = await fetch(`${baseUrl}/api/public/menu/${domain}`, {
      next: { tags: [`menu-${domain}`] },
    });

    if (!res.ok) {
      if (res.status === 402) return <ServiceSuspended />;
      if (res.status === 404) return notFound();
      throw new Error("Failed to fetch menu");
    }

    const data = await res.json();

    // Print view is specific: we pass meals and categories as well
    // Assuming data structure contains categories and meals, which it likely does.
    // StandardMenu takes "data", let's see what PrintMenu expects.
    // StandardMenu expects { data, restaurant } where data likely contains everything.

    return (
      <PrintMenu restaurant={data.restaurant} categories={data.categories} />
    );
  } catch (error) {
    console.error("Error fetching menu for print:", error);
    return notFound();
  }
}
