"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function NavbarSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const queryFromUrl = searchParams.get("q") ?? "";
  const [value, setValue] = useState(queryFromUrl);

  useEffect(() => {
    setValue(queryFromUrl);
  }, [queryFromUrl]);

  const nextHrefBase = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return { params };
  }, [searchParams]);

  const updateQueryParam = (nextValue: string) => {
    const params = nextHrefBase.params;

    if (nextValue.trim()) {
      params.set("q", nextValue);
    } else {
      params.delete("q");
    }

    const qs = params.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          placeholder="Buscar productos..."
          onChange={(e) => {
            const nextValue = e.target.value;
            setValue(nextValue);
            updateQueryParam(nextValue);
          }}
          className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl leading-5 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md"
          aria-label="Buscar productos"
        />
        {isPending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
