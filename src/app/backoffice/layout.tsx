import type { Metadata } from "next";
import { Suspense } from "react";
import NavBarWrapper from "@/components/ui/NavBarWrapper";
import { ActionProvider } from "@/providers/ActionProvider";
import { SmartFAB } from "@/components/ui/smart-fab";
import SessionGuard from "@/components/SessionGuard";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";

export const metadata: Metadata = {
  title: "VIWCarta - Backoffice",
  description: "Administra tu carta con VIWCarta",
};

export default function BackOfficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ActionProvider>
      <Suspense>
        <SessionGuard>
          <SubscriptionGuard>
            <div className="min-h-screen bg-background">
              <NavBarWrapper />
              <main className="relative">
                {children}
                <SmartFAB />
              </main>
            </div>
          </SubscriptionGuard>
        </SessionGuard>
      </Suspense>
    </ActionProvider>
  );
}
