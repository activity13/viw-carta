import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ReceiptText, Gem, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#1c1b1b] text-zinc-300 selection:bg-[#70d8c8] selection:text-black">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative py-24 md:py-36 overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">
          {/* Subtle glow effect behind hero */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#70d8c8]/10 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="container mx-auto px-4 text-center z-10">
            <div className="inline-flex items-center rounded-full border border-[#3d4947] px-3 py-1 text-xs font-semibold bg-[#2a2929] text-[#70d8c8] mb-8 shadow-[0_0_15px_rgba(112,216,200,0.15)]">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70d8c8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#70d8c8]"></span>
              </span>
              El futuro de la gestión gastronómica
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 font-orbitron text-white drop-shadow-lg">
              Inteligencia y Elegancia. <br className="hidden md:block" />
              <span className="text-[#70d8c8]">Para Restaurantes Top.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
              Viw-Carta es la plataforma profesional diseñada para llevar tu
              restaurante al siguiente nivel. Control sobre tu negocio y un menú
              digital optimizado que respeta fielmente tu identidad.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg h-14 px-8 bg-[#70d8c8] hover:bg-[#5bc2b2] text-black font-bold shadow-[0_0_20px_rgba(112,216,200,0.3)] transition-all hover:scale-105 active:scale-95"
                asChild
              >
                <Link href="https://wa.me/numerodeventas" target="_blank">
                  Agendar Demo Presencial{" "}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg h-14 px-8 border-[#3d4947] text-white hover:bg-[#2a2929] hover:text-[#70d8c8] transition-all"
                asChild
              >
                <Link href="/backoffice">Probar Gratis</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* BENEFICIOS / CARACTERÍSTICAS (Solo 3 esenciales) */}
        <section
          id="features"
          className="py-24 bg-[#141414] border-y border-[#3d4947]/50 relative"
        >
          <div className="container mx-auto px-4 z-10 relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 font-orbitron text-white">
                Construido para el Éxito
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                No confíes tus ventas a sistemas frágiles. Viw-Carta es el
                estándar premium.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Gem className="h-10 w-10 text-[#70d8c8]" />}
                title="Identidad Fiel"
                description="Tu menú físico replicado y optimizado para formato web responsivo, manteniendo los colores y esencia de tu marca."
              />
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-[#70d8c8]" />}
                title="Velocidad Absoluta"
                description="Tus clientes no esperan. Interfaz de respuesta instantánea optimizada para la más alta conversión y sin descargas."
              />
              <FeatureCard
                icon={<ReceiptText className="h-10 w-10 text-[#70d8c8]" />}
                title="Gestión de Pedidos"
                description="Control total de tus órdenes. Gestiona tus pedidos en local, todo desde una sola interfaz centralizada y eficiente. Además, tu carta permite a los clientes generar sus propios pedidos para llevar o delivery."
              />
            </div>
          </div>
        </section>

        {/* PRECIOS SIMPLIFICADOS */}
        <section id="pricing" className="py-24 bg-[#1c1b1b]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 font-orbitron text-white">
                Inversión Clara
              </h2>
              <p className="text-zinc-400">
                Lleva la operación de tu local a las grandes ligas.
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
              <PricingCard
                title="Start"
                price="S/ 0"
                description="Para pequeños emprendimientos con catálogo estándar y funcional."
                features={[
                  "Categorías y productos limitados",
                  "Diseño estándar (opciones de colores)",
                  "Gestión de órdenes simple",
                  "Datos básicos de negocio",
                  "1 Admin + 2 Vendedores/Mozos",
                ]}
              />
              <PricingCard
                title="Premium"
                price="Consulta"
                description="La experiencia Viw-Carta completa para locales de todo nivel."
                highlighted={true}
                features={[
                  "Carta calcada según tu diseño y marca",
                  "Menú con traducciones automáticas",
                  "Gestión avanzada de Staff y Roles",
                  "POS Financiero avanzado",
                  "Soporte Estratégico 24/7",
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#141414] border-t border-[#3d4947] py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-2xl tracking-tighter mb-4">
            <Logo className="w-8 h-8 text-[#70d8c8] fill-current" />
            <span className="font-orbitron text-[#70d8c8]">VIW</span>
            <span className="text-white">CARTA</span>
          </div>
          <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
            El sistema de gestión gastronómica definitivo.
          </p>
          <div className="text-sm text-zinc-600">
            © {new Date().getFullYear()} VIWCarta. Excelencia e Innovación.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-[#3d4947] bg-[#222] shadow-xl hover:shadow-[0_0_20px_rgba(112,216,200,0.1)] transition-all group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#70d8c8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <CardHeader className="relative z-10">
        <div className="mb-6 p-4 bg-[#1c1b1b] border border-[#3d4947] w-fit rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <CardTitle className="text-2xl text-white font-orbitron">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-zinc-400 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  title,
  price,
  description,
  features,
  highlighted = false,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <Card
      className={`flex flex-col w-full md:w-1/2 relative bg-[#222] ${
        highlighted
          ? "border-[#70d8c8] shadow-[0_0_30px_rgba(112,216,200,0.15)] md:scale-105 z-10"
          : "border-[#3d4947] shadow-xl"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="bg-[#70d8c8] text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            Recomendado
          </span>
        </div>
      )}
      <CardHeader className="text-center pt-10">
        <CardTitle className="text-3xl text-white font-light tracking-wide">
          {title}
        </CardTitle>
        <div className="mt-4 mb-2">
          <span className="text-5xl font-orbitron font-bold text-white tracking-tighter">
            {price}
          </span>
        </div>
        <p className="text-zinc-400 text-sm max-w-xs mx-auto">{description}</p>
      </CardHeader>
      <CardContent className="flex-1 px-8 py-6">
        <div className="h-px w-full bg-[#3d4947] mb-6"></div>
        <ul className="space-y-4 mb-8">
          {features.map((feature, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-zinc-300"
            >
              <CheckCircle2
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${highlighted ? "text-[#70d8c8]" : "text-zinc-500"}`}
              />
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="p-8 pt-0 mt-auto">
        <Button
          className={`w-full h-12 text-md transition-all ${
            highlighted
              ? "bg-[#70d8c8] text-black hover:bg-[#5bc2b2] font-bold"
              : "bg-transparent border border-[#3d4947] text-white hover:bg-[#3d4947]/50"
          }`}
          asChild
        >
          <Link
            href={highlighted ? "https://wa.me/numerodeventas" : "/backoffice"}
          >
            {highlighted ? "Contactar a Ventas" : "Comenzar"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
