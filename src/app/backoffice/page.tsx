"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Master from "@/components/master";
export default function DashboardPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-card">
      <section className="flex flex-col items-center  gap-6 p-4">
        <h1 className="text-4xl font-bold">¡Hola!</h1>

        <Button
          onClick={() => router.push("/backoffice/categories")}
          className="
    w-full max-w-lg
    bg-green-900
    border border-green-800
    shadow-md
    text-2xl font-semibold tracking-wide uppercase
    text-white
    py-4 px-6
    rounded-xl
    transition-all duration-150
    hover:bg-green-800
    hover:text-green-300
    focus:outline-none focus:ring-2 focus:ring-green-700
  "
        >
          Elige tus categorías aquí
        </Button>

        <Master />
      </section>
    </div>
  );
}
