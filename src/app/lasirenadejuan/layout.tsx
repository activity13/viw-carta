import React from "react";
import localFont from "next/font/local";
import { Playfair_Display, Open_Sans } from "next/font/google";
import ThemeApplicator from "./components/ThemeApplicator";

const avenir = localFont({
  src: [
    {
      path: "../../../public/lasirenadejuan/fonts/Avenir Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-avenir",
});

const frizQuadrata = localFont({
  src: [
    {
      path: "../../../public/lasirenadejuan/fonts/friz-quadrata.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-friz",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["700", "800"],
  display: "swap",
});

export default function SirenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className={`${avenir.variable} ${frizQuadrata.variable} ${playfair.variable} ${openSans.variable} min-h-screen text-foreground font-avenir overflow-x-hidden w-full`}
    >
      <ThemeApplicator />
      {children}
    </main>
  );
}
