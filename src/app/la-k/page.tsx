import Header from "./components/Header";
import LaKarta from "./components/Karta";

// interface catProps {
//   name: string;
// }

export const dynamic = "force-dynamic";
export const revalidate = 60; // revalida cada minuto o al revalidateTag()

export default async function LaK() {
  const subdomain = "la-k";

  // Usa el dominio correcto según el entorno
  const baseUrl =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://viw-carta.com");

  const res = await fetch(`${baseUrl}/api/public/menu/${subdomain}`, {
    next: { tags: [`menu-${subdomain}`] },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch menu");
  }

  const data = await res.json();

  // Encontramos la categoría "Plato del día"
  // const platoDelDiaCategory = data?.categories?.find(
  //   (cat: catProps) => cat.name.toLowerCase() === "plato del día"
  // );

  // Aseguramos que tenga al menos un plato
  // const platoDelDia = platoDelDiaCategory?.meals?.[0];
  return (
    <div className=" min-h-screen bg-background">
      <Header restaurant={data.restaurant} />
      {/* {platoDelDia && (
        <PlatoDelDia
          name={platoDelDia.name}
          description={platoDelDia.shortDescription || platoDelDia.description}
          price={platoDelDia.price}
          ingredients={platoDelDia.ingredients}
        />
      )} */}
      <LaKarta
        data={data}
        restaurant={data.restaurant}
        systemMessages={data.systemMessages}
      />
    </div>
  );
}
