import SirenaLanding from "./components/SirenaLanding";
import { getPublicMenuData } from "@/lib/public-menu";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const subdomain = "lasirenadejuan";
  const data = await getPublicMenuData(subdomain);
  const restaurantName = data.restaurant.name || "La Sirena de Juan";

  return {
    title: `${restaurantName} — Bienvenido`,
    description: data.restaurant.description || "Descubre nuestra propuesta gastronómica.",
    icons: {
      icon: `/lasirenadejuan/images/LOGO.svg`,
    },
    alternates: {
      canonical: `https://viw-carta.com/lasirenadejuan`,
    },
    openGraph: {
      title: `${restaurantName} — Bienvenido`,
      description: data.restaurant.description || "Carta Digital",
      url: "https://viw-carta.com/lasirenadejuan",
      siteName: restaurantName,
      locale: "es_PE",
      type: "website",
      images: [
        {
          url: "/lasirenadejuan/images/LOGO.svg",
          width: 600,
          height: 600,
          alt: `Logo de ${restaurantName}`,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LaSirenaDeJuan() {
  const subdomain = "lasirenadejuan";
  const data = await getPublicMenuData(subdomain);

  const restaurant = {
    ...data.restaurant,
    id: data.restaurant.id,
    name: data.restaurant.name,
    slug: data.restaurant.slug,
    phone: data.restaurant.phone,
    direction: data.restaurant.direction,
    location: data.restaurant.location,
    description: data.restaurant.description,
    image: data.restaurant.image,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: restaurant.name,
            description: restaurant.description,
            url: "https://viw-carta.com/lasirenadejuan",
            telephone: restaurant.phone,
            address: {
              "@type": "PostalAddress",
              streetAddress: restaurant.direction,
              addressCountry: "PE",
            },
            image: "/lasirenadejuan/images/LOGO.svg",
          }),
        }}
      />

      <SirenaLanding
        restaurant={restaurant}
      />
    </div>
  );
}
