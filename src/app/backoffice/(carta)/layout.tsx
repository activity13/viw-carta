import { CartaHeader } from "@/components/CartaHeader";
import { CartaNavigation } from "@/components/CartaNavigation";

export default function CartaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <CartaHeader />
        <CartaNavigation />
        {children}
      </div>
    </div>
  );
}
