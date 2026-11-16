"use client";

import { usePathname } from "next/navigation";
import { BazaarHeader } from "@/components/bazaar/bazaar-header";
import { BazaarFooter } from "@/components/bazaar/bazaar-footer";
import { BazaarMobileNav } from "@/components/bazaar/bazaar-mobile-nav";

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isJarvis = pathname?.startsWith("/jarvis");
  const isAquarium = pathname?.startsWith("/aquarium");

  // Route-specific experiences own their full viewport and chrome.
  if (isJarvis || isAquarium) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-bg"
      >
        Skip to content
      </a>
      <BazaarHeader />
      <main id="content">{children}</main>
      <BazaarFooter />
      <BazaarMobileNav />
    </>
  );
}
