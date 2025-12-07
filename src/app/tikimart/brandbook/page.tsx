import { Metadata } from "next";
import Image from "next/image";
export const metadata: Metadata = {
  title: "Brandbook - TikiMart",
  description: "Manual de marca TikiMart - Estilo tropical minimalista",
};

export default function BrandbookPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#19D3D1] via-[#A3E8D8] to-[#19D3D1] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="mb-6">
            {/* Logo conceptual placeholder */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-4">
              <div className="text-4xl">🗿</div>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 font-['Nunito']">TikiMart</h1>
          <p className="text-xl opacity-90">Brandbook & Manual de Marca</p>
          <p className="text-lg opacity-75 mt-2">Tropical • Rápido • Fresco</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Concepto de Logo */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-[#1A1A1A] mb-8 font-['Nunito']">
            🎨 Concepto de Logo
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-[#A3E8D8]/10 rounded-3xl p-8 mb-6">
                <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
                  Estilo: Tropical Minimalista
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Una mezcla entre "tiki" y market rápido, usando formas simples
                  y limpias.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-[#A3E8D8]/20">
                  <div className="w-3 h-3 bg-[#19D3D1] rounded-full"></div>
                  <span className="text-gray-800">
                    Un tiki minimalista (líneas simples, sin detalles pesados)
                  </span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-[#A3E8D8]/20">
                  <div className="w-3 h-3 bg-[#F4CE59] rounded-full"></div>
                  <span className="text-gray-800">
                    Una ola estilizada abrazando al tiki
                  </span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-[#A3E8D8]/20">
                  <div className="w-3 h-3 bg-[#FF7F6A] rounded-full"></div>
                  <span className="text-gray-800">
                    Tipografía redondeada, calmada, moderna
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#A3E8D8]/20 to-[#19D3D1]/20 rounded-3xl p-12 text-center">
              <div className="text-8xl mb-6">🗿🌊</div>
              <p className="text-gray-600 text-lg">Concepto Visual</p>
            </div>
          </div>
        </section>

        {/* Paleta de Colores */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-[#1A1A1A] mb-8 font-['Nunito']">
            🌈 Paleta de Colores
          </h2>
          <p className="text-xl text-gray-600 mb-12">Tropical & Fresh</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="group">
              <div className="bg-[#19D3D1] h-32 rounded-3xl mb-4 shadow-lg group-hover:scale-105 transition-transform"></div>
              <h4 className="font-semibold text-[#1A1A1A] mb-1">Turquesa</h4>
              <p className="text-sm font-mono text-gray-600">#19D3D1</p>
              <p className="text-sm text-gray-500 mt-1">Energía playera, mar</p>
            </div>

            <div className="group">
              <div className="bg-[#F4CE59] h-32 rounded-3xl mb-4 shadow-lg group-hover:scale-105 transition-transform"></div>
              <h4 className="font-semibold text-[#1A1A1A] mb-1">
                Amarillo Arena
              </h4>
              <p className="text-sm font-mono text-gray-600">#F4CE59</p>
              <p className="text-sm text-gray-500 mt-1">Sol, verano</p>
            </div>

            <div className="group">
              <div className="bg-[#FF7F6A] h-32 rounded-3xl mb-4 shadow-lg group-hover:scale-105 transition-transform"></div>
              <h4 className="font-semibold text-[#1A1A1A] mb-1">Coral Suave</h4>
              <p className="text-sm font-mono text-gray-600">#FF7F6A</p>
              <p className="text-sm text-gray-500 mt-1">
                Tono cálido, amigable
              </p>
            </div>

            <div className="group">
              <div className="bg-[#A3E8D8] h-32 rounded-3xl mb-4 shadow-lg group-hover:scale-105 transition-transform"></div>
              <h4 className="font-semibold text-[#1A1A1A] mb-1">Verde Menta</h4>
              <p className="text-sm font-mono text-gray-600">#A3E8D8</p>
              <p className="text-sm text-gray-500 mt-1">Fresco, ligero</p>
            </div>

            <div className="group">
              <div className="bg-[#1A1A1A] h-32 rounded-3xl mb-4 shadow-lg group-hover:scale-105 transition-transform"></div>
              <h4 className="font-semibold text-[#1A1A1A] mb-1">Negro Suave</h4>
              <p className="text-sm font-mono text-gray-600">#1A1A1A</p>
              <p className="text-sm text-gray-500 mt-1">
                Contraste minimalista
              </p>
            </div>
          </div>
        </section>

        {/* Manual de Marca */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-[#1A1A1A] mb-8 font-['Nunito']">
            📘 Mini Manual de Marca
          </h2>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Identidad */}
            <div className="bg-gradient-to-br from-[#19D3D1]/5 to-[#A3E8D8]/10 rounded-3xl p-8">
              <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4 flex items-center gap-3">
                <span className="text-[#19D3D1]">1.</span> Identidad
              </h3>
              <div className="bg-white/70 rounded-2xl p-6">
                <p className="text-lg text-gray-700 leading-relaxed">
                  <strong className="text-[#19D3D1]">TikiMart</strong> es un
                  mini market playero
                  <span className="bg-[#F4CE59] px-2 py-1 rounded-lg text-sm mx-2">
                    rápido
                  </span>
                  <span className="bg-[#A3E8D8] px-2 py-1 rounded-lg text-sm mx-2">
                    fresco
                  </span>{" "}
                  y
                  <span className="bg-[#FF7F6A] px-2 py-1 rounded-lg text-sm mx-2">
                    divertido
                  </span>
                </p>
                <p className="text-gray-600 mt-4">
                  Su tono es relajado, cercano y práctico.
                </p>
              </div>
            </div>

            {/* Uso del Logo */}
            <div className="bg-gradient-to-br from-[#F4CE59]/5 to-[#FF7F6A]/10 rounded-3xl p-8">
              <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4 flex items-center gap-3">
                <span className="text-[#F4CE59]">2.</span> Uso del Logo
              </h3>
              <div className="space-y-4">
                <div className="bg-white/70 rounded-2xl p-4">
                  <p className="font-medium text-gray-800">
                    ✓ Versión completa (ícono + texto)
                  </p>
                  <p className="text-sm text-gray-600">
                    Para encabezados, redes y web
                  </p>
                </div>
                <div className="bg-white/70 rounded-2xl p-4">
                  <p className="font-medium text-gray-800">
                    ✓ Solo el ícono tiki/ola
                  </p>
                  <p className="text-sm text-gray-600">
                    Para app, favicon y stickers
                  </p>
                </div>
              </div>
            </div>

            {/* Tipografía */}
            <div className="bg-gradient-to-br from-[#FF7F6A]/5 to-[#A3E8D8]/10 rounded-3xl p-8">
              <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4 flex items-center gap-3">
                <span className="text-[#FF7F6A]">3.</span> Tipografía
              </h3>
              <div className="space-y-4">
                <div className="bg-white/70 rounded-2xl p-4">
                  <p className="font-bold text-xl font-['Lilita One'] text-gray-800 mb-1">
                    Principal: Lilita One
                  </p>
                  <p className="text-sm text-gray-600">
                    Redondeada, moderna y accesible
                  </p>
                </div>
                <div className="bg-white/70 rounded-2xl p-4">
                  <p className="font-medium font-['Nunito'] text-gray-800 mb-1">
                    Secundaria: Nunito
                  </p>
                  <p className="text-sm text-gray-600">Para textos largos</p>
                </div>
              </div>
            </div>

            {/* Estilo Visual */}
            <div className="bg-gradient-to-br from-[#A3E8D8]/5 to-[#19D3D1]/10 rounded-3xl p-8">
              <h3 className="text-2xl font-semibold text-[#1A1A1A] mb-4 flex items-center gap-3">
                <span className="text-[#A3E8D8]">4.</span> Estilo Visual
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-[#19D3D1] rounded-full"></div>
                  <span>Mucho espacio en blanco</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-[#F4CE59] rounded-full"></div>
                  <span>Íconos simples, redondeados</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-[#FF7F6A] rounded-full"></div>
                  <span>Colores brillantes en acentos</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-[#A3E8D8] rounded-full"></div>
                  <span>Evitar recargar; vibra chill y moderna</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tono de Comunicación */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-[#1A1A1A] mb-8 font-['Nunito']">
            💬 Tono de Comunicación
          </h2>

          <div className="bg-gradient-to-r from-[#19D3D1]/10 via-[#A3E8D8]/10 to-[#F4CE59]/10 rounded-3xl p-12 text-center">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="space-y-2">
                <div className="text-4xl">😊</div>
                <h4 className="font-semibold text-[#19D3D1]">Alegre</h4>
              </div>
              <div className="space-y-2">
                <div className="text-4xl">⚡</div>
                <h4 className="font-semibold text-[#F4CE59]">Práctico</h4>
              </div>
              <div className="space-y-2">
                <div className="text-4xl">🏖️</div>
                <h4 className="font-semibold text-[#FF7F6A]">Playero</h4>
              </div>
            </div>

            <div className="bg-white/60 rounded-2xl p-6">
              <p className="text-lg text-gray-700 mb-4">
                <strong>Frases típicas:</strong>
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="bg-[#19D3D1] text-white px-4 py-2 rounded-full">
                  rápido
                </span>
                <span className="bg-[#A3E8D8] text-gray-800 px-4 py-2 rounded-full">
                  fresco
                </span>
                <span className="bg-[#F4CE59] text-gray-800 px-4 py-2 rounded-full">
                  playa
                </span>
                <span className="bg-[#FF7F6A] text-white px-4 py-2 rounded-full">
                  listo
                </span>
                <span className="bg-[#1A1A1A] text-white px-4 py-2 rounded-full">
                  aquí nomás
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Examples */}
        <section>
          <h2 className="text-4xl font-bold text-[#1A1A1A] mb-8 font-['Nunito']">
            ✨ Ejemplos de Aplicación
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#19D3D1] text-white rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-4 font-['Nunito']">
                TikiMart
              </h3>
              <p className="text-lg opacity-90 mb-6">
                ¡Todo lo que necesitas, aquí nomás! 🏖️
              </p>
              <div className="space-y-3 text-sm">
                <div className="bg-white/20 rounded-lg p-3">
                  • Snacks frescos ✓
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  • Bebidas heladas ✓
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  • Rápido y fácil ✓
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-[#A3E8D8] rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#F4CE59] rounded-full"></div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] font-['Nunito']">
                  App Móvil
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Interfaz limpia con acentos de color tropical
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#A3E8D8]/20 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">🥤</div>
                  <p className="text-xs text-gray-600">Bebidas</p>
                </div>
                <div className="bg-[#FF7F6A]/20 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">🍿</div>
                  <p className="text-xs text-gray-600">Snacks</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-12 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-4xl mb-4">🗿🌊</div>
          <h3 className="text-2xl font-bold mb-2 font-['Nunito']">TikiMart</h3>
          <p className="text-gray-400">Brandbook v1.0 • Tropical Minimalista</p>
        </div>
      </footer>
    </div>
  );
}
