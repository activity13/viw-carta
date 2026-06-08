import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { handleAuthError, requireAuth } from "@/lib/auth-helpers";

export async function PUT(request: Request) {
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
    const theme = String(body?.theme ?? "");

    if (theme !== "light" && theme !== "dark") {
      return NextResponse.json(
        { error: "Tema no válido. Debe ser 'light' o 'dark'" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verify restaurant association
    if (
      session.user.restaurantId &&
      user.restaurantId?.toString() !== session.user.restaurantId
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    user.backofficeTheme = theme;
    await user.save();

    return NextResponse.json(
      { message: "Tema actualizado exitosamente", theme },
      { status: 200 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
