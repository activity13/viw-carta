import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/user";
import Restaurant from "@/models/restaurants";
import { connectToDatabase } from "@/lib/mongodb";
import { checkApiPermission } from "@/lib/server-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const error = await checkApiPermission("manage_team");
    if (error) return error;

    const { id } = await params;

    const session = await getServerSession(authOptions);
    const restaurantId = session?.user?.restaurantId;
    const userRole = session?.user?.role;

    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant ID found" }, { status: 400 });
    }

    // ROLE CHECK: Only admin or superadmin
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json({ error: "No tienes permisos para realizar esta acción" }, { status: 403 });
    }
    const body = await request.json();
    const { fullName, role, isActive } = body;

    await connectToDatabase();

    // Verify the user belongs to the same restaurant
    const userToUpdate = await User.findOne({ _id: id, restaurantId });
    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found or not in your restaurant" }, { status: 404 });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (restaurant?.ownerId?.toString() === id) {
      return NextResponse.json({ error: "No se puede modificar al propietario del restaurante" }, { status: 403 });
    }

    if (userRole === "admin" && userToUpdate.role === "superadmin") {
      return NextResponse.json({ error: "Los administradores no pueden modificar a los super administradores" }, { status: 403 });
    }

    if (fullName !== undefined) userToUpdate.fullName = fullName;
    if (role !== undefined) userToUpdate.role = role;
    if (isActive !== undefined) userToUpdate.isActive = isActive;

    await userToUpdate.save();

    const userObject = userToUpdate.toObject();
    delete userObject.password;

    return NextResponse.json(userObject);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ error: "Error updating team member" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const error = await checkApiPermission("manage_team");
    if (error) return error;

    const { id } = await params;

    const session = await getServerSession(authOptions);
    const restaurantId = session?.user?.restaurantId;
    const currentUserId = session?.user?.id;
    const userRole = session?.user?.role;

    if (!restaurantId) {
      return NextResponse.json({ error: "No restaurant ID found" }, { status: 400 });
    }

    // ROLE CHECK: Only admin or superadmin
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json({ error: "No tienes permisos para realizar esta acción" }, { status: 403 });
    }

    if (id === currentUserId) {
      return NextResponse.json({ error: "No puedes desactivar tu propio usuario" }, { status: 400 });
    }

    await connectToDatabase();

    const userToDeactivate = await User.findOne({ _id: id, restaurantId });
    
    if (!userToDeactivate) {
      return NextResponse.json({ error: "User not found or not in your restaurant" }, { status: 404 });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (restaurant?.ownerId?.toString() === id) {
      return NextResponse.json({ error: "No se puede desactivar al propietario del restaurante" }, { status: 403 });
    }

    if (userRole === "admin" && userToDeactivate.role === "superadmin") {
      return NextResponse.json({ error: "Los administradores no pueden desactivar a los super administradores" }, { status: 403 });
    }

    userToDeactivate.isActive = false;
    await userToDeactivate.save();

    return NextResponse.json({ message: "Usuario desactivado exitosamente", user: userToDeactivate });
  } catch (error) {
    console.error("Error deactivating team member:", error);
    return NextResponse.json({ error: "Error deactivating team member" }, { status: 500 });
  }
}
