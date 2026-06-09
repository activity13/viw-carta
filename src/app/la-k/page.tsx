import LaKarta from "./components/Karta";
import { getPublicMenuData } from "@/lib/public-menu";
import type { Metadata } from "next";

export const revalidate = 60; // revalida cada minuto o al revalidateTag()

// ─── SEO Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  const subdomain = "la-k";
  const data = await getPublicMenuData(subdomain);
  const restaurantName = data.restaurant.name || "La K";

  return {
    title: `${restaurantName} — Restaurante en Vichayito | Carta Digital`,
    description:
      "Descubre la carta digital de La K, restaurante en Vichayito, Piura. Disfruta de ceviches, mariscos, parrillas y pizzas artesanales a tamaño familiar. Consulta nuestro menú y haz tu pedido por WhatsApp.",
    keywords: [
      "La K",
      "restaurante Vichayito",
      "carta digital",
      "menú Vichayito",
      "ceviches Vichayito",
      "pizzas Vichayito",
      "restaurante playa Perú",
      "mariscos Piura",
      "parrilla Vichayito",
    ],
    icons: {
      icon: `/la-k/images/favicon.ico`,
    },
    alternates: {
      canonical: `https://viw-carta.com/la-k`,
    },
    openGraph: {
      title: `${restaurantName} — Restaurante en Vichayito`,
      description:
        "Ceviches, mariscos, parrillas y pizzas artesanales. Consulta nuestra carta digital y haz tu pedido.",
      url: "https://viw-carta.com/la-k",
      siteName: restaurantName,
      locale: "es_PE",
      type: "website",
      images: [
        {
          url: "/la-k/images/la-k-logo.png",
          width: 600,
          height: 600,
          alt: `Logo de ${restaurantName} - Restaurante en Vichayito`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${restaurantName} — Carta Digital`,
      description:
        "Ceviches, mariscos, parrillas y pizzas artesanales en Vichayito.",
      images: ["/la-k/images/la-k-logo.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default async function LaK({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const embed = resolvedSearchParams.embed === "true";
  const customPhone = typeof resolvedSearchParams.phone === "string" ? resolvedSearchParams.phone : undefined;
  const hideOrder = resolvedSearchParams.hide_order === "true";

  const subdomain = "la-k";
  const data = await getPublicMenuData(subdomain);

  // Build restaurant object with all fields needed for landing + menu
  const restaurant = {
    ...data.restaurant,
    id: data.restaurant.id,
    name: data.restaurant.name,
    slug: data.restaurant.slug,
    phone: customPhone || data.restaurant.phone,
    direction: data.restaurant.direction,
    location: data.restaurant.location,
    description: data.restaurant.description,
    image: data.restaurant.image,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: restaurant.name,
            description:
              "Restaurante en Vichayito con ceviches, mariscos, parrillas y pizzas artesanales a tamaño familiar.",
            url: "https://viw-carta.com/la-k",
            telephone: restaurant.phone,
            address: {
              "@type": "PostalAddress",
              streetAddress: restaurant.direction,
              addressLocality: "Vichayito",
              addressRegion: "Piura",
              addressCountry: "PE",
              postalCode: "20150"
            },
            servesCuisine: [
              "Peruana",
              "Mariscos",
              "Pizzas",
              "Parrilla",
            ],
            image: "/la-k/images/la-k-logo.png",
            hasMenu: {
              "@type": "Menu",
              name: "Carta Digital de La K",
              url: "https://viw-carta.com/la-k",
              hasMenuSection: data.categories.map((cat) => ({
                "@type": "MenuSection",
                name: cat.name,
                hasMenuItem: cat.meals.map((meal) => ({
                  "@type": "MenuItem",
                  name: meal.name,
                  description: meal.description,
                  offers: {
                    "@type": "Offer",
                    price: meal.price,
                    priceCurrency: "PEN",
                  },
                })),
              })),
            },
          }),
        }}
      />

      <LaKarta
        data={data}
        restaurant={restaurant}
        systemMessages={data.systemMessages}
        isEmbedded={embed}
        hideOrder={hideOrder}
      />
    </div>
  );
}
