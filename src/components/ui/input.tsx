import * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  onFocus,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      onFocus={(e) => {
        e.target.select();
        onFocus?.(e);
      }}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Light mode defaults (shadcn original-ish but cleaner)
        "border-input bg-transparent",
        // Dark mode / Backoffice specific overrides (User Request)
        "dark:bg-zinc-900/50 dark:border-emerald-900/50 dark:text-emerald-50 dark:font-medium",
        "dark:hover:bg-zinc-900 transition-colors",
        // Focus states
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "dark:focus-visible:border-emerald-500 dark:focus-visible:ring-emerald-500/20",
        // Error states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
