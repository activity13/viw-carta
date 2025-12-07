import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invitation from "@/models/invitation";
import Restaurant from "@/models/restaurants";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const { code, restaurant, user } = await request.json();

    // Validar invitación
    const invitation = await Invitation.findOne({
      code: code.toUpperCase(),
      status: "pending",
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Código de invitación no válido" },
        { status: 400 }
      );
    }

    if (invitation.isExpired()) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: "expired" });
      return NextResponse.json(
        { error: "El código de invitación ha expirado" },
        { status: 400 }
      );
    }

    // Validación restaurante
    if (
      !restaurant?.name ||
      !restaurant?.slug ||
      !restaurant?.direction ||
      !restaurant?.phone
    ) {
      return NextResponse.json(
        { error: "Todos los campos básicos del restaurante son obligatorios" },
        { status: 400 }
      );
    }

    // Validación usuario
    const { fullName, username, email, password } = user;
    if (!fullName || !username || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos de usuario son obligatorios" },
        { status: 400 }
      );
    }

    // Validar que el email coincida con la invitación
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "El email debe coincidir con el de la invitación" },
        { status: 400 }
      );
    }

    // Verificar si el slug de restaurante ya existe
    const existingRestaurant = await Restaurant.findOne({
      slug: restaurant.slug,
    });
    if (existingRestaurant) {
      return NextResponse.json(
        { error: "Ya existe un restaurante con ese slug" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username o email ya existen" },
        { status: 400 }
      );
    }

    // Crear restaurante
    const newRestaurant = await Restaurant.create({
      name: restaurant.name,
      slug: restaurant.slug,
      direction: restaurant.direction,
      location: restaurant.location || "",
      phone: restaurant.phone,
      description: restaurant.description || "",
      image: restaurant.image || "",
    });

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      restaurantId: newRestaurant._id,
      role: "admin",
      isActive: true,
    });

    // Marcar invitación como usada
    await invitation.markAsUsed(newUser._id);

    return NextResponse.json(
      {
        message: "Restaurante y usuario registrados exitosamente",
        restaurant: {
          id: newRestaurant._id,
          name: newRestaurant.name,
          slug: newRestaurant.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro con invitación:", error);
    return NextResponse.json(
      {
        error: "Ha ocurrido un problema. Por favor, intenta nuevamente",
        error_message:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
