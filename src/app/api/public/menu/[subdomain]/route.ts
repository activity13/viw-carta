import { NextResponse } from "next/server";
import { getPublicMenuData } from "@/lib/public-menu";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ subdomain: string }> },
) {
  try {
    const { subdomain } = await params;

    // Al usar getPublicMenuData, utilizamos el ISR optimizado (unstable_cache)
    // Esto garantiza que la API pública también responda desde la memoria caché
    const data = await getPublicMenuData(subdomain);

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching menu:", error);
    if (
      error instanceof Error &&
      error.message === "Restaurante no encontrado"
    ) {
      return NextResponse.json(
        { error: "Restaurante no encontrado" },
        { status: 404 },
      );
    }
    if (error instanceof Error && error.message === "Service Suspended") {
      return NextResponse.json({ error: "Service Suspended" }, { status: 402 });
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
