import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Lilita_One, Nunito } from "next/font/google";
import { Suspense } from "react";
import styles from "./theme.module.css";
import ThemeClient from "./ThemeClient";
import NavbarSearch from "./components/NavbarSearch";
import Link from "next/link";
// Base URL for metadata (used by Next.js to resolve absolute OG/Twitter image URLs)
const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://fast-market.viw-carta.com")
);

const lilitaOne = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: "400",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

async function getData() {
  const subdomain = "fast-market";
  const baseUrl =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://viw-carta.com");

  try {
    const res = await fetch(`${baseUrl}/api/public/menu/${subdomain}`, {
      next: { tags: [`menu-${subdomain}`] },
    });
    console.log("Fetched market data for metadata." + res.ok);
    if (!res.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Subdomain ${subdomain} not found, falling back to 'la-k' for demo purposes.`
        );
        const fallbackRes = await fetch(`${baseUrl}/api/public/menu/la-k`, {
          next: { tags: ["menu-la-k"] },
        });
        if (fallbackRes.ok) return await fallbackRes.json();
      }
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();

  return {
    metadataBase,
    title: "Fast Market - Tu Market Digital de la Costanera",
    icons: {
      icon: `/fast-market/images/favicon.ico`,
    },
    description:
      "Fast Market es el mejor market digital con catálogo 100% dinámico para la costanera de Vichayito y Las Pocitas. Descubre productos frescos, variedad y entrega rápida.",
    keywords:
      "fast market, market digital, catálogo dinámico, costanera vichayito, las pocitas, compras online, delivery, productos frescos, tienda online",
    authors: [{ name: "Viw Carta" }],
    creator: "Viw Carta",
    publisher: "Viw Carta",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: "Fast Market - Catálogo Digital 100% Dinámico",
      description:
        "Descubre el mejor market digital de la costanera de Vichayito y Las Pocitas. Catálogo dinámico con productos frescos y entrega rápida.",
      url: "https://fast-market.viw-carta.com",
      siteName: "Fast Market",
      images: [
        {
          url: data?.restaurant?.image || "/default-fastmarket-image.jpeg",
          width: 1200,
          height: 630,
          alt: "Fast Market - Catálogo Digital",
        },
      ],
      locale: "es_PE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Fast Market - Tu Market Digital",
      description:
        "Catálogo 100% dinámico para la costanera de Vichayito y Las Pocitas. Productos frescos y delivery rápido.",
      images: [data?.restaurant?.image || "/default-fastmarket-image.jpeg"],
      creator: "@viwcarta",
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "tu-codigo-de-verificacion-google",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#2563EB",
};

export default async function MarketLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getData();
  // Normalize phone: remove non-digit characters to use in wa.me links
  const rawPhone = data?.restaurant?.phone || "123456789";
  const normalizedPhone = String(rawPhone).replace(/\D/g, "");

  const restaurant = {
    ...(data?.restaurant || {}),
    name: data?.restaurant?.name || "Fast Market",
    phone: normalizedPhone,
    email: data?.restaurant?.email || "contacto@viw-carta.com",
  } as const;

  return (
    <>
      <ThemeClient
        fontVariableClasses={`${lilitaOne.variable} ${nunito.variable}`}
      />
      <main
        className={`${lilitaOne.variable} ${nunito.variable} ${styles.themeFastMarket} font-nunito antialiased bg-background text-foreground`}
      >
        <div id="top" className="min-h-screen flex flex-col">
          {/* Header Navigation */}
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
            <nav className="max-w-7xl py-2 mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
              <Link
                href="/fast-market"
                className="flex items-center gap-2 group shrink-0"
              >
                <Image
                  src={`/${restaurant.slug}/images/logo.jpeg`}
                  alt={`${restaurant.name} Logo`}
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
                <span className="hidden md:inline font-lilita text-2xl text-foreground group-hover:text-primary transition-colors">
                  {restaurant.name}
                </span>
              </Link>
              {/* Search */}
              <div className="flex flex-1 min-w-0 justify-center px-3 sm:px-6">
                <Suspense
                  fallback={
                    <div className="w-full max-w-md h-10 rounded-xl bg-muted" />
                  }
                >
                  <NavbarSearch />
                </Suspense>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </main>
    </>
  );
}
