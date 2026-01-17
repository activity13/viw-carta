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

    const isRootHost =
      currentHost === mainDomain || currentHost === `www.${mainDomain}`;

    const isAppHost =
      currentHost === `app.${mainDomain}` ||
      currentHost === "app.localhost" ||
      currentHost === "localhost";

    // --- ROOT DOMAIN: siempre público (landing) ---
    if (isRootHost) return NextResponse.next();

    // --- APP DOMAIN: no mostrar landing; forzar login/home ---
    if (isAppHost) {
      if (
        url.pathname.startsWith("/backoffice/login") ||
        url.pathname.startsWith("/api/auth") ||
        url.pathname.startsWith("/invitation/") ||
        url.pathname.startsWith("/onboarding/")
      ) {
        return NextResponse.next();
      }

      // Si llegan a "/" o a una ruta no-backoffice en app., redirigir:
      // - con sesión -> /backoffice
      // - sin sesión -> /backoffice/login?callbackUrl=/backoffice
      if (url.pathname === "/" || !url.pathname.startsWith("/backoffice")) {
        const destination = hasAuthToken(req)
          ? "/backoffice"
          : "/backoffice/login?callbackUrl=/backoffice";
        return NextResponse.redirect(new URL(destination, req.url));
      }

      return NextResponse.next();
    }

    // --- RESTAURANTES (público) por subdominio ---
    let subdomain = "";
    if (currentHost.endsWith(`.${mainDomain}`)) {
      subdomain = currentHost.replace(`.${mainDomain}`, "");
    } else if (currentHost.endsWith(".localhost")) {
      subdomain = currentHost.replace(".localhost", "");
    }

    if (subdomain === "www" || subdomain === "app") subdomain = "";

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
      authorized: ({ token, req }) => {
        const url = req.nextUrl;
        const mainDomain = "viw-carta.com";
        const currentHost = getCurrentHost(req);

        const isAppHost =
          currentHost === `app.${mainDomain}` ||
          currentHost === "app.localhost";

        if (isAppHost) {
          if (
            url.pathname.startsWith("/backoffice/login") ||
            url.pathname.startsWith("/api/auth") ||
            url.pathname.startsWith("/invitation/") ||
            url.pathname.startsWith("/onboarding/")
          ) {
            return true;
          }

          // Importante: permitir que el middleware maneje "/" y no-backoffice
          if (url.pathname === "/" || !url.pathname.startsWith("/backoffice")) {
            return true;
          }

          // El resto del backoffice sí requiere sesión
          return !!token;
        }

        // Todo lo demás es público
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!_next|.*\\..*|api/).*)"],
};
