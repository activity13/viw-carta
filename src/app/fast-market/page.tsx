import { Suspense } from "react";
import MarketView from "./components/MarketView";
import { getPublicMenuData } from "@/lib/public-menu";

export const revalidate = 60;

export default async function MarketVichayitoPage() {
  const subdomain = "fast-market"; // TODO: Confirm this subdomain exists or use a fallback for dev

  let data = null;
  let error = null;

  try {
    data = await getPublicMenuData(subdomain);
  } catch (e) {
    console.error(e);
    // Fallback for development if the specific market tenant doesn't exist yet
    if (process.env.NODE_ENV === "development") {
      try {
        console.warn(`Subdomain ${subdomain} not found, falling back to 'la-k' for demo purposes.`);
        data = await getPublicMenuData("la-k");
      } catch (fallbackError) {
        error = fallbackError;
      }
    } else {
      error = e;
    }
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Fast Market</h1>
          <p>Próximamente. (Error cargando datos)</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense>
      <MarketView data={data as unknown as Parameters<typeof MarketView>[0]["data"]} />
    </Suspense>
  );
}
