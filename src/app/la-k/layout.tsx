import React from "react";
import localFont from "next/font/local";
import ThemeApplicator from "./components/ThemeApplicator";

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className={`${avenir.variable} min-h-screen text-foreground font-avenir`}
    >
      <ThemeApplicator />
      {children}
    </main>
  );
}
