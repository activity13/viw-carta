import StandardMenu from "@/components/templates/StandardMenu";
import ServiceSuspended from "@/components/public/ServiceSuspended";
import { notFound } from "next/navigation";
import { getPublicMenuData } from "@/lib/public-menu";
import type { Metadata } from "next";

export const revalidate = 60; // Forzar que esta página se revalide de manera estática al menos cada 60s

type Props = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params;

  try {
    const data = await getPublicMenuData(domain);
    const { restaurant } = data;

    const title = `${restaurant.name} | Menú Digital`;
    const description =
      restaurant.description ||
      `Explora la carta de ${restaurant.name}. ${restaurant.direction ? `Ubícanos en ${restaurant.direction}.` : ""} ¡Pide ahora!`;

    const logo = restaurant.theme?.logoUrl || "/logo-c.svg";

    return {
      title,
      description,
      icons: {
        icon: logo,
        shortcut: logo,
        apple: logo,
      },
      openGraph: {
        title,
        description,
        url: `https://${domain}.viwcarta.com`, // Asumiendo el dominio base
        siteName: "Viw-Carta",
        images: [
          {
            url: restaurant.image || restaurant.theme?.coverImageUrl || logo,
            width: 1200,
            height: 630,
            alt: restaurant.name,
          },
        ],
        locale: "es_PE",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [restaurant.image || restaurant.theme?.coverImageUrl || logo],
      },
    };
  } catch (error) {
    console.log(error);
    return {
      title: "Viw-Carta | Menú Digital",
    };
  }
}

export default async function TenantPage({ params }: Props) {
  const { domain } = await params;

  try {
    // Al usar getPublicMenuData, Next.js invocará unstable_cache
    // y resolverá esto en 0 ms si está en caché, sin tocar la base de datos ni hacer peticiones HTTP.
    const data = await getPublicMenuData(domain);
    const { restaurant } = data;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": restaurant.businessType === "store" ? "Store" : "Restaurant",
      name: restaurant.name,
      description: restaurant.description,
      image:
        restaurant.image ||
        restaurant.theme?.coverImageUrl ||
        restaurant.theme?.logoUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: restaurant.direction,
      },
      telephone: restaurant.phone,
      url: `https://${domain}.viwcarta.com`,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <StandardMenu data={data} restaurant={data.restaurant} />
      </>
    );
  } catch (error: unknown) {
    console.error("Error fetching menu:", error);
    if (error instanceof Error && error.message === "Service Suspended")
      return <ServiceSuspended />;
    return notFound();
  }
}
