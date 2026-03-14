import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import styles from "./theme.module.css";
import ThemeClient from "./ThemeClient";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://viw-carta.com")
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

export const metadata: Metadata = {
  metadataBase,
  title: "La Rinconada - Catálogo Digital VeryFazty",
  description: "Descubre los productos de La Rinconada. Pedidos rápidos a través de VeryFazty.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "La Rinconada - Catálogo Digital",
    description: "Descubre los productos de La Rinconada. Pedidos rápidos a través de VeryFazty.",
    siteName: "La Rinconada",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
};

export default function LaRinconadaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ThemeClient
        fontVariableClasses={`${lilitaOne.variable} ${nunito.variable}`}
      />
      <main
        className={`${lilitaOne.variable} ${nunito.variable} ${styles.themeFastMarket} font-nunito antialiased bg-background text-foreground`}
      >
        <div id="top" className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </main>
    </>
  );
}
