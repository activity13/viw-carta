import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "No se ha encontrado una sesión válida" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");
    const confirmNewPassword = String(body?.confirmNewPassword ?? "");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden" },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "La nueva contraseña no puede ser igual a la actual" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId).select("+password restaurantId");
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (
      session.user.restaurantId &&
      user.restaurantId?.toString() !== session.user.restaurantId
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    return NextResponse.json(
      { message: "Contraseña actualizada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
