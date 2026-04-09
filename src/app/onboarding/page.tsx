import { redirect } from "next/navigation";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurantId?: string }>;
}) {
  const { restaurantId } = await searchParams;
  
  if (restaurantId) {
    redirect(`/onboarding/welcome?restaurantId=${restaurantId}`);
  }
  
  redirect("/backoffice");
}
