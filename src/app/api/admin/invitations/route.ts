import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Invitation from "@/models/invitation";

// GET: Listar todas las invitaciones
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Verificar que el usuario esté autenticado y sea superadmin
    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const invitations = await Invitation.find({})
      .populate("createdBy", "fullName email")
      .populate("usedBy", "fullName email")
      .sort({ createdAt: -1 })
      .limit(100); // Limitar a las últimas 100

    return NextResponse.json(invitations, { status: 200 });
  } catch (error) {
    console.error("Error al obtener invitaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST: Crear nueva invitación
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar que el usuario esté autenticado y sea superadmin
    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta función" },
        { status: 403 }
      );
    }

    const { email, restaurantName, notes } = await request.json();

    // Validaciones básicas
    if (!email || !restaurantName) {
      return NextResponse.json(
        { error: "Email y nombre del restaurante son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verificar si ya existe una invitación pendiente para este email
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este email" },
        { status: 409 }
      );
    }

    // Generar código único
    const generateUniqueCode = async (): Promise<string> => {
      let code: string;
      let exists: boolean;
      do {
        code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const existingCode = await Invitation.findOne({ code });
        exists = !!existingCode;
      } while (exists);
      return code;
    };

    const code = await generateUniqueCode();

    // Crear nueva invitación
    const invitation = await Invitation.create({
      code,
      email: email.toLowerCase(),
      restaurantName: restaurantName.trim(),
      notes: notes?.trim() || "",
      createdBy: session.user.restaurantId, // Usar el ID del usuario que crea la invitación
    });

    return NextResponse.json(
      {
        message: "Invitación creada exitosamente",
        code: invitation.code,
        invitationId: invitation._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear invitación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
