import React from "react";
import localFont from "next/font/local";
import { Montserrat } from "next/font/google";
import type { Metadata } from "next";
import styles from "./theme.module.css";
import { MenuProvider } from "./menu-context";
import { LanguageProvider } from "@/hooks/useLanguage";

const huaPrimary = localFont({
  src: [
    {
      path: "../../../public/hua-puntasal/fonts/primary-hua.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-primary-hua",
});

const montserrat = Montserrat({ subsets: ["latin"] });

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Hua de Punta Sal - El mejor restaurante de todo Punta Sal",
    description:
      "Descubre el menú de Hua de Punta Sal, el restaurante más popular del balneario de punta sal. Disfruta de platos deliciosos y auténticos en un ambiente acogedor.",
    icons: {
      icon: `/hua-puntasal/images/favicon.ico`,
    },
    alternates: {
      canonical: `https://viw-carta.com/hua-puntasal`,
    },
  };
}

async function getMenuData() {
  const subdomain = "hua-puntasal";

  const baseUrl =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://viw-carta.com");

  const res = await fetch(`${baseUrl}/api/public/menu/${subdomain}`, {
    next: { tags: [`menu-${subdomain}`] },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch menu");
  }

  return res.json();
}

export default async function HuaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuData = await getMenuData();

  return (
    <div
      className={`${styles.huaTheme} min-h-screen bg-hua-white text-hua-gray ${montserrat.className} ${huaPrimary.variable}`}
    >
      <LanguageProvider>
        <MenuProvider data={menuData}>{children}</MenuProvider>
      </LanguageProvider>
    </div>
  );
}
