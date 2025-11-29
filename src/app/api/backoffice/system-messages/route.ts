import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth"; // Ajusta la ruta según tu config
import SystemMessage from "@/models/SystemMessage";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: Request) {
  await connectToDatabase();
  // const session = await getServerSession(authOptions);

  // Asumimos que el usuario tiene un restaurantId asociado o lo pasas por query param
  // Aquí un ejemplo simplificado obteniendo del searchParams
  const { searchParams } = new URL(req.url);
  console.log("🚀 ~ route.ts:14 ~ GET ~ searchParams:", req.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json(
      { error: "Restaurant ID required" },
      { status: 400 }
    );
  }

  try {
    const messages = await SystemMessage.find({ restaurantId }).sort({
      placement: 1,
      order: 1,
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Error fetching messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await connectToDatabase();

  try {
    const body = await req.json();
    // Aquí deberías validar que el usuario tiene permiso sobre este restaurantId

    const newMessage = await SystemMessage.create(body);
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Error creating message" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { _id, ...updateData } = body;

    const updatedMessage = await SystemMessage.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    );
    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Error updating message" },
      { status: 500 }
    );
  }
}
