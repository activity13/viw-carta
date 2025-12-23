import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import fs from "fs";
import Restaurant from "@/models/restaurants";
import path from "path";
import { UTApi } from "uploadthing/server";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

const utapi = new UTApi();

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth("admin"); // Settings usually require admin
    const secureRestaurantId = session.user.restaurantId;

    await connectToDatabase();
    const formData = await req.formData();
    const { id } = await params;

    // Security Check: Ensure user owns the restaurant
    if (id !== secureRestaurantId) {
      return NextResponse.json(
        { error: "No tienes permiso para editar este restaurante" },
        { status: 403 }
      );
    }

    const entries = Array.from(formData.entries());
    const updateData: Record<string, string> = {};

    const currentBusiness = await Restaurant.findById(id);

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

    // Handle deletions from UploadThing
    if (currentBusiness) {
      // Check image
      if (
        updateData.image !== undefined &&
        updateData.image !== currentBusiness.image
      ) {
        if (
          currentBusiness.image &&
          (currentBusiness.image.includes("ufs.sh") ||
            currentBusiness.image.includes("utfs.io") ||
            currentBusiness.image.includes("uploadthing"))
        ) {
          const key = currentBusiness.image.split("/").pop();
          if (key) {
            await utapi.deleteFiles(key);
            console.log("Deleted old logo via API:", key);
          }
        }
      }
      // Check frameQR
      if (
        updateData.frameQR !== undefined &&
        updateData.frameQR !== currentBusiness.frameQR
      ) {
        if (
          currentBusiness.frameQR &&
          (currentBusiness.frameQR.includes("ufs.sh") ||
            currentBusiness.frameQR.includes("utfs.io") ||
            currentBusiness.frameQR.includes("uploadthing"))
        ) {
          const key = currentBusiness.frameQR.split("/").pop();
          if (key) {
            await utapi.deleteFiles(key);
            console.log("Deleted old frame via API:", key);
          }
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
