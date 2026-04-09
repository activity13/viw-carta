import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invitation from "@/models/invitation";
import Restaurant from "@/models/restaurants";
import User from "@/models/user";
import Categories from "@/models/categories";
import bcrypt from "bcryptjs";

// Función helper para generar códigos de categorías legibles
const generateCategoryCode = (name: string, order: number) => {
  const prefix = name.slice(0, 3).toUpperCase();
  return `${prefix}${order}`;
};

// Datos ejemplo para onboarding
const DEFAULT_CATEGORIES = [
  { name: "Entradas", name_en: "Appetizers", order: 1 },
  { name: "Platos Principales", name_en: "Main Courses", order: 2 },
  { name: "Bebidas", name_en: "Beverages", order: 3 },
  { name: "Postres", name_en: "Desserts", order: 4 },
];

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const { code, restaurant: restaurantData, user: userData } = await request.json();

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

    const { fullName, username, email, password } = userData;

    // Verificar si el usuario ya existe
    const thereIsUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    
    if (thereIsUser) {
      return NextResponse.json(
        { error: "El nombre de usuario o email ya están registrados" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let restaurantId;
    let redirectTo = "/backoffice";
    let newUser;

    if (invitation.type === "staff_invitation") {
      // Registrar colaborador en restaurante existente
      restaurantId = invitation.restaurantId;
      
      if (!restaurantId) {
        return NextResponse.json(
          { error: "Error en la invitación: ID de restaurante no encontrado" },
          { status: 400 }
        );
      }

      newUser = await User.create({
        fullName,
        username,
        email,
        password: hashedPassword,
        restaurantId,
        role: invitation.role || "waiter",
        isActive: true,
      });
      
      redirectTo = "/backoffice";
    } else {
      // Registrar nuevo restaurante y admin
      if (!restaurantData?.name || !restaurantData?.slug) {
        return NextResponse.json(
          { error: "Datos del restaurante incompletos" },
          { status: 400 }
        );
      }

      // Verificar si el slug de restaurante ya existe
      const thereIsRestaurant = await Restaurant.findOne({
        slug: restaurantData.slug,
      });
      if (thereIsRestaurant) {
        return NextResponse.json(
          { error: "Ya existe un restaurante con ese slug" },
          { status: 400 }
        );
      }

      // Generar ID de usuario por adelantado para vincularlo como ownerId
      const newUserId = new User()._id;

      // Crear restaurante con el ownerId ya asignado
      const newRestaurant = await Restaurant.create({
        ...restaurantData,
        ownerId: newUserId,
      });

      restaurantId = newRestaurant._id;

      // Crear usuario admin con el ID generado
      newUser = await User.create({
        _id: newUserId,
        fullName,
        username,
        email,
        password: hashedPassword,
        restaurantId,
        role: "admin",
        isActive: true,
      });

      // CREAR DATOS INICIALES (ONBOARDING)
      // 1. Crear categorías
      const createdCategories = [];
      for (const cat of DEFAULT_CATEGORIES) {
        const newCat = await Categories.create({
          ...cat,
          restaurantId,
          code: generateCategoryCode(cat.name, cat.order),
          slug: cat.name.toLowerCase().replace(/\s+/g, "-"),
          isActive: true,
        });
        createdCategories.push(newCat);
      }

      redirectTo = `/onboarding/welcome?restaurantId=${restaurantId}`;
    }

    // Marcar invitación como usada con el ID del usuario registrado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (invitation as any).markAsUsed(newUser._id);

    return NextResponse.json(
      { 
        message: "Registro completado exitosamente",
        redirectTo 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro por invitación:", error);
    return NextResponse.json(
      {
        error: "Ha ocurrido un problema durante el registro",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
