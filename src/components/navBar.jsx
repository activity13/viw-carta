"use client";

import * as React from "react";
import Link from "next/link";
import {
  Crown,
  User,
  LogOut,
  Menu,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";
import "@material-symbols/font-400/rounded.css";
import { usePathname } from "next/navigation";
import LogoutButton from "./ui/LogoutButton";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/usePermissions";
import axios from "axios";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function NavBar() {
  const pathname = usePathname() || "";
  const { data: session } = useSession();
  const { role } = usePermissions();
  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin";

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [businessLogo, setBusinessLogo] = React.useState(null);

  React.useEffect(() => {
    if (session?.user?.restaurantId) {
      const fetchLogo = async () => {
        try {
          const { data } = await axios.get(
            `/api/settings/${session.user.restaurantId}`,
          );
          if (data?.image) {
            setBusinessLogo(data.image);
          }
        } catch (error) {
          console.error("Error fetching business logo:", error);
        }
      };
      fetchLogo();
    }
  }, [session?.user?.restaurantId]);

  const baseNavItems = [
    {
      href: "/backoffice/pos",
      label: "POS",
      icon: "point_of_sale",
      color: "text-primary",
      description: "Punto de venta interactivo",
    },
    {
      href: "/backoffice",
      label: "Carta",
      icon: "menu_book",
      color: "text-primary",
      description: "Gestor de carta y traducciones",
    },
    ...(isAdmin || isSuperAdmin
      ? [
        {
          href: "/backoffice/finances",
          label: "Dash",
          icon: "dashboard",
          color: "text-sky-500",
          description: "Control de caja y reportes",
        },
      ]
      : []),
    ...(isAdmin || isSuperAdmin
      ? [
        {
          href: "/backoffice/personas",
          label: "Personas",
          icon: "group",
          color: "text-purple-600",
          description: "Equipo y clientes",
        },
      ]
      : []),
    ...(isAdmin || isSuperAdmin
      ? [
        {
          href: "/backoffice/business-profile",
          label: "Ajustes",
          icon: "settings",
          color: "text-zinc-600",
          description: "Configuración del negocio",
        },
      ]
      : []),
  ];

  const checkIsActive = (href) => {
    if (href === "/") return pathname === "/";
    if (href === "/backoffice") {
      const cartaSubPaths = [
        "/backoffice/categories",
        "/backoffice/sections",
        "/backoffice/meals",
        "/backoffice/variants",
        "/backoffice/translate",
      ];
      return (
        pathname === "/backoffice" ||
        cartaSubPaths.some((sub) => pathname.startsWith(sub))
      );
    }
    return pathname.startsWith(href);
  };

  const navItems = baseNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-20 md:h-24 w-full items-center justify-between px-6">
        {/* CORTE IZQUIERDO: Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href="/backoffice"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <img
              src="/logo-h.svg"
              alt="Logo"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* CORTE CENTRAL: Navegación Principal (Solo Desktop/Tablet) */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <NavigationMenu>
            <NavigationMenuList className="flex items-center gap-2 rounded-2xl">
              {navItems.map((item) => {
                const isActive = checkIsActive(item.href);
                return (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className={`group flex items-center gap-2 h-16 px-4 text-sm font-medium transition-all duration-300 relative 
                          ${isActive
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                      >
                        <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                        <span>{item.label}</span>
                        {/* Horizontal Active Indicator (Bottom Bar) */}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-xs shadow-primary/30 animate-in slide-in-from-bottom-2 fade-in" />
                        )}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* CORTE DERECHO: User Pod (Diseño único) */}
        <div className="hidden md:flex items-center justify-end shrink-0">
          <div className="flex items-center p-1 rounded-full border bg-inactive-background shadow-sm transition-all hover:shadow-md hover:border-primary/30 group/pod">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary overflow-hidden border border-primary/20">
                {businessLogo ? (
                  <img
                    src={businessLogo}
                    alt="Business Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={14} />
                )}
              </div>
              <span className="text-sm font-medium max-w-[100px] truncate">
                {session?.user?.username || "Cuenta"}
              </span>
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                if (mounted) {
                  const newTheme = theme === "dark" ? "light" : "dark";
                  setTheme(newTheme);
                  axios.put("/api/backoffice/update-theme", { theme: newTheme })
                    .catch((err) => console.error("Error persisting theme:", err));
                }
              }}
              className="ml-1 mr-1 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title={mounted && theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
            >
              {mounted && theme === "dark" ? (
                <span className="material-symbols-rounded text-[20px]">light_mode</span>
              ) : (
                <span className="material-symbols-rounded text-[20px]">dark_mode</span>
              )}
            </button>

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

        {/* MOBILE: Sheet Menu */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex flex-col w-[85%] sm:w-[350px] p-0 border-l-border"
            >
              <SheetHeader className="p-6 pb-2 text-left border-b bg-muted/10">
                <SheetTitle className="flex items-center gap-2 text-foreground">
                  <span className="font-bold tracking-tight">
                    Menú Principal
                  </span>
                </SheetTitle>

                {/* User Profile Summary */}
                <div className="flex items-center gap-4 py-4 mt-2">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={businessLogo || session?.user?.image} />
                    <AvatarFallback className="bg-primary/15 text-primary font-medium">
                      {session?.user?.name?.slice(0, 2).toUpperCase() || "CN"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-sm truncate text-foreground">
                      {session?.user?.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {session?.user?.email}
                    </span>
                  </div>
                </div>
              </SheetHeader>
 
              <div className="flex-1 overflow-y-auto py-6 px-4">
                <div className="space-y-6">
                  {/* Main Navigation */}
                  <div className="space-y-1">
                    <h4 className="px-2 text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                      Gestión
                    </h4>
                    {navItems.map((item) => {
                      const isActive = checkIsActive(item.href);
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={`relative flex items-start gap-4 p-3 rounded-lg transition-all group overflow-hidden ${isActive
                              ? "bg-primary/10 hover:bg-primary/15"
                              : "hover:bg-muted"
                              }`}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-xs shadow-primary/30" />
                            )}
                            <div
                              className={`mt-0.5 p-2 rounded-md bg-background shadow-sm ring-1 ring-border transition-all flex items-center justify-center ${isActive
                                ? "ring-primary/30 shadow-xs shadow-primary/10 text-primary"
                                : `group-hover:ring-primary/20 group-hover:bg-white ${item.color}`
                                }`}
                            >
                              <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <p className={`text-sm font-medium leading-none ${isActive ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                                {item.label}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                            <ChevronRight className={`h-4 w-4 self-center ${isActive ? "text-primary" : "text-muted-foreground/30 group-hover:text-primary/70"}`} />
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>

                  <Separator className="bg-border/60" />

                  {/* Account Settings */}
                  <div className="space-y-1">
                    <h4 className="px-2 text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                      Cuenta
                    </h4>

                    {isSuperAdmin && (
                      <SheetClose asChild>
                        <Link
                          href="/backoffice/super-admin"
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-amber-600 rounded-md hover:bg-amber-50 transition-colors"
                        >
                          <Crown className="h-4 w-4" />
                          <span>Super Admin Panel</span>
                        </Link>
                      </SheetClose>
                    )}

                    <SheetClose asChild>
                      <Link
                        href="/backoffice/user-profile"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Configuración de Perfil</span>
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </div>

              <SheetFooter className="p-4 border-t bg-muted/10 mt-auto">
                <Button
                  onClick={() => {
                    if (mounted) {
                      const newTheme = theme === "dark" ? "light" : "dark";
                      setTheme(newTheme);
                      axios.put("/api/backoffice/update-theme", { theme: newTheme })
                        .catch((err) => console.error("Error persisting theme:", err));
                    }
                  }}
                  variant="outline"
                  className="w-full justify-start mb-2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <span className="material-symbols-rounded mr-2 text-[20px]">
                    {mounted && theme === "dark" ? "light_mode" : "dark_mode"}
                  </span>
                  <span>
                    {mounted && theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
                  </span>
                </Button>
                <LogoutButton
                  className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200/50"
                  variant="outline"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </LogoutButton>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
