import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";
import Client from "@/models/client";

async function queryPeruApi(documentNumber: string) {
  const token = process.env.PERU_API_TOKEN || "392bcf44bd1ff233add4bc20e91999012f53e51b524d541084e081beacd2bc63";
  const type = documentNumber.length === 8 ? "dni" : "ruc";
  const url = `https://apiperu.dev/api/${type}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ [type]: documentNumber }),
      // Set a reasonable timeout so we don't hang the request forever
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.error(`Peru API error: ${response.statusText}`);
      return null;
    }

    const resData = await response.json();
    if (resData.success && resData.data) {
      const { data } = resData;
      if (type === "dni") {
        return {
          _id: `external-${documentNumber}`,
          documentType: "dni",
          documentNumber: documentNumber,
          name: data.nombres || "",
          lastName: `${data.apellido_paterno || ""} ${data.apellido_materno || ""}`.trim(),
          businessName: "",
          address: "",
          clientType: "standard",
          phone: "",
          email: ""
        };
      } else {
        return {
          _id: `external-${documentNumber}`,
          documentType: "ruc",
          documentNumber: documentNumber,
          name: data.nombre_o_razon_social || "",
          lastName: "",
          businessName: data.nombre_o_razon_social || "",
          address: data.direccion_completa || data.direccion || "",
          clientType: "standard",
          phone: "",
          email: ""
        };
      }
    }
  } catch (error) {
    console.error("Peru API query failed:", error);
  }
  return null;
}

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

    const clients = await Client.find(query).sort({ createdAt: -1 }).limit(50).lean();

    // If search is a valid DNI (8 digits) or RUC (11 digits), and we don't have an exact local match
    if (search && /^\d+$/.test(search) && (search.length === 8 || search.length === 11)) {
      const hasExactLocal = clients.some(c => c.documentNumber === search);
      if (!hasExactLocal) {
        const externalResult = await queryPeruApi(search);
        if (externalResult) {
          clients.unshift(externalResult as unknown as typeof clients[number]);
        }
      }
    }

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

    // Validar el formato del correo electrónico
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "El formato del correo electrónico no es válido." },
          { status: 400 }
        );
      }
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
