import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={cn("w-10 h-10", className)}
      {...props}
    >
      {/* Fondo de tarjeta sutil */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="20"
        className="fill-primary/10 stroke-primary/20"
        strokeWidth="2"
      />

      {/* La V estilizada (Viw) */}
      <path
        d="M30 35 L50 75 L70 35"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />

      {/* Punto digital (Tech vibe) */}
      <circle cx="50" cy="25" r="6" className="fill-foreground" />
    </svg>
  );
}
