import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";
import Client from "@/models/client";

export async function GET(request: Request) {
  try {
    const session = await requireAuth("waiter");
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const query: Record<string, unknown> = {
      restaurantId: session.user.restaurantId,
    };

    if (search) {
      query.$or = [
        { documentNumber: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } }
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth("waiter");
    await connectToDatabase();

    const restaurantId = session.user.restaurantId as string;
    const body = await request.json();

    const {
      documentType,
      documentNumber,
      name,
      lastName,
      businessName,
      address,
      phone,
      email,
      clientType,
      marketingOptIn,
    } = body;

    // Verificar si ya existe en el restaurante para no duplicar
    const existingClient = await Client.findOne({
      restaurantId,
      documentNumber,
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Ya existe un cliente con este número de documento." },
        { status: 409 }
      );
    }

    const client = await Client.create({
      restaurantId,
      documentType: documentType || "none",
      documentNumber,
      name,
      lastName,
      businessName,
      address,
      phone,
      email,
      clientType: clientType || "standard",
      marketingOptIn: marketingOptIn || false,
      status: "active",
      purchaseStats: { totalOrders: 0, totalSpent: 0, lastOrderDate: null },
      orderHistory: [],
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
