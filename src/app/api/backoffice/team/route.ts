import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/user";
import Restaurant from "@/models/restaurants";
import { connectToDatabase } from "@/lib/mongodb";
import { checkApiPermission } from "@/lib/server-guard";

import Invitation from "@/models/invitation";
import { resend } from "@/utils/resend";

export async function GET() {
  try {
    const error = await checkApiPermission("manage_team");
    if (error) return error;

    const session = await getServerSession(authOptions);
    const restaurantId = session?.user?.restaurantId;
    const userRole = session?.user?.role;

    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant ID found" }, { status: 400 });
    }

    // ROLE CHECK: Only admin or superadmin
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json({ error: "No tienes permisos para acceder a esta información" }, { status: 403 });
    }

    await connectToDatabase();

    // Fetch actual users
    const users = await User.find({ restaurantId }).sort({ createdAt: -1 });
    
    // Fetch pending invitations
    const invitations = await Invitation.find({ 
      restaurantId, 
      status: "pending",
      type: "staff_invitation" 
    }).sort({ createdAt: -1 });

    const restaurant = await Restaurant.findById(restaurantId).select("ownerId");

    return NextResponse.json({
      users,
      invitations,
      ownerId: restaurant?.ownerId
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Error fetching team" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const error = await checkApiPermission("manage_team");
    if (error) return error;

    const session = await getServerSession(authOptions);
    const restaurantId = session?.user?.restaurantId;
    const adminId = session?.user?.id;
    const userRole = session?.user?.role;

    if (!restaurantId || !adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ROLE CHECK: Only admin or superadmin
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json({ error: "No tienes permisos para realizar esta acción" }, { status: 403 });
    }

    const { fullName, email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email y rol son obligatorios" }, { status: 400 });
    }

    await connectToDatabase();

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "El usuario ya está registrado en el sistema" }, { status: 400 });
    }

    // Check if there is already a pending invitation for this email
    const existingInvite = await Invitation.findOne({ 
      email, 
      restaurantId, 
      status: "pending" 
    });
    
    if (existingInvite) {
      return NextResponse.json({ error: "Ya existe una invitación pendiente para este correo" }, { status: 400 });
    }

    // Create invitation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = await (Invitation as any).generateUniqueCode();
    
    const newInvitation = await Invitation.create({
      code,
      email,
      restaurantName: restaurant.name,
      restaurantId,
      type: "staff_invitation",
      role,
      status: "pending",
      createdBy: adminId,
      notes: fullName ? `Invitación para ${fullName}` : ""
    });

    // Send email via Resend
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invitation/${code}`;
    
    try {
      await resend.emails.send({
        from: "VIWCarta <noreply@viwcarta.com>",
        to: email,
        subject: `Invitación para unirte a ${restaurant.name} en VIWCarta`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #00d492;">¡Hola!</h2>
            <p>Has sido invitado a unirte al equipo de <strong>${restaurant.name}</strong> en VIWCarta como <strong>${role}</strong>.</p>
            <p>Para completar tu registro y configurar tu cuenta, haz clic en el siguiente botón:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #00d492; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                Aceptar Invitación
              </a>
            </div>
            <p style="font-size: 12px; color: #666;">Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
            <p style="font-size: 12px; color: #666;">${inviteLink}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">Este es un mensaje automático de VIWCarta.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json({ 
        message: "Invitación creada pero hubo un error al enviar el correo. Puedes copiar el código: " + code,
        invitation: newInvitation 
      }, { status: 201 });
    }

    return NextResponse.json(newInvitation, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Error al crear la invitación" }, { status: 500 });
  }
}
