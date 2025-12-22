"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60 text-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Logo className="w-8 h-8" />
          <span className="font-orbitron text-primary">VIW</span>CARTA
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="#features"
            className="hover:text-primary transition-colors"
          >
            Características
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-primary transition-colors"
          >
            Cómo Funciona
          </Link>
          <Link
            href="#pricing"
            className="hover:text-primary transition-colors"
          >
            Precios
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/backoffice"
            className="text-sm font-medium hover:text-primary"
          >
            Iniciar Sesión
          </Link>
          <Button asChild>
            <Link href="/backoffice">Empezar Gratis</Link>
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-white border-b shadow-lg p-6 flex flex-col gap-6 animate-in slide-in-from-top-5 z-40 overflow-y-auto">
          <nav className="flex flex-col gap-2 text-lg font-medium">
            <Link
              href="#features"
              className="hover:text-primary transition-colors p-3 rounded-md hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              Características
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-primary transition-colors p-3 rounded-md hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              Cómo Funciona
            </Link>
            <Link
              href="#pricing"
              className="hover:text-primary transition-colors p-3 rounded-md hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              Precios
            </Link>
          </nav>
          <div className="flex flex-col gap-4 mt-auto pb-8">
            <Link
              href="/backoffice"
              className="text-lg font-medium hover:text-primary p-3 text-center border rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Iniciar Sesión
            </Link>
            <Button asChild size="lg" className="w-full text-lg">
              <Link href="/backoffice">Empezar Gratis</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
