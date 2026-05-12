import { Suspense } from "react";
import MarketView from "@/app/fast-market/components/MarketView";
import type { Metadata } from "next";

export const revalidate = 60;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://fast-market.viw-carta.com");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Fast Market Vichayito",
  description:
    "Catálogo embebible de Fast Market Vichayito — productos frescos y pedidos por WhatsApp.",
  icons: [
    {
      url: "/fast-market/images/favicon.ico",
    },
  ],
  openGraph: {
    title: "Fast Market Vichayito — Embed",
    description:
      "Catálogo embebible de Fast Market Vichayito — productos frescos y pedidos por WhatsApp.",
    url: siteUrl,
    images: [
      process.env.NEXT_PUBLIC_SITE_URL
        ? `${siteUrl}/fast-market/default-og.jpeg`
        : "/default-fastmarket-image.jpeg",
    ],
  },
};

import { getPublicMenuData } from "@/lib/public-menu";

async function getData() {
  const subdomain = "fast-market";
  try {
    return await getPublicMenuData(subdomain);
  } catch (error) {
    console.log(error);
    if (process.env.NODE_ENV === "development") {
      try {
        return await getPublicMenuData("la-k");
      } catch (fallbackError) {
        console.error("Error fetching fallback data:", fallbackError);
        return null;
      }
    }
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
        <Suspense>
          <MarketView data={data as unknown as Parameters<typeof MarketView>[0]["data"]} />
        </Suspense>
      </div>
    </div>
  );
}
