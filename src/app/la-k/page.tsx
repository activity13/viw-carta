import Header from "./components/Header";
import LaKarta from "./components/Karta";
import { getPublicMenuData } from "@/lib/public-menu";

// interface catProps {
//   name: string;
// }

export const revalidate = 60; // revalida cada minuto o al revalidateTag()

export default async function LaK() {
  const subdomain = "la-k";
  const data = await getPublicMenuData(subdomain);

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
