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

export const metadata: Metadata = {
  title: "TikiMart - Mini Market Playero | Rápido, Fresco y Tropical",
  description:
    "TikiMart es tu mini market playero de confianza. Snacks frescos, bebidas heladas y todo lo que necesitas para la playa. Rápido, fresco y siempre listo.",
  keywords:
    "mini market, playa, snacks, bebidas, tropical, rápido, fresco, tikimart, market playero",
  authors: [{ name: "TikiMart Team" }],
  creator: "TikiMart",
  publisher: "TikiMart",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "TikiMart - Mini Market Playero",
    description:
      "Todo lo que necesitas para la playa, aquí nomás. Snacks frescos, bebidas heladas y más.",
    url: "https://tikimart.com",
    siteName: "TikiMart",
    images: [
      {
        url: "/og-tikimart.jpg",
        width: 1200,
        height: 630,
        alt: "TikiMart - Mini Market Playero",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TikiMart - Mini Market Playero",
    description: "Todo lo que necesitas para la playa, aquí nomás. 🏖️",
    images: ["/og-tikimart.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function TikiMarketLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon-tikimart.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon-tikimart.png"
        />
        <link rel="manifest" href="/site-tikimart.webmanifest" />
        <meta name="theme-color" content="#19D3D1" />
        <meta name="msapplication-TileColor" content="#19D3D1" />
      </head>
      <body
        className={`${lilitaOne.variable} ${nunito.variable} ${styles.themeTikiMart} font-nunito antialiased bg-white text-gray-900`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Header Navigation */}
          <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#A3E8D8]/20">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#19D3D1] to-[#A3E8D8] rounded-2xl flex items-center justify-center text-xl">
                        🗿
                      </div>
                      <span className="font-lilita text-2xl text-[#1A1A1A]">
                        TikiMart
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-8">
                    <Link
                      href="/tikimarket"
                      className="text-[#1A1A1A] hover:text-[#19D3D1] px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Inicio
                    </Link>
                    <Link
                      href="/tikimarket/catalogo"
                      className="text-[#1A1A1A] hover:text-[#19D3D1] px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Catálogo
                    </Link>
                    <Link
                      href="/tikimarket/sobre-nosotros"
                      className="text-[#1A1A1A] hover:text-[#19D3D1] px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Sobre Nosotros
                    </Link>
                    <Link
                      href="https://wa.me/1234567890"
                      target="_blank"
                      className="bg-[#25D366] text-white hover:bg-[#25D366]/90 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <span>💬</span> WhatsApp
                    </Link>
                  </div>
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    type="button"
                    className="bg-[#A3E8D8]/10 inline-flex items-center justify-center p-2 rounded-xl text-[#1A1A1A] hover:text-[#19D3D1] hover:bg-[#A3E8D8]/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#19D3D1]"
                  >
                    <span className="sr-only">Abrir menú principal</span>
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
          <footer className="bg-[#1A1A1A] text-white">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Logo & Description */}
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#19D3D1] to-[#A3E8D8] rounded-xl flex items-center justify-center text-lg">
                      🗿
                    </div>
                    <span className="font-lilita text-xl">TikiMart</span>
                  </div>
                  <p className="text-gray-300 mb-4 max-w-md">
                    Mini market virtual con los mejores precios. Delivery rápido
                    y sin gastos de local físico.
                  </p>
                  <div className="flex space-x-4">
                    <a
                      href="#"
                      className="text-[#A3E8D8] hover:text-[#19D3D1] transition-colors"
                    >
                      <span className="sr-only">Instagram</span>
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.349-1.052-2.349-2.35 0-1.297 1.052-2.349 2.349-2.349 1.298 0 2.35 1.052 2.35 2.349 0 1.298-1.052 2.35-2.35 2.35zm7.103 0c-1.297 0-2.349-1.052-2.349-2.35 0-1.297 1.052-2.349 2.349-2.349s2.35 1.052 2.35 2.349c0 1.298-1.053 2.35-2.35 2.35z" />
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                    Enlaces Rápidos
                  </h3>
                  <ul className="space-y-3">
                    <li>
                      <Link
                        href="/tikimarket"
                        className="text-gray-300 hover:text-[#19D3D1] transition-colors"
                      >
                        Inicio
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/tikimarket/catalogo"
                        className="text-gray-300 hover:text-[#19D3D1] transition-colors"
                      >
                        Catálogo
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/tikimarket/sobre-nosotros"
                        className="text-gray-300 hover:text-[#19D3D1] transition-colors"
                      >
                        Sobre Nosotros
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="https://wa.me/1234567890"
                        target="_blank"
                        className="text-gray-300 hover:text-[#19D3D1] transition-colors"
                      >
                        WhatsApp
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                    Contacto
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li>💬 WhatsApp: +1 (555) 123-4567</li>
                    <li>✉️ hola@tikimart.com</li>
                    <li>🕒 Atención 24/7</li>
                    <li>🚀 Delivery disponible</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    © 2025 TikiMart. Todos los derechos reservados.
                  </p>
                  <div className="mt-4 md:mt-0">
                    <div className="flex space-x-6 text-sm text-gray-400">
                      <Link
                        href="#"
                        className="hover:text-[#19D3D1] transition-colors"
                      >
                        Privacidad
                      </Link>
                      <Link
                        href="#"
                        className="hover:text-[#19D3D1] transition-colors"
                      >
                        Términos
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "TikiMart",
              description:
                "Mini market playero especializado en snacks frescos, bebidas heladas y productos de playa",
              url: "https://tikimart.com",
              logo: "https://tikimart.com/logo.png",
              image: "https://tikimart.com/og-tikimart.jpg",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Playa Principal",
                addressCountry: "ES",
              },
              openingHours: "Mo-Su 08:00-20:00",
              telephone: "+1-555-123-4567",
              email: "hola@tikimart.com",
              priceRange: "$",
              servesCuisine: "Snacks, Beverages, Beach Products",
            }),
          }}
        />
      </body>
    </html>
  );
}
