import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "TikiMart - Mini Market Online | Mejores Precios Garantizados",
  description:
    "TikiMart: tu mini market virtual con los mejores precios. Delivery rápido de snacks, bebidas y productos esenciales. ¡Compara y ahorra!",
};

export default function TikiMarketHomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#19D3D1] via-[#A3E8D8] to-[#19D3D1] text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-lilita text-5xl lg:text-7xl leading-tight mb-6">
                Mejores Precios 💰
              </h1>
              <p className="text-xl lg:text-2xl mb-4 opacity-90">
                Mini market virtual con delivery.
              </p>
              <p className="text-lg mb-8 opacity-80">
                Comparamos precios para que ahorres en cada compra.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="bg-[#F4CE59] text-[#1A1A1A] hover:bg-[#F4CE59]/90 font-semibold px-8 py-4 rounded-2xl text-lg transition-colors">
                  Ver Catálogo
                </button>
                <button className="border-2 border-white text-white hover:bg-white hover:text-[#19D3D1] font-semibold px-8 py-4 rounded-2xl text-lg transition-colors">
                  WhatsApp
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/20 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">💰</div>
                    <h3 className="font-semibold">Mejor Precio</h3>
                    <p className="text-sm opacity-80">Garantizado</p>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">🚀</div>
                    <h3 className="font-semibold">Delivery</h3>
                    <p className="text-sm opacity-80">Rápido</p>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <h3 className="font-semibold">100% Virtual</h3>
                    <p className="text-sm opacity-80">Online</p>
                  </div>
                  <div className="bg-white/20 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-2">💬</div>
                    <h3 className="font-semibold">WhatsApp</h3>
                    <p className="text-sm opacity-80">Pedidos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-lilita text-4xl lg:text-5xl text-[#1A1A1A] mb-6">
              Ventajas TikiMart
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mini market virtual enfocado en precios competitivos y servicio
              eficiente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-[#19D3D1] to-[#A3E8D8] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="font-lilita text-2xl text-[#1A1A1A] mb-4">
                Precios Competitivos
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Comparamos constantemente para ofrecerte los mejores precios del
                mercado.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-[#F4CE59] to-[#FF7F6A] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="font-lilita text-2xl text-[#1A1A1A] mb-4">
                Delivery Rápido
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Pedidos por WhatsApp y entrega coordinada en el menor tiempo
                posible.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-[#FF7F6A] to-[#A3E8D8] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="font-lilita text-2xl text-[#1A1A1A] mb-4">
                100% Virtual
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Sin gastos de local físico, trasladamos el ahorro directamente a
                ti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-20 bg-gradient-to-br from-[#A3E8D8]/10 to-[#19D3D1]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-lilita text-4xl lg:text-5xl text-[#1A1A1A] mb-6">
              Catálogo Inicial
            </h2>
            <p className="text-xl text-gray-600">
              Empezamos con lo esencial, crecemos contigo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                emoji: "🥤",
                name: "Bebidas",
                desc: "Agua, gaseosas, jugos",
              },
              {
                emoji: "🍿",
                name: "Snacks",
                desc: "Papitas, galletas, frutos secos",
              },
              {
                emoji: "🍫",
                name: "Dulces",
                desc: "Chocolates, caramelos, chicles",
              },
              {
                emoji: "🧻",
                name: "Básicos",
                desc: "Higiene, limpieza esencial",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow group"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                    {item.emoji}
                  </div>
                  <h3 className="font-semibold text-lg text-[#1A1A1A] mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="bg-[#19D3D1] text-white hover:bg-[#17BAB8] font-semibold px-8 py-4 rounded-2xl text-lg transition-colors">
              Ver Precios en WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* How it Works & Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-orbitron text-4xl lg:text-5xl text-[#1A1A1A] mb-6">
                ¿Cómo Funciona? 📱
              </h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#19D3D1] w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">Escríbenos</h3>
                    <p className="text-gray-600">
                      Manda mensaje por WhatsApp con tu lista
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-[#F4CE59] w-12 h-12 rounded-2xl flex items-center justify-center text-[#1A1A1A] font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">Cotizamos</h3>
                    <p className="text-gray-600">
                      Te enviamos precios y tiempo de entrega
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-[#FF7F6A] w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">Delivery</h3>
                    <p className="text-gray-600">
                      Coordinamos entrega en el lugar que prefieras
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#A3E8D8]/20 to-[#19D3D1]/20 rounded-3xl p-8">
              <div className="text-center">
                <div className="text-8xl mb-6">💬</div>
                <h3 className="font-lilita text-2xl text-[#1A1A1A] mb-4">
                  ¡Haz tu Pedido!
                </h3>
                <p className="text-gray-600 mb-6">
                  Estamos listos para atenderte por WhatsApp. Comparamos precios
                  para que siempre ahorres.
                </p>
                <button className="bg-[#25D366] text-white hover:bg-[#25D366]/90 font-semibold px-6 py-3 rounded-2xl transition-colors flex items-center gap-2 mx-auto">
                  <span>📱</span>
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-[#1A1A1A] text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="font-lilita text-3xl lg:text-4xl mb-4">
            Emprendimiento Virtual con Mejores Precios
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Sin gastos de local, todos los ahorros van para ti. ¡Pruébanos!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#25D366] text-white hover:bg-[#25D366]/90 font-semibold px-8 py-4 rounded-2xl text-lg transition-colors flex items-center gap-2 justify-center">
              <span>💬</span>
              Hacer Pedido
            </button>
            <button className="border-2 border-[#19D3D1] text-[#19D3D1] hover:bg-[#19D3D1] hover:text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors">
              Sobre Nosotros
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
