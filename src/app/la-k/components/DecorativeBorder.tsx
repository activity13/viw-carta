import Image from "next/image";
import { ReactNode } from "react";

interface DecorativeFrameProps {
  children: ReactNode;
}

export default function DecorativeFrame({ children }: DecorativeFrameProps) {
  return (
    <div className="relative bg-white  w-full max-w-8xl mx-auto aspect-[3/4] md:aspect-[4/3] flex items-center justify-center overflow-hidden">
      {/* Marco SVG: mantiene proporción */}
      <div className="absolute inset-0">
        <Image
          src="/la-k/images/la-k-marco.svg"
          alt="Marco decorativo"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Contenido interno */}
      <div className="relative  z-10 w-[80%] md:w-[45%] h-[90%] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
        {children}
      </div>
    </div>
  );
}
