"use client";

import React from "react";
import CategoryUI from "@/components/categoryUI";
import { useSession } from "next-auth/react";
export default function CategoriesPage() {
  // Aquí puedes obtener el restaurantId de alguna manera, por ejemplo, de la sesión o props

  const { data: session } = useSession();
  const restaurantId = session?.user?.restaurantId;

  if (!restaurantId) return null;

  return (
    <>
      <CategoryUI restaurantId={restaurantId} />
    </>
  );
}
