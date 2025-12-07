import StandardMenu from "@/components/templates/StandardMenu";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 60;

type Props = {
  params: Promise<{ domain: string }>;
};

export default async function TenantPage({ params }: Props) {
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
      if (res.status === 404) return notFound();
      throw new Error("Failed to fetch menu");
    }

    const data = await res.json();

    return <StandardMenu data={data} restaurant={data.restaurant} />;
  } catch (error) {
    console.error("Error fetching menu:", error);
    return notFound();
  }
}
