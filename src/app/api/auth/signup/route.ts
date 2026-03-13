import { NextResponse } from "next/server";
import User from "@/models/user";
import Restaurant from "@/models/restaurants";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { restaurant, user } = await request.json();

    // Validación restaurante
    if (
      !restaurant?.name ||
      !restaurant?.slug ||
      !restaurant?.direction ||
      !restaurant?.phone
    ) {
      return NextResponse.json(
        { error: "Todos los campos básicos del restaurante son obligatorios" },
        { status: 400 },
      );
    }

    // Validación usuario
    const { fullName, username, email, password } = user;
    if (!fullName || !username || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos de usuario son obligatorios" },
        { status: 400 },
      );
    } else if (fullName.length < 3 || fullName.length > 50) {
      return NextResponse.json(
        { error: "El nombre completo debe tener entre 3 y 50 caracteres" },
        { status: 400 },
      );
    } else if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    // Verificar si el slug de restaurante ya existe
    const thereIsRestaurant = await Restaurant.findOne({
      slug: restaurant.slug,
    });
    if (thereIsRestaurant) {
      return NextResponse.json(
        { error: "Ya existe un restaurante con ese slug" },
        { status: 400 },
      );
    }

    // Verificar si el usuario ya existe
    const thereIsUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (thereIsUser) {
      return NextResponse.json(
        { error: "Username o email ya existennnn" },
        { status: 400 },
      );
    }

    // Crear restaurante
    const newRestaurant = await Restaurant.create({
      name: restaurant.name,
      slug: restaurant.slug,
      direction: restaurant.direction,
      location: restaurant.location,
      phone: restaurant.phone,
      description: restaurant.description || "",
      image: restaurant.image || "",
    });

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      restaurantId: newRestaurant._id,
      role: "admin",
      isActive: true,
    });

    return NextResponse.json(
      { message: "Restaurante y usuario admin registrados exitosamente." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error interno en el servidor", error);
    return NextResponse.json(
      {
        error: "Ha ocurrido un problema. Por favor, intenta nuevamente",
        error_message:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
