import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // --- LANDING PAGE ---
    if (url.pathname === "/") {
      return NextResponse.next();
    }

    // --- BACKOFFICE ---
    if (url.pathname.startsWith("/backoffice")) {
      // rutas públicas dentro del backoffice
      if (
        url.pathname.startsWith("/backoffice/login") ||
        url.pathname.startsWith("/api/auth")
      ) {
        return NextResponse.next();
      }

      // el resto requiere autenticación → lo maneja el callback authorized
      return NextResponse.next();
    }

    // --- RESTAURANTES PÚBLICOS ---
    // cualquier ruta como /la-k, /mi-restaurante, etc.
    const pathParts = url.pathname.split("/").filter(Boolean);
    const firstSegment = pathParts[0];

    if (firstSegment && firstSegment !== "backoffice") {
      // ruta de restaurante o sección pública
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const url = req.nextUrl;

        // --- BACKOFFICE protegido ---
        if (url.pathname.startsWith("/backoffice")) {
          // login y auth son públicos
          if (
            url.pathname.startsWith("/backoffice/login") ||
            url.pathname.startsWith("/api/auth")
          ) {
            return true;
          }
          // el resto requiere sesión
          return !!token;
        }

        // --- TODO LO DEMÁS ES PÚBLICO ---
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!_next|.*\\..*|api/).*)"],
};
