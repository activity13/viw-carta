import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function Home() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center  p-21 text-center">
        <h1 className="text-4xl font-bold mb-8">Bienvenido a VIWCarta</h1>
        <Button
          className="mt-[10%] p-6 rounded-2xl btn-outline border-2 bg-gray-700 border-green-900"
          variant="link"
        >
          <Link href={"/backoffice"}>
            <h1 className="text-2xl font-bold text-white">ir a la app</h1>
          </Link>
        </Button>
      </main>
    </>
  );
}
