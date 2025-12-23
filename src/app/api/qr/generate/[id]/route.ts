import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { connectToDatabase } from "@/lib/mongodb";
import Restaurant from "@/models/restaurants";
import { UTApi } from "uploadthing/server";
import { requireAuth, handleAuthError } from "@/lib/auth-helpers";

const utapi = new UTApi();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth("staff");
    const secureRestaurantId = session.user.restaurantId;

    const { id } = await params;

    if (id !== secureRestaurantId) {
      return NextResponse.json(
        { error: "No tienes permiso para generar el QR de este restaurante" },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const business = await Restaurant.findById(id);
    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    let frameBuffer: Buffer;

    // 📍 Obtener el marco (URL o Local)
    if (business.frameQR && business.frameQR.startsWith("http")) {
      const response = await fetch(business.frameQR);
      if (!response.ok) throw new Error("No se pudo descargar el marco QR");
      const arrayBuffer = await response.arrayBuffer();
      frameBuffer = Buffer.from(arrayBuffer);
    } else {
      // Legacy: Archivo local
      const publicDir = path.join(process.cwd(), "public");
      const framePath = path.join(
        publicDir,
        business.slug,
        "images",
        business.frameQR
      );

      if (!fs.existsSync(framePath)) {
        return NextResponse.json(
          { error: "No existe el marco QR" },
          { status: 400 }
        );
      }
      frameBuffer = fs.readFileSync(framePath);
    }

    // 1️⃣ Generar QR temporal
    const qrData = `https://${business.slug}.viw-carta.com`;
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: 600,
      color: { dark: "#000000", light: "#0000" }, // fondo transparente
    });

    // 2️⃣ Combinar con el marco usando Sharp
    const finalQrBuffer = await sharp(frameBuffer)
      .composite([{ input: qrBuffer, gravity: "center" }]) // centra el QR sobre el marco
      .png()
      .toBuffer();

    // 3️⃣ Subir a UploadThing
    const file = new File(
      [new Uint8Array(finalQrBuffer)],
      `qr-${business.slug}.png`,
      {
        type: "image/png",
      }
    );

    // 🗑️ Eliminar QR anterior si existe en UploadThing
    if (
      business.QrCode &&
      business.QrCode.startsWith("http") &&
      (business.QrCode.includes("ufs.sh") ||
        business.QrCode.includes("utfs.io") ||
        business.QrCode.includes("uploadthing"))
    ) {
      const oldKey = business.QrCode.split("/").pop();
      if (oldKey) {
        await utapi.deleteFiles(oldKey);
        console.log("Deleted old QR:", oldKey);
      }
    }

    const response = await utapi.uploadFiles([file]);

    if (response[0].error) {
      throw new Error(response[0].error.message);
    }

    const uploadedUrl = response[0].data.ufsUrl;

    // 4️⃣ Guardar URL en BD
    business.QrCode = uploadedUrl;
    await business.save();

    return NextResponse.json({
      success: true,
      message: "QR generado y subido correctamente",
      qrPath: uploadedUrl,
    });
  } catch (err) {
    console.error("❌ Error generando el QR:", err);
    return handleAuthError(err);
  }
}
