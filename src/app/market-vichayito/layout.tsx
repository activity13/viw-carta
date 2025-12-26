import type { Metadata } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import styles from "./theme.module.css";
import "../globals.css";
import Link from "next/link";

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
    console.error(e);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getData();
  const restaurantName = data?.restaurant?.name || "Market Vichayito";

  return {
    title: `${restaurantName} - Market & Delivery`,
    description: `Bienvenido a ${restaurantName}. Encuentra los mejores productos seleccionados para ti. Calidad, variedad y servicio de primera.`,
    keywords: "market, delivery, productos, calidad, vichayito, compras online",
    openGraph: {
      title: `${restaurantName} - Market & Delivery`,
      description:
        "La mejor selección de productos directamente a tu ubicación.",
      type: "website",
    },
  };
}

export default async function MarketLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getData();
  const restaurant = data?.restaurant || {
    name: "Market Vichayito",
    phone: "123456789",
    email: "contacto@marketvichayito.com",
  };

  return (
    <html lang="es" className="scroll-smooth">
      <head>
        {/* <link rel="icon" href="/favicon.ico" /> */}
        <meta name="theme-color" content="#2563EB" />
      </head>
      <body
        className={`${lilitaOne.variable} ${nunito.variable} ${styles.themeTikiMart} font-nunito antialiased bg-slate-50 text-slate-900`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Header Navigation */}
          <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center">
                  <Link
                    href="/market-vichayito"
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-blue-200 shadow-lg group-hover:scale-105 transition-transform">
                      {restaurant.name.charAt(0)}
                    </div>
                    <span className="font-lilita text-2xl text-slate-800 group-hover:text-blue-600 transition-colors">
                      {restaurant.name}
                    </span>
                  </Link>
                </div>

                {/* Navigation Links */}
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-8">
                    <Link
                      href="/market-vichayito"
                      className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Inicio
                    </Link>
                    <Link
                      href="#"
                      className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Catálogo
                    </Link>
                    <Link
                      href="#"
                      className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Nosotros
                    </Link>
                    {restaurant.phone && (
                      <Link
                        href={`https://wa.me/${restaurant.phone}`}
                        target="_blank"
                        className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
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
                    className="text-slate-500 hover:text-blue-600 p-2"
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
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-300">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Logo & Description */}
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {restaurant.name.charAt(0)}
                    </div>
                    <span className="font-lilita text-xl text-white">
                      {restaurant.name}
                    </span>
                  </div>
                  <p className="text-slate-400 mb-4 max-w-md text-sm leading-relaxed">
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
                      <Link
                        href="/market-vichayito"
                        className="hover:text-blue-400 transition-colors"
                      >
                        Inicio
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="#"
                        className="hover:text-blue-400 transition-colors"
                      >
                        Catálogo Completo
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="#"
                        className="hover:text-blue-400 transition-colors"
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
                  <ul className="space-y-3 text-sm text-slate-400">
                    {restaurant.phone && <li>WhatsApp: {restaurant.phone}</li>}
                    {restaurant.email && <li>Email: {restaurant.email}</li>}
                    <li>Atención al cliente</li>
                  </ul>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center">
                <p>
                  © {new Date().getFullYear()} {restaurant.name}. Todos los
                  derechos reservados.
                </p>
                <div className="mt-4 md:mt-0 flex space-x-6">
                  <Link
                    href="#"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Privacidad
                  </Link>
                  <Link
                    href="#"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Términos y Condiciones
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
