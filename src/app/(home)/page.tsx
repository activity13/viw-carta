import React from "react";

import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Palette,
  Zap,
  Languages,
  Smartphone,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))]from-primary/20 via-background to-background"></div>
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-8">
              🚀 La evolución del menú digital
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 font-orbitron text-black">
              Digitaliza tu esencia. <br className="hidden md:block" />
              <span className="text-primary">Tu menú en 5 minutos.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              La plataforma todo-en-uno para restaurantes que quieren destacar.
              Diseños únicos, carga ultrarrápida y gestión sin esfuerzo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8">
                Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg h-12 px-8"
              >
                <Link href="https://la-k.viw-carta.com" target="_blank">
                  Ver Demo
                </Link>
              </Button>
            </div>

            {/* Hero Image Placeholder */}
            <div className="mt-16 relative mx-auto max-w-5xl rounded-xl border bg-card p-2 shadow-2xl">
              <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                <p className="text-muted-foreground font-medium">
                  Vista previa del Dashboard / Menú
                </p>
                {/* Aquí iría una imagen real del producto */}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-orbitron">
                Todo lo que necesitas
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Herramientas potentes diseñadas para modernizar tu restaurante
                sin complicaciones técnicas.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Palette className="h-10 w-10 text-primary" />}
                title="Diseño Personalizado"
                description="No más menús aburridos. Elige entre temas como Ocean, Forest o crea el tuyo propio."
              />
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-primary" />}
                title="Ultrarrápido"
                description="Tecnología Next.js para que tus clientes no esperen ni un segundo en cargar la carta."
              />
              <FeatureCard
                icon={<Languages className="h-10 w-10 text-primary" />}
                title="Bilingüe Automático"
                description="Llega a turistas sin esfuerzo con soporte multi-idioma integrado en tu menú."
              />
              <FeatureCard
                icon={<Smartphone className="h-10 w-10 text-primary" />}
                title="Gestión Simple"
                description="Actualiza precios, fotos y platos en tiempo real desde cualquier dispositivo."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-orbitron">
                Tan fácil como 1-2-3
              </h2>
              <p className="text-muted-foreground">
                Olvídate de los PDFs y las impresiones costosas.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-border -z-10"></div>

              <StepCard
                number="1"
                title="Crea tu cuenta"
                description="Regístrate en segundos y configura el perfil de tu restaurante."
              />
              <StepCard
                number="2"
                title="Sube tu Carta"
                description="Organiza tus categorías y platos con fotos y descripciones."
              />
              <StepCard
                number="3"
                title="Genera tu QR"
                description="Descarga tu código QR único y empieza a recibir pedidos."
              />
            </div>
          </div>
        </section>

        {/* Showcase / CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 font-orbitron">
              ¿Listo para transformar tu restaurante?
            </h2>
            <p className="text-primary-foreground/80 text-xl max-w-2xl mx-auto mb-10">
              Únete a los restaurantes que ya están modernizando su experiencia
              con VIWCarta.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg h-14 px-10"
            >
              Crear mi Menú Gratis
            </Button>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-orbitron">
                Planes Flexibles
              </h2>
              <p className="text-muted-foreground">
                Elige el plan que mejor se adapte a tu negocio.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard
                title="Gratis"
                price="$0"
                description="Ideal para menús de texto rápidos."
                features={[
                  "Categorías y Productos Ilimitados",
                  "Temas Preestablecidos",
                  "Marca de Agua VIW",
                  "Sin Imágenes de Productos",
                  "Dominio compartido",
                ]}
              />
              <PricingCard
                title="Pro"
                price="$15/mes"
                description="Para experiencias visuales completas."
                highlighted={true}
                features={[
                  "Sin Marca de Agua",
                  "Imágenes de Productos HD",
                  "Soporte Multi-idioma",
                  "Analíticas de Visitas",
                  "Soporte Prioritario",
                ]}
              />
              <PricingCard
                title="Enterprise"
                price="Contactar"
                description="Para cadenas y franquicias."
                features={[
                  "Todo lo de Pro",
                  "Dominio Personalizado",
                  "Integración POS",
                  "Diseño a Medida",
                  "Gestor de Cuenta Dedicado",
                ]}
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold mb-10 text-center font-orbitron">
              Preguntas Frecuentes
            </h2>
            <div className="space-y-6">
              <FaqItem
                question="¿Necesito conocimientos técnicos?"
                answer="Para nada. Nuestra plataforma está diseñada para ser intuitiva y fácil de usar, como editar tu perfil de redes sociales."
              />
              <FaqItem
                question="¿Puedo cambiar el diseño después?"
                answer="Sí, puedes cambiar el tema visual de tu menú en cualquier momento con un solo clic."
              />
              <FaqItem
                question="¿Funciona en todos los móviles?"
                answer="Absolutamente. Los menús de VIWCarta son web apps optimizadas que funcionan en cualquier dispositivo con navegador."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-xl tracking-tighter mb-4">
                <Logo className="w-10 h-10" />
                <div className="flex flex-col leading-none">
                  <span className="font-orbitron text-primary text-lg">
                    VIW
                  </span>
                  <span className="text-xs tracking-widest text-muted-foreground">
                    CARTA
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground max-w-xs">
                Ayudamos a los restaurantes a digitalizarse y ofrecer mejores
                experiencias a sus clientes.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Ejemplos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} VIWCarta. Todos los derechos
            reservados.
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
    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <div className="mb-4 p-3 bg-primary/10 w-fit rounded-xl">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center relative z-10">
      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg border-4 border-background">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-xs">{description}</p>
    </div>
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
      className={`flex flex-col ${
        highlighted
          ? "border-primary shadow-xl scale-105 relative z-10"
          : "border-border shadow-md"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Más Popular
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">{price}</span>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="p-6 pt-0 mt-auto">
        <Button
          className="w-full"
          variant={highlighted ? "default" : "outline"}
        >
          Elegir Plan
        </Button>
      </div>
    </Card>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-4">
      <h3 className="font-bold text-lg mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}
