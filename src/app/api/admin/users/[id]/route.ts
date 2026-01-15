import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";

type UserRole = "superadmin" | "admin" | "staff" | "viewer";

function isRole(value: unknown): value is UserRole {
  return (
    value === "superadmin" ||
    value === "admin" ||
    value === "staff" ||
    value === "viewer"
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = (await request.json()) as {
      isActive?: boolean;
      role?: UserRole;
    };

    const update: Record<string, unknown> = {};

    if (typeof body.isActive === "boolean") {
      update.isActive = body.isActive;
    }

    if (body.role !== undefined) {
      if (!isRole(body.role)) {
        return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
      }
      update.role = body.role;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Nada para actualizar" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .select(
        "fullName username email role isActive restaurantId createdAt updatedAt"
      )
      .lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
