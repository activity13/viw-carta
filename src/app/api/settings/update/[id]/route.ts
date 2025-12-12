import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import fs from "fs";
import Restaurant from "@/models/restaurants";
import path from "path";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const formData = await req.formData();
    const { id } = await params;
    const entries = Array.from(formData.entries());
    const updateData: Record<string, string> = {};

    console.log(
      "🟡 Campos recibidos:",
      entries.map(([k, v]) => [k, typeof v])
    );

    for (const [key, value] of entries) {
      console.log("🔵 Procesando campo:", key, typeof value);
      if (typeof value === "string") {
        // Handle theme object specially
        if (key === "theme") {
          try {
            updateData[key] = JSON.parse(value.trim());
          } catch {
            updateData[key] = value.trim();
          }
        } else {
          // Campos de texto
          updateData[key] = value.trim();
        }
      } else if (value instanceof Blob) {
        const file = value as File;
        if (file.size > 0) {
          console.log("🟢 Guardando archivo:", file.name);

          if (process.env.NODE_ENV === "development") {
            // 🧩 Buscar el negocio para obtener el slug
            const business = await Restaurant.findById(id);
            const slug = business?.slug || "temp";

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const dir = path.join(process.cwd(), "public", slug, "images");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            const filePath = path.join(dir, file.name);
            await fs.promises.writeFile(filePath, buffer);

            console.log("✅ Archivo guardado en:", filePath);
          } else {
            console.log("⚠️ Saltando guardado (producción).");
          }

          // Guardar el nombre en BD
          updateData[key.replace("File", "")] = file.name;
        } else {
          console.log("⚠️ Archivo vacío, no guardado:", key);
        }
      }
    }

    console.log("🟩 Datos a actualizar:", updateData);

    const updatedBusiness = await Restaurant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    console.log("🚀 ~ route.ts:66 ~ PUT ~ updatedBusiness:", updatedBusiness);

    if (!updatedBusiness)
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );

    return NextResponse.json({
      message: "Tu negocio ha sido actualizado correctamente.",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("🚨 Error updsating business:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
