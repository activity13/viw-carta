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
  Menu,
  X,
  ChevronRight,
  Settings,
  Users,
} from "lucide-react";
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
  const { data: session } = useSession();
  const { role, can } = usePermissions();
  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin";
  const canTranslate = can("manage_translations");
  const canEditBusiness = can("edit_menu");

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
      href: "/backoffice",
      label: "Inicio",
      icon: House,
      color: "text-emerald-600",
      description: "Panel principal",
    },
    ...(isAdmin
      ? [{
          href: "/backoffice/business-profile",
          label: "Negocio",
          icon: HousePlug,
          color: "text-emerald-600",
          description: "Configuración del establecimiento",
        }]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/backoffice/team",
            label: "Equipo",
            icon: Users,
            color: "text-purple-600",
            description: "Gestión de colaboradores",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: "/backoffice/translate",
            label: "Traductor",
            icon: Languages,
            color: "text-orange-500",
            description: "Idiomas y traducciones",
          },
        ]
      : []),
        ...(isAdmin
      ? [{
          href: "/backoffice/messages",
          label: "Textos",
          icon: MessageSquareQuote,
          color: "text-blue-500",
          description: "Personalización de mensajes",
        }]
      : []),
  ];

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
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border hover:rounded-2xl hover:shadow-md hover:border-emerald-500/30 hover:bg-inactive-background"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* CORTE DERECHO: User Pod (Diseño único) */}
        <div className="hidden md:flex items-center justify-end shrink-0">
          <div className="flex items-center p-1 rounded-full border bg-inactive-background shadow-sm transition-all hover:shadow-md hover:border-emerald-500/30 group/pod">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 overflow-hidden border border-emerald-200">
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
                className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex flex-col w-[85%] sm:w-[350px] p-0 border-l-emerald-100"
            >
              <SheetHeader className="p-6 pb-2 text-left border-b bg-muted/10">
                <SheetTitle className="flex items-center gap-2 text-emerald-950">
                  <span className="font-bold tracking-tight">
                    Menú Principal
                  </span>
                </SheetTitle>

                {/* User Profile Summary */}
                <div className="flex items-center gap-4 py-4 mt-2">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={businessLogo || session?.user?.image} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
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
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className="flex items-start gap-4 p-3 rounded-lg hover:bg-emerald-50/80 transition-all group"
                        >
                          <div
                            className={`mt-0.5 p-2 rounded-md bg-background shadow-sm ring-1 ring-border group-hover:ring-emerald-200 group-hover:bg-white transition-all ${item.color}`}
                          >
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <p className="text-sm font-medium font-foreground group-hover:text-emerald-900 leading-none">
                              {item.label}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-emerald-400 self-center" />
                        </Link>
                      </SheetClose>
                    ))}
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
