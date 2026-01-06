import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import styles from "./theme.module.css";
import Link from "next/link";
import SmoothScrollToTopLink from "./SmoothScrollToTopLink";
import Image from "next/image";
import ThemeClient from "./ThemeClient";
import NavbarSearch from "./components/NavbarSearch";
// Base URL for metadata (used by Next.js to resolve absolute OG/Twitter image URLs)
export const metadataBase = new URL(
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
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center">
                  <Link
                    href="/fast-market"
                    className="flex items-center gap-3 group"
                  >
                    <Image
                      src={`/${restaurant.slug}/images/logo.jpeg`}
                      alt={`${restaurant.name} Logo`}
                      width={40}
                      height={40}
                      className="rounded-xl"
                    />
                    <span className="font-lilita text-2xl text-foreground group-hover:text-primary transition-colors">
                      {restaurant.name}
                    </span>
                  </Link>
                </div>

                {/* Search */}
                <div className="hidden md:flex flex-1 justify-center px-6">
                  <NavbarSearch />
                </div>

                {/* Navigation Links */}
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-8">
                    <SmoothScrollToTopLink
                      href="/fast-market"
                      className="text-muted-foreground hover:text-primary px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Inicio
                    </SmoothScrollToTopLink>
                    <Link
                      href="#"
                      className="text-muted-foreground hover:text-primary px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Nosotros
                    </Link>
                    {restaurant.phone && (
                      <Link
                        href={`https://wa.me/${restaurant.phone}`}
                        target="_blank"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <span>💬</span> WhatsApp
                      </Link>
                    )}
                  </div>
                </div>

                {/* Mobile menu button placeholder - functionality would need client component */}
                <div className="md:hidden">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-primary p-2"
                  >
                    <span className="sr-only">Abrir menú</span>
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Search */}
              <div className="md:hidden pb-4">
                <NavbarSearch />
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="bg-foreground text-background/80">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Logo & Description */}
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <Image
                      src={`/${restaurant.slug}/images/logo.jpeg`}
                      alt={`${restaurant.name} Logo`}
                      width={40}
                      height={40}
                      className="rounded-xl"
                    />
                    <span className="font-lilita text-xl text-background">
                      {restaurant.name}
                    </span>
                  </div>
                  <p className="text-background/70 mb-4 max-w-md text-sm leading-relaxed">
                    Comprometidos con la calidad y el servicio. Llevamos los
                    mejores productos directamente a tu puerta, garantizando
                    frescura y satisfacción en cada entrega.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                    Explorar
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <SmoothScrollToTopLink
                        href="/fast-market"
                        className="hover:text-primary transition-colors"
                      >
                        Catálogo Completo
                      </SmoothScrollToTopLink>
                    </li>
                    <li>
                      <Link
                        href="#"
                        className="hover:text-primary transition-colors"
                      >
                        Zona de Reparto
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                    Contacto
                  </h3>
                  <ul className="space-y-3 text-sm text-background/70">
                    {restaurant.phone && <li>WhatsApp: {restaurant.phone}</li>}
                    {restaurant.email && <li>Email: {restaurant.email}</li>}
                    <li>Atención al cliente</li>
                  </ul>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-background/20 text-xs text-background/60 flex flex-col md:flex-row justify-between items-center">
                <p>
                  © {new Date().getFullYear()} {restaurant.name}. Todos los
                  derechos reservados.
                </p>
                <div className="mt-4 md:mt-0 flex space-x-6">
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Privacidad
                  </Link>
                  <Link
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Términos y Condiciones
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
