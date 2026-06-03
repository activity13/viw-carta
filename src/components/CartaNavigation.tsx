"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Tags, Layers, MessageSquare, Languages, LayoutGrid } from "lucide-react";

export function CartaNavigation() {
  const pathname = usePathname();

  const links = [
    { href: "/backoffice", label: "Productos", icon: Package, exact: true },
    { href: "/backoffice/categories", label: "Categorías", icon: Tags },
    { href: "/backoffice/sections", label: "Secciones", icon: LayoutGrid },
    { href: "/backoffice/variants", label: "Variantes", icon: Layers },
    { href: "/backoffice/messages", label: "Textos", icon: MessageSquare },
    { href: "/backoffice/translate", label: "Traducciones", icon: Languages },
  ];

  return (
    <div className="flex space-x-1 border-b border-border overflow-x-auto pb-1 mb-2">
      {links.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
