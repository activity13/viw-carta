"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isPublicPage = pathname?.startsWith("/backoffice/login");

  useEffect(() => {
    if (status === "unauthenticated" && !isPublicPage) {
      const currentUrl =
        pathname +
        (searchParams.toString() ? `?${searchParams.toString()}` : "");
      const callbackUrl = encodeURIComponent(currentUrl);
      router.push(`/backoffice/login?callbackUrl=${callbackUrl}`);
    }
  }, [status, router, pathname, searchParams, isPublicPage]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
          <p className="text-emerald-600/80 animate-pulse font-medium">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
