import * as React from "react";
import Link from "next/link";
import {
  Cog,
  Home,
  Languages,
  MessageSquareQuote,
  Crown,
  User,
} from "lucide-react";
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
      {/* Spacer div to prevent content from hiding behind fixed navbar */}
      <div className="h-20 w-full" />

      <NavigationMenu
        className="fixed top-4 left-4 right-4 z-50 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg px-4 py-3"
        aria-label="Barra de navegación"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Center: Navigation links */}
          <NavigationMenuList className="hidden sm:flex items-center gap-1">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/backoffice"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/backoffice/business-profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Cog className="h-4 w-4" />
                  Config
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/backoffice/translate"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Languages className="h-4 w-4" />
                  Traductor
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/backoffice/messages"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  Mensajes
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/backoffice/user-profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <User className="h-4 w-4" />
                  Perfil
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Super Admin link - solo visible para superadmins */}
            {isSuperAdmin && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/backoffice/super-admin"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-linear-to-r from-yellow-500 to-orange-500 text-orange-700 
                    opacity-90 hover:from-yellow-500 hover:to-yellow-600 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-orange-300 transition"
                  >
                    <Crown className="h-4 w-4 text-orange-600" />
                    Super Admin
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>

          {/* Right: Logout (and mobile quick icons) */}
          <div className="flex items-center gap-2">
            {/* Mobile: compact icons */}
            <div className="flex items-center gap-1 sm:hidden">
              <Link
                href="/backoffice"
                className="p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
              <Link
                href="/backoffice/business-profile"
                className="p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Config"
              >
                <Cog className="h-4 w-4" />
              </Link>
              <Link
                href="/backoffice/translate"
                className="p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Config"
              >
                <Languages className="h-4 w-4" />
              </Link>
              <Link
                href="/backoffice/messages"
                className="p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Config"
              >
                <MessageSquareQuote className="h-4 w-4" />
              </Link>

              {/* Super Admin mobile icon */}
              {isSuperAdmin && (
                <Link
                  href="/backoffice/super-admin"
                  className="p-2 rounded-md bg-linear-to-r from-yellow-50 to-orange-50 text-orange-700 hover:from-yellow-100 hover:to-orange-100 transition"
                  aria-label="Super Admin"
                >
                  <Crown className="h-4 w-4" />
                </Link>
              )}
            </div>

            {/* Logout button */}
            <div className="ml-1">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    {/* LogoutButton component handles sign-out; keep styling wrapper */}
                    <div className="flex items-center">
                      <LogoutButton className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 transition" />
                    </div>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </div>
          </div>
        </div>
      </NavigationMenu>
    </>
  );
}
