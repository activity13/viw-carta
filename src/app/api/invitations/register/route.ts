import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invitation from "@/models/invitation";
import Restaurant from "@/models/restaurants";
import User from "@/models/user";
import Categories from "@/models/categories";
import MealSchema from "@/models/meals";
import bcrypt from "bcryptjs";

// Función helper para generar códigos de categorías legibles
const generateCategoryCode = (name: string, order: number) => {
  const prefix = name.slice(0, 3).toUpperCase();
  return `${prefix}${order}`;
};

// Función helper para generar slug limpio
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

// Datos ejemplo para onboarding
const DEFAULT_CATEGORIES = [
  { name: "Entradas", name_en: "Appetizers", order: 1 },
  { name: "Platos Principales", name_en: "Main Courses", order: 2 },
  { name: "Bebidas", name_en: "Beverages", order: 3 },
  { name: "Postres", name_en: "Desserts", order: 4 },
];

const DEFAULT_MEALS = [
  {
    categoryIndex: 0, // Entradas
    name: "[Agregar tu entrada favorita]",
    name_en: "[Add your favorite appetizer]",
    description: "Describe tu entrada aquí",
    description_en: "Describe your appetizer here",
    basePrice: 0,
    isTemplate: true,
  },
  {
    categoryIndex: 1, // Platos Principales
    name: "[Agregar tu especialidad]",
    name_en: "[Add your specialty]",
    description: "Tu plato estrella va aquí",
    description_en: "Your signature dish goes here",
    basePrice: 0,
    isTemplate: true,
  },
  {
    categoryIndex: 2, // Bebidas
    name: "[Agregar bebida]",
    name_en: "[Add beverage]",
    description: "Bebida refrescante",
    description_en: "Refreshing beverage",
    basePrice: 0,
    isTemplate: true,
  },
  {
    categoryIndex: 3, // Postres
    name: "[Agregar postre]",
    name_en: "[Add dessert]",
    description: "Dulce final perfecto",
    description_en: "Perfect sweet ending",
    basePrice: 0,
    isTemplate: true,
  },
];

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

    // Crear categorías ejemplo
    const createdCategories = [];
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const categoryData = DEFAULT_CATEGORIES[i];

      const category = await Categories.create({
        name: categoryData.name,
        name_en: categoryData.name_en,
        code: generateCategoryCode(categoryData.name, categoryData.order),
        slug: generateSlug(categoryData.name),
        restaurantId: newRestaurant._id,
        order: categoryData.order,
        isActive: true,
      });
      createdCategories.push(category);
    }

    // Crear productos ejemplo
    for (const mealData of DEFAULT_MEALS) {
      const targetCategory = createdCategories[mealData.categoryIndex];
      await MealSchema.create({
        name: mealData.name,
        name_en: mealData.name_en,
        description: mealData.description,
        description_en: mealData.description_en,
        basePrice: mealData.basePrice || 0,
        restaurantId: newRestaurant._id,
        categoryId: targetCategory._id,
        variants: [],
        availability: {
          isAvailable: true,
          schedule: {
            monday: { isAvailable: true, timeSlots: [] },
            tuesday: { isAvailable: true, timeSlots: [] },
            wednesday: { isAvailable: true, timeSlots: [] },
            thursday: { isAvailable: true, timeSlots: [] },
            friday: { isAvailable: true, timeSlots: [] },
            saturday: { isAvailable: true, timeSlots: [] },
            sunday: { isAvailable: true, timeSlots: [] },
          },
        },
        display: {
          order: 999,
          showInMenu: true,
          isFeatured: false,
        },
        isTemplate: mealData.isTemplate,
      });
    }

    return NextResponse.json(
      {
        message: "Restaurante registrado exitosamente",
        restaurant: {
          id: newRestaurant._id,
          name: newRestaurant.name,
          slug: newRestaurant.slug,
        },
        redirectTo: `/onboarding/welcome?restaurantId=${newRestaurant._id}`,
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
