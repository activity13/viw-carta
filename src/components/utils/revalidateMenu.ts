"use server";
import axios from "axios";

export async function revalidateMenu(slug: string) {
  try {
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/revalidate-menu`, {
      secret: process.env.REVALIDATE_SECRET,
      slug,
    });
    console.log("✅ Revalidación instantánea ejecutada");
  } catch (error) {
    console.error("❌ Error al revalidar menú:", error);
  }
}
