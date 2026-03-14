import StandardMenu from "@/components/templates/StandardMenu";

export const dynamic = "force-dynamic";
export const revalidate = 60;

async function getData() {
  const subdomain = "larinconada";
  const baseUrl =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://viw-carta.com");

  try {
    const res = await fetch(`${baseUrl}/api/public/menu/${subdomain}`, {
      next: { tags: [`menu-${subdomain}`] },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (e) {
    console.error("Error fetching menu data for La Rinconada:", e);
    return null;
  }
}

export default async function LaRinconadaEmbedPage() {
  const data = await getData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground p-4">
        <div className="text-center">
          <p className="font-bold text-lg">La Rinconada</p>
          <p className="text-sm">Contenido no disponible en este momento</p>
        </div>
      </div>
    );
  }

  // Override commercial data with VeryFazty contact info as requested
  const modifiedRestaurant = {
    ...data.restaurant,
    businessType: "store" as const, // Force StoreCatalog design
    phone: "51924380097", // VeryFazty WhatsApp number
    direction: "Servicio de Delivery - VeryFazty",
    location: "", // Clear original location
    description: "Catálogo gestionado por VeryFazty",
  };

  return (
    <div className="min-h-screen bg-background">
      <StandardMenu data={data} restaurant={modifiedRestaurant} />
    </div>
  );
}
