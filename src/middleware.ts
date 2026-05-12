import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getCurrentHost(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const rawHost =
    forwardedHost?.split(",")[0]?.trim() || req.headers.get("host") || "";
  return rawHost.split(":")[0].trim().toLowerCase();
}

function hasAuthToken(req: NextRequest): boolean {
  const token = (req as NextRequest & { nextauth?: { token?: unknown } })
    .nextauth?.token;
  return !!token;
}

export default withAuth(
  function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const mainDomain = "viw-carta.com";
    const currentHost = getCurrentHost(req);

    // Identificamos el tipo de host actual:
    // Root = viw-carta.com -> Landing Page pública
    const isRootHost =
      currentHost === mainDomain || currentHost === `www.${mainDomain}` || currentHost === "localhost";

    // App = app.viw-carta.com -> Aplicación SaaS Backoffice (Dashboard)
    const isAppHost =
      currentHost === `app.${mainDomain}` ||
      currentHost === "app.localhost";

    // --- ROOT DOMAIN: siempre público (landing) ---
    if (isRootHost) return NextResponse.next();

    // --- APP DOMAIN: Rutas del backoffice ---
    // Aquí no se muestra la landing. Se fuerza el flujo hacia la app interna.
    if (isAppHost) {
      // Dejamos pasar libremente las rutas públicas necesarias para el Onboarding o Auth
      if (
        url.pathname.startsWith("/backoffice/login") ||
        url.pathname.startsWith("/api/auth") ||
        url.pathname.startsWith("/invitation/") ||
        url.pathname.startsWith("/join/") ||
        url.pathname.startsWith("/onboarding")
      ) {
        return NextResponse.next();
      }

      // Si el usuario intenta acceder a una ruta que no es de backoffice 
      // (por ejemplo, /menu) dentro del subdominio de la app, lo redirigimos 
      // de forma forzosa hacia /backoffice para proteger la app.
      if (url.pathname !== "/" && !url.pathname.startsWith("/backoffice")) {
        const destination = hasAuthToken(req)
          ? "/backoffice"
          : "/backoffice/login?callbackUrl=/backoffice";
        return NextResponse.redirect(new URL(destination, req.url));
      }

      return NextResponse.next();
    }

    // --- TENANTS: RESTAURANTES (Carta Digital Pública) ---
    // Si el usuario entra por "chifa-feliz.viw-carta.com", extraemos "chifa-feliz"
    let subdomain = "";
    if (currentHost.endsWith(`.${mainDomain}`)) {
      subdomain = currentHost.replace(`.${mainDomain}`, "");
    } else if (currentHost.endsWith(".localhost")) {
      subdomain = currentHost.replace(".localhost", "");
    }

    if (subdomain === "www" || subdomain === "app") subdomain = "";

    // Reescribimos la URL internamente de Next.js.
    // Ejemplo: chifa-feliz.viw-carta.com/menu -> viw-carta.com/chifa-feliz/menu
    // Esto permite que el App Router renderice dinámicamente según la carpeta /[slug]
    if (
      subdomain &&
      url.pathname !== `/${subdomain}` &&
      !url.pathname.startsWith(`/${subdomain}/`)
    ) {
      url.pathname = `/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Control de acceso para proteger el Backoffice.
      // NextAuth ejecutará esto antes de dejar entrar a cualquier ruta protegida.
      authorized: ({ token, req }) => {
        const url = req.nextUrl;
        const mainDomain = "viw-carta.com";
        const currentHost = getCurrentHost(req);

        const isAppHost =
          currentHost === `app.${mainDomain}` ||
          currentHost === "app.localhost";

        if (isAppHost) {
          // Excepciones explícitas para subdominios app que no requieren estar logueados
          if (
            url.pathname.startsWith("/backoffice/login") ||
            url.pathname.startsWith("/api/auth") ||
            url.pathname.startsWith("/invitation/") ||
            url.pathname.startsWith("/join/") ||
            url.pathname.startsWith("/onboarding")
          ) {
            return true;
          }

          // Importante: permitir que el middleware principal maneje redirecciones en rutas base
          if (url.pathname === "/" || !url.pathname.startsWith("/backoffice")) {
            return true;
          }

          // Para el resto del backoffice se requiere de forma estricta un token de sesión
          return !!token;
        }

        // Si es el root domain o un tenant (restaurante), el acceso es siempre público.
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!_next|.*\\..*|api/).*)"],
};
