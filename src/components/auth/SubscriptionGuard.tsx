"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Loader2 } from "lucide-react";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [showBlocker, setShowBlocker] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    // Bypasses
    if (session.user.role === "superadmin") {
      setShowBlocker(false);
      return;
    }

    // Allow access to billing page always
    if (pathname?.startsWith("/backoffice/billing")) {
      setShowBlocker(false);
      return;
    }

    const subStatus = session.user.subscriptionStatus;

    // Block if past_due or canceled
    if (subStatus === "past_due" || subStatus === "canceled") {
      setShowBlocker(true);
    } else {
      setShowBlocker(false);
    }
  }, [session, status, pathname]);

  // Don't render anything while loading session to avoid flash (optional)
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {children}

      <Dialog open={showBlocker} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px] [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Suscripción Requerida
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tu suscripción se encuentra actualmente en estado{" "}
              <span className="font-bold text-foreground">
                {session?.user?.subscriptionStatus === "past_due"
                  ? "Vencida"
                  : "Cancelada"}
              </span>
              .
              <br />
              <br />
              Para continuar accediendo a todas las funciones del sistema, por
              favor actualiza tu método de pago o contacta a soporte.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={() => router.push("/backoffice/billing")}
              className="w-full gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Ir a Facturación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
