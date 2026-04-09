import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";
import Client from "@/models/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth("waiter");
    await connectToDatabase();

    const restaurantId = session.user.restaurantId as string;
    const body = await request.json();

    // No permitir cambiar el ID ni el restaurante por seguridad
    delete body._id;
    delete body.restaurantId;

    const client = await Client.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth("staff");
    await connectToDatabase();

    const restaurantId = session.user.restaurantId as string;

    // Realizamos un soft delete o banneo, no un deleteOne para no romper referencias de órdenes antiguas
    const client = await Client.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: { status: "banned" } },
      { new: true }
    );

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Cliente desactivado/baneado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
