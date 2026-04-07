import { redirect } from "next/navigation";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { restaurantId?: string };
}) {
  const restaurantId = searchParams.restaurantId;
  
  if (restaurantId) {
    redirect(`/onboarding/welcome?restaurantId=${restaurantId}`);
  }
  
  redirect("/backoffice");
}
