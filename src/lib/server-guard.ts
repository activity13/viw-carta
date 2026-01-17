import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  FeatureKey,
  hasPermission,
  SubscriptionPlan,
} from "@/config/permissions";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * Checks permission in a Server Component or Server Action.
 * Redirects to billing page if access is denied.
 * @param feature The feature key to check
 * @param redirectTo Optional custom redirect path
 */
export async function protectPage(
  feature: FeatureKey,
  redirectTo: string = "/backoffice/billing?upgrade=true"
) {
  const session = await getServerSession(authOptions);
  const plan =
    (session?.user?.subscriptionPlan as SubscriptionPlan) || "standard";

  if (!hasPermission(plan, feature)) {
    redirect(redirectTo);
  }
}

/**
 * Checks permission in an API Route.
 * Returns null if allowed, or a NextResponse (403) if denied.
 * Usage:
 * const error = await checkApiPermission('create_orders');
 * if (error) return error;
 */
export async function checkApiPermission(feature: FeatureKey) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan =
    (session?.user?.subscriptionPlan as SubscriptionPlan) || "standard";

  if (!hasPermission(plan, feature)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "This feature requires a Premium plan.",
        code: "plan_restriction",
      },
      { status: 403 }
    );
  }

  return null; // OK
}
