import React from "react";
import localFont from "next/font/local";
import type { Metadata } from "next";
import styles from "./theme.module.css"; // Import CSS module theme

const avenir = localFont({
  src: [
    {
      path: "../../../public/la-k/fonts/Avenir Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-avenir",
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "La K - El mejor restaurante de todo vichayito",
    description:
      "Descubre el menú de La K, el restaurante más popular de Vichayito. Disfruta de platos deliciosos y auténticos en un ambiente acogedor.",
    icons: {
      icon: `/la-k/images/favicon.ico`,
    },
    alternates: {
      canonical: `https://tu-dominio.com/la-k`,
    },
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className={`${avenir.variable} ${styles.themeLaK} min-h-screen text-foreground font-avenir`}
    >
      {children}
    </main>
  );
}
