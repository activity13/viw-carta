import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { connectToDatabase } from "@/lib/mongodb";
import Restaurant from "@/models/restaurants";
import { Readable } from "stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connectToDatabase();
    const business = await Restaurant.findById(id);
    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    let arrayBuffer: ArrayBuffer;

    // Check if QrCode is a URL (UploadThing)
    if (business.QrCode && business.QrCode.startsWith("http")) {
      const response = await fetch(business.QrCode);
      if (!response.ok) {
        return NextResponse.json(
          { error: "No se pudo descargar el QR remoto" },
          { status: 404 }
        );
      }
      arrayBuffer = await response.arrayBuffer();
    } else {
      // Legacy: Local file
      const qrPath = path.join(
        process.cwd(),
        "public",
        business.slug,
        "qr",
        business.QrCode || "qr-final.png"
      );

      if (!fs.existsSync(qrPath)) {
        return NextResponse.json(
          { error: "El QR aún no ha sido generado" },
          { status: 404 }
        );
      }

      const fileBuffer = fs.readFileSync(qrPath);
      arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );
    }

    // 🔽 Responder como archivo descargable usando ArrayBuffer directamente
    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${business.slug}-qr.png"`,
      },
    });
  } catch (error) {
    console.error("❌ Error descargando el QR:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
