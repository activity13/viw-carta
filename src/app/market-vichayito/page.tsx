import MarketView from "./components/MarketView";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function MarketVichayitoPage() {
  const subdomain = "market-vichayito"; // TODO: Confirm this subdomain exists or use a fallback for dev

  const baseUrl =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://viw-carta.com");

  let data = null;
  let error = null;

  try {
    const res = await fetch(`${baseUrl}/api/public/menu/${subdomain}`, {
      next: { tags: [`menu-${subdomain}`] },
    });

    if (!res.ok) {
      // Fallback for development if the specific market tenant doesn't exist yet
      // We try 'la-k' just to show some data, or we show an empty state.
      // For now, let's try to fetch 'la-k' as a fallback if in dev, to demonstrate the UI.
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Subdomain ${subdomain} not found, falling back to 'la-k' for demo purposes.`
        );
        const fallbackRes = await fetch(`${baseUrl}/api/public/menu/la-k`, {
          next: { tags: ["menu-la-k"] },
        });
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        } else {
          throw new Error("Failed to fetch menu (fallback)");
        }
      } else {
        throw new Error("Failed to fetch menu");
      }
    } else {
      data = await res.json();
    }
  } catch (e) {
    console.error(e);
    error = e;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Market Vichayito</h1>
          <p>Próximamente. (Error cargando datos)</p>
        </div>
      </div>
    );
  }

  return <MarketView data={data} />;
}
