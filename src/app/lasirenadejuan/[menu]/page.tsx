import Carta from "../components/Carta";
import { getPublicMenuData } from "@/lib/public-menu";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 60;

type Props = {
  params: Promise<{ menu: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { menu } = await params;
  const subdomain = "lasirenadejuan";
  const data = await getPublicMenuData(subdomain);
  
  const sections = data.restaurant.menuSections || [];
  const isValidMenu = sections.some(s => s.slug === menu);
  if (!isValidMenu) return {};

  const restaurantName = data.restaurant.name || "La Sirena de Juan";
  const sectionName = sections.find(s => s.slug === menu)?.name || menu;

  return {
    title: `${sectionName} — ${restaurantName}`,
    description: `Explora nuestra selección de ${sectionName.toLowerCase()}.`,
    icons: {
      icon: `/lasirenadejuan/images/LOGO.svg`,
    },
    openGraph: {
      title: `${sectionName} — ${restaurantName}`,
      images: [{ url: "/lasirenadejuan/images/LOGO.svg" }],
    },
  };
}

export default async function MenuPage({ params }: Props) {
  const { menu } = await params;
  const subdomain = "lasirenadejuan";
  const data = await getPublicMenuData(subdomain);

  const sections = data.restaurant.menuSections || [];
  const isValidMenu = sections.some(s => s.slug === menu);

  if (!isValidMenu) {
    notFound();
  }

  const restaurant = {
    ...data.restaurant,
    id: data.restaurant.id,
    name: data.restaurant.name,
    slug: data.restaurant.slug,
    phone: data.restaurant.phone,
    direction: data.restaurant.direction,
    location: data.restaurant.location,
    description: data.restaurant.description,
    image: data.restaurant.image,
  };

  return (
    <Carta
      data={data}
      restaurant={restaurant}
      systemMessages={data.systemMessages}
      activeMenu={menu as "carta" | "bebidas" | "nigiris"}
    />
  );
}
