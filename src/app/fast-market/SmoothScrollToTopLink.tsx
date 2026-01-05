"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  delayMs?: number;
};

export default function SmoothScrollToTopLink({
  href,
  delayMs = 250,
  onClick,
  ...props
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    // Only handle internal paths (ignore external links)
    if (!href.startsWith("/")) return;

    const targetPath = href.split("#")[0];
    const needsNavigation = targetPath.length > 0 && targetPath !== pathname;

    event.preventDefault();

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // If we're not already on the target route, navigate shortly after
    if (needsNavigation) {
      window.setTimeout(() => {
        router.push(href);
      }, delayMs);
    }
  };

  return <Link href={href} {...props} onClick={handleClick} />;
}
