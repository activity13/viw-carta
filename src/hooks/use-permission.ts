"use client";

import { useSession } from "next-auth/react";
import {
  FeatureKey,
  hasPermission,
  SubscriptionPlan,
} from "@/config/permissions";

export function usePermission() {
  const { data: session, status } = useSession();

  const currentPlan =
    (session?.user?.subscriptionPlan as SubscriptionPlan) || "standard";
  const isLoading = status === "loading";

  const can = (feature: FeatureKey) => {
    if (isLoading) return false; // Fail safe while loading
    return hasPermission(currentPlan, feature);
  };

  return {
    can,
    plan: currentPlan,
    isLoading,
  };
}
