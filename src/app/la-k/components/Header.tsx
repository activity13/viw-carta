"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface HeaderProps {
  restaurant: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function Header({ restaurant }: HeaderProps) {
  const { name, image } = restaurant;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Espacio reservado para evitar solapamiento */}

      <header
        className={`fixed md:left-15 ${
          scrolled ? "  bottom-20" : "bottom-24"
        }  xl:top-5 left-0 z-50 transition-all duration-500
  
        `}
      >
        <div
          className={`max-w-5xl mx-auto flex items-center transition-all duration-500 px-4
          
          `}
        >
          <div
            className={`relative overflow-hidden rounded-full bg-white ring-1 ring-gray-200 shadow-md transition-all duration-500
              ${
                scrolled
                  ? "w-24 h-24 sm:w-24 sm:h-24 translate-y-0"
                  : "w-20 h-20 sm:w-28 sm:h-28 sm:translate-y-8"
              }
            `}
          >
            <Image
              src={`/la-k/images/${image}`}
              alt={`Logo de ${name}`}
              fill
              className="object-contain p-1"
              priority
            />
          </div>
        </div>
      </header>
    </>
  );
}
