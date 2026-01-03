import MarketView from "@/app/market-vichayito/components/MarketView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://vichayito-market.viw-carta.com");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Market Vichayito — Embed",
  description:
    "Catálogo embebible de Market Vichayito — productos frescos y pedidos por WhatsApp.",
  openGraph: {
    title: "Market Vichayito — Embed",
    description:
      "Catálogo embebible de Market Vichayito — productos frescos y pedidos por WhatsApp.",
    url: siteUrl,
    images: [
      process.env.NEXT_PUBLIC_SITE_URL
        ? `${siteUrl}/market-vichayito/default-og.jpg`
        : "/default-market-image.jpg",
    ],
  },
};

async function getData() {
  const subdomain = "market-vichayito";
  const baseUrl =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://viw-carta.com");

  try {
    const res = await fetch(`${baseUrl}/api/public/menu/${subdomain}`, {
      next: { tags: [`menu-${subdomain}`] },
    });

    if (!res.ok) {
      if (process.env.NODE_ENV === "development") {
        const fallbackRes = await fetch(`${baseUrl}/api/public/menu/la-k`, {
          next: { tags: ["menu-la-k"] },
        });
        if (fallbackRes.ok) return await fallbackRes.json();
      }
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("Error fetching market data:", e);
    return null;
  }
}

export default async function EmbedMarketVichayitoPage() {
  const data = await getData();

  if (!data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white text-slate-500">
        <div className="text-center">
          <p className="font-medium">Market Vichayito (embed)</p>
          <p className="text-sm mt-2">Contenido no disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4">
        <MarketView data={data} />
      </div>
    </div>
  );
}
