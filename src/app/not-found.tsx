import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-green-900 to-gray-900">
      <div className="bg-black/80 border-4 border-green-900 rounded-2xl shadow-2xl px-8 py-12 flex flex-col items-center max-w-md">
        <h1 className="text-4xl font-extrabold text-green-300 tracking-widest mb-4 drop-shadow-lg uppercase">
          Acceso Denegado
        </h1>
        <p className="text-lg text-gray-200 mb-8 text-center font-mono">
          Esta página forma parte de la red digital de negocios viw.
          <br />
        </p>
        <Link href="/" passHref>
          <button
            className="
              bg-linear-to-r from-green-900 via-green-800 to-green-700
              border-2 border-green-300
              text-yellow-300 font-bold text-xl px-6 py-3 rounded-xl
              shadow-lg tracking-wide uppercase
              hover:bg-green-700 hover:text-white hover:border-yellow-300
              transition-all duration-150
              focus:outline-none focus:ring-4 focus:ring-green-700
            "
          >
            Volver al Home
          </button>
        </Link>
        <span className="text-center mt-6 text-xs text-green-700 font-mono opacity-70">
          Conoce más de la mejor plataforma de menús digitales en{" "}
          <Link href="https://viw-carta.com">viw-carta.com</Link>
        </span>
      </div>
    </div>
  );
}
