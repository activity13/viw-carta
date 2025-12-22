import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="marketing"
      className={`min-h-screen bg-background ${inter.className}`}
    >
      {children}
    </div>
  );
}
