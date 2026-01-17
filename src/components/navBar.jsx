import * as React from "react";
import Link from "next/link";
import {
  HousePlug,
  Languages,
  MessageSquareQuote,
  Crown,
  User,
  LogOut,
  House,
} from "lucide-react";
import LogoutButton from "./ui/LogoutButton";
import { useSession } from "next-auth/react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "superadmin";

  return (
    <header className=" top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-6">
        {/* CORTE IZQUIERDO: Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href="/backoffice"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <img
              src="/logo-h.svg"
              alt="Logo"
              className="h-10 w-auto object-contain" // Logo más grande
            />
          </Link>
        </div>

        {/* CORTE CENTRAL: Navegación Principal (Solo Desktop/Tablet) */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <NavigationMenu>
            <NavigationMenuList className="flex items-center gap-2 rounded-2xl">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice/business-profile"
                    className="group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
                  >
                    <HousePlug className="h-4 w-4 transition-transform group-hover:rotate-90" />
                    <span>Negocio</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice/translate"
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
                  >
                    <Languages className="h-4 w-4" />
                    <span>Traductor</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice/messages"
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm"
                  >
                    <MessageSquareQuote className="h-4 w-4" />
                    <span>Textos</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* CORTE DERECHO: User Pod (Diseño único) */}
        <div className="hidden md:flex items-center justify-end shrink-0">
          <div className="flex items-center p-1 rounded-full border bg-background shadow-sm transition-all hover:shadow-md hover:border-emerald-500/30 group/pod">
            {/* SuperAdmin Crown (Si aplica) */}
            {isSuperAdmin && (
              <Link
                href="/backoffice/super-admin"
                className="ml-1 mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                title="Super Admin Panel"
              >
                <Crown size={14} fill="currentColor" />
              </Link>
            )}

            {/* Perfil Link */}
            <Link
              href="/backoffice/user-profile"
              className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <User size={14} />
              </div>
              <span className="text-sm font-medium max-w-[100px] truncate">
                {session?.user?.name || "Cuenta"}
              </span>
            </Link>

            {/* Divisor Vertical */}
            <div className="h-5 w-px bg-border mx-1" />

            {/* Logout Trigger */}
            <div className="pr-1">
              <LogoutButton
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut size={14} />
              </LogoutButton>
            </div>
          </div>
        </div>

        {/* MOBILE: Mantengo lógica funcional pero simplificada para móviles */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/backoffice/business-profile"
            className="p-2 rounded-md hover:bg-accent"
          >
            <HousePlug className="h-5 w-5" />
          </Link>
          <Link
            href="/backoffice/user-profile"
            className="p-2 rounded-md hover:bg-accent"
          >
            <User className="h-5 w-5" />
          </Link>
          <LogoutButton className="p-2" />
        </div>
      </div>
    </header>
  );
}
