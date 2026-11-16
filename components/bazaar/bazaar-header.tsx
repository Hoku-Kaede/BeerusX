"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HeartIcon, MapPinIcon, MenuIcon, ShoppingBagIcon } from "@/components/icons";
import { BazaarLogo } from "./bazaar-logo";
import { BazaarSearch } from "./bazaar-search";
import { BazaarMegaMenu } from "./bazaar-mega-menu";
import { BazaarAccountMenu } from "./bazaar-account-menu";
import { useBazaarStore, useCartCount } from "@/lib/bazaar-store";
import { BAZAAR_NAME, bazaarCategories } from "@/lib/bazaar";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?deal=1", label: "Deals" },
];

export function BazaarHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = useCartCount();
  const setCartOpen = useBazaarStore((state) => state.setCartOpen);
  const wishlistCount = useBazaarStore((state) => state.wishlist.length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isShopActive = pathname.startsWith("/shop") || pathname.startsWith("/product") || pathname.startsWith("/category");

  const goCategory = (slug: string) => {
    setCategoriesOpen(false);
    router.push(slug ? `/shop?category=${slug}` : "/shop");
  };

  const handleNav = (href: string) => (e: React.MouseEvent) => {
    // Deals lives under /shop with a deal param; plain links navigate normally.
    if (href.startsWith("/shop?deal")) {
      e.preventDefault();
      router.push("/shop?deal=1");
    }
  };

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur transition-[background-color,border-color,box-shadow] duration-300"
      style={{
        backgroundColor: "color-mix(in oklab, var(--color-bg) 88%, transparent)",
        borderColor: scrolled ? "var(--color-line)" : "transparent",
        boxShadow: scrolled ? "0 12px 40px -28px rgba(40,28,18,0.45)" : "none",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-9">
        <div className={`flex items-center gap-2 transition-all duration-300 md:gap-4 ${scrolled ? "py-2" : "py-3"}`}>
          <Link href="/" className="shrink-0" aria-label={`${BAZAAR_NAME} — home`}>
            <BazaarLogo />
          </Link>

          <nav className="hidden lg:flex" aria-label="Primary" style={{ display: scrolled ? "none" : undefined }}>
            <div className="flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleNav(item.href)}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    (item.href === "/" ? pathname === "/" : pathname.startsWith("/shop")) && item.href !== "/shop"
                      ? "bg-surface-2 text-foreground"
                      : pathname.startsWith("/shop") && item.href === "/shop"
                        ? "bg-surface-2 text-foreground"
                        : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="relative">
                <button
                  type="button"
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition hover:text-foreground"
                  aria-haspopup="menu"
                  aria-expanded={categoriesOpen}
                  onClick={() => setCategoriesOpen((v) => !v)}
                >
                  Categories
                </button>
              </div>
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <BazaarAccountMenu />
            <Link href="/account?tab=wishlist" className="bazaar-icon-btn relative" aria-label={`Wishlist, ${wishlistCount} saved items`}>
              <HeartIcon size={19} />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button type="button" className="bazaar-icon-btn" data-bazaar-cart-anchor="" aria-label={`Open cart, ${cartCount} items`} onClick={() => setCartOpen(true)}>
              <ShoppingBagIcon size={19} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 17 }}
                  className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
            <button type="button" className="bazaar-icon-btn lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen((v) => !v)}>
              <MenuIcon size={20} />
            </button>
          </div>
        </div>

        <div className={`transition-[max-height,opacity,padding] duration-300 md:pb-3 ${scrolled ? "max-h-0 py-0 opacity-0" : "max-h-72 pb-3 opacity-100"} md:max-h-72 md:py-3`}>
          <div className="md:hidden">{/* placeholder keeps structure stable */}</div>
          <BazaarSearch key={`${pathname}-${scrolled ? "c" : "a"}`} initialQuery="" />
        </div>
      </div>

      <BazaarMegaMenu open={categoriesOpen} onClose={() => setCategoriesOpen(false)} onSelectCategory={goCategory} />

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t lg:hidden"
            style={{ borderColor: "var(--color-line)" }}
          >
            <nav className="space-y-1 px-4 pb-4 pt-2" aria-label="Mobile">
              {NAV.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground">
                  {item.label}
                </Link>
              ))}
              <button type="button" onClick={() => goCategory("")} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground">
                All categories
              </button>
              <button type="button" onClick={() => goCategory("electronics")} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-foreground">
                Electronics
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
