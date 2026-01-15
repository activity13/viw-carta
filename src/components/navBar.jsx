import * as React from "react";
import Link from "next/link";
import { Cog, Languages, MessageSquareQuote, Crown, User } from "lucide-react";
import LogoutButton from "./ui/LogoutButton";
import { useSession } from "next-auth/react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export default function NavBar() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "superadmin";

  return (
    <>
      <NavigationMenu
        viewport={false}
        className="w-screen border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60"
        aria-label="Barra de navegación"
      >
        <div className="mx-auto flex h-16 items-center justify-between px-4">
          {/* Left side: primary navigation */}
          <div className="flex items-center gap-2">
            {/* Desktop navigation */}
            <NavigationMenuList className="hidden sm:flex flex-none items-center justify-start gap-1">
              {/* Logo */}
              <NavigationMenuItem className="mr-1">
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice"
                    className="flex items-center px-2 py-1"
                  >
                    <img src="/logo-h.svg" alt="Logo" className="h-7 w-auto" />
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice/business-profile"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Cog className="h-4 w-4 text-muted-foreground" />
                    Negocio
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice/translate"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    Traductor
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice/messages"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
                    Textos
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>

            {/* Mobile quick actions (left) */}
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                href="/backoffice"
                className="p-2 rounded-md hover:bg-accent transition-colors"
                aria-label="Inicio"
              >
                <img src="/logo-c.svg" alt="Logo" className="h-7 w-7" />
              </Link>
              <Link
                href="/backoffice/business-profile"
                className="p-2 rounded-md hover:bg-accent transition-colors"
                aria-label="Negocio"
              >
                <Cog className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/backoffice/translate"
                className="p-2 rounded-md hover:bg-accent transition-colors"
                aria-label="Traductor"
              >
                <Languages className="h-4 w-4 text-muted-foreground" />
              </Link>
              <Link
                href="/backoffice/messages"
                className="p-2 rounded-md hover:bg-accent transition-colors"
                aria-label="Textos"
              >
                <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Right side: perfil + super admin + logout */}
          <div className="flex items-center gap-2">
            {/* Desktop right items */}
            <NavigationMenuList className="hidden sm:flex items-center justify-end gap-1">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice/user-profile"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Perfil
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {isSuperAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/backoffice/super-admin"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 transition-colors"
                    >
                      <Crown className="h-4 w-4" />
                      Super Admin
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <div className="flex items-center">
                    <LogoutButton className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300 transition-colors" />
                  </div>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>

            {/* Mobile right items */}
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                href="/backoffice/user-profile"
                className="p-2 rounded-md hover:bg-accent transition-colors"
                aria-label="Perfil"
              >
                <User className="h-4 w-4 text-muted-foreground" />
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/backoffice/super-admin"
                  className="p-2 rounded-md bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 transition-colors"
                  aria-label="Super Admin"
                >
                  <Crown className="h-4 w-4" />
                </Link>
              )}
              <LogoutButton className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300 transition-colors" />
            </div>
          </div>
        </div>
      </NavigationMenu>
    </>
  );
}
