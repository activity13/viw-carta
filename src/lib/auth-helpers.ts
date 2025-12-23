import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export type UserRole = "superadmin" | "admin" | "staff" | "viewer";

export class AuthError extends Error {
  constructor(message = "No autorizado") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Permisos insuficientes") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Verifica la sesión del usuario y sus permisos.
 * @param minRole Rol mínimo requerido (opcional)
 * @returns La sesión del usuario si es válida
 * @throws AuthError si no hay sesión
 * @throws ForbiddenError si el rol no es suficiente
 */
export async function requireAuth(minRole?: UserRole) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.restaurantId) {
    throw new AuthError("No se ha encontrado una sesión válida");
  }

  if (minRole) {
    const userRole = session.user.role as UserRole;
    const roles: UserRole[] = ["viewer", "staff", "admin", "superadmin"];

    const userRoleIndex = roles.indexOf(userRole);
    const minRoleIndex = roles.indexOf(minRole);

    if (userRoleIndex < minRoleIndex) {
      throw new ForbiddenError(`Se requiere rol ${minRole} o superior`);
    }
  }

  return session;
}

/**
 * Wrapper para manejar errores de autenticación en rutas API
 */
export function handleAuthError(error: unknown) {
  console.error("Auth Error:", error);

  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
