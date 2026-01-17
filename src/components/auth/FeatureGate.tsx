"use client";

import * as React from "react";
import { Lock, Sparkles } from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { FeatureKey } from "@/config/permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FeatureGateProps {
  children: React.ReactNode;
  feature: FeatureKey;
  fallback?: React.ReactNode;
  /**
   * If true, hides the component completely if no access.
   * If false (default), shows the component in a "disabled/locked" state.
   */
  hideIfRestricted?: boolean;
}

export function FeatureGate({
  children,
  feature,
  fallback,
  hideIfRestricted = false,
}: FeatureGateProps) {
  const { can, isLoading } = usePermission();

  // Don't flash locked state while checking
  if (isLoading)
    return <div className="animate-pulse opacity-50">{children}</div>;

  if (can(feature)) {
    return <>{children}</>;
  }

  if (hideIfRestricted) {
    return <>{fallback}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Upsell UI (Locked State)
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-flex items-center justify-center group cursor-not-allowed">
            {/* Overlay to block interactions */}
            <div
              className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] rounded-md "
              aria-hidden="true"
            />

            {/* The actual content (dimmed) */}
            <div className="opacity-40 pointer-events-none select-none grayscale filter">
              {children}
            </div>

            {/* Lock Icon Badge */}
            <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="bg-emerald-600/90 text-white p-2 rounded-full shadow-lg shadow-emerald-900/20 ring-2 ring-white/10 group-hover:scale-110 transition-transform">
                <Lock size={12} />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="flex flex-col gap-2 p-3 max-w-[250px]"
        >
          <div className="flex items-center gap-2 font-semibold text-emerald-500">
            <Sparkles size={14} className="fill-emerald-500" />
            <span>Función Premium</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Actualiza tu plan para desbloquear esta funcionalidad.
          </p>
          <Link href="/backoffice/settings/billing" passHref>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-1 h-7 text-xs border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-500"
            >
              Ver Planes
            </Button>
          </Link>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
