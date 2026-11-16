"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/account", label: "Account" },
];

export function BazaarMobileNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/jarvis")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-bg)]/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-[1440px] grid-cols-3 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-center text-xs font-semibold ${
                active ? "text-[var(--color-foreground)]" : "text-[var(--color-muted)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
