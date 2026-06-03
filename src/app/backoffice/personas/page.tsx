import Link from "next/link";
import { Users, UserCircle, ChevronRight } from "lucide-react";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata = {
  title: "Personas - Viw Carta",
};

export default async function PersonasPage() {
  await requireAuth("admin");

  const cards = [
    {
      title: "Equipo de Trabajo",
      description: "Administra los accesos, roles y permisos de tu equipo interno.",
      icon: Users,
      href: "/backoffice/team",
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      borderColor: "border-purple-200"
    },
    {
      title: "Directorio de Clientes",
      description: "Gestiona tu base de datos de clientes, sus preferencias y consumos.",
      icon: UserCircle,
      href: "/backoffice/clients",
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-200"
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-950 mb-2">
          Personas
        </h1>
        <p className="text-muted-foreground text-lg">
          Gestiona tanto el talento interno como las relaciones con tus clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
          >
            <div className={`absolute right-0 top-0 h-full w-1.5 ${card.color}`} />
            
            <div className="flex items-start gap-6">
              <div className={`shrink-0 rounded-xl p-4 ${card.lightColor} ${card.textColor} transition-transform group-hover:scale-110`}>
                <card.icon className="h-8 w-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-xl text-foreground group-hover:text-emerald-700 transition-colors">
                  {card.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed pr-8">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500">
              <ChevronRight className="h-6 w-6" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
