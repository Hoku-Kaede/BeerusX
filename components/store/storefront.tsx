"use client";

import { useState } from "react";
import { CartIcon } from "@/components/icons";
import { StoreCart, type CartLine } from "@/components/store/store-cart";
import { StoreFeatured } from "@/components/store/store-featured";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreGrid } from "@/components/store/store-grid";
import { StoreHero } from "@/components/store/store-hero";
import { StoreMarquee } from "@/components/store/store-marquee";
import { StoreNewsletter } from "@/components/store/store-newsletter";
import { StoreStats } from "@/components/store/store-stats";
import { StoreStory } from "@/components/store/store-story";
import { StoreTestimonials } from "@/components/store/store-testimonials";
import { products } from "@/lib/store";

export function Storefront() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const trail = products.find((product) => product.id === "trail-40l");

  const lines: CartLine[] = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find((entry) => entry.id === id);
      return product ? { product, qty } : null;
    })
    .filter((line): line is CartLine => line !== null);

  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  function addToCart(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }

  function setQty(id: string, qty: number) {
    setCart((current) => {
      const next = { ...current };
      if (qty <= 0) {
        delete next[id];
        return next;
      }
      return { ...next, [id]: qty };
    });
  }

  function removeFromCart(id: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  if (!trail) return null;

  return (
    <>
      <StoreHero />
      <StoreMarquee />
      <StoreStory />
      <StoreFeatured product={trail} onAdd={addToCart} />
      <StoreGrid onAdd={addToCart} />
      <StoreStats />
      <StoreTestimonials />
      <StoreNewsletter />

      <div className="mx-auto w-full max-w-[1680px px-5 md:px-9">
        <StoreFooter />
      </div>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        aria-label={`Open cart, ${count} items`}
        className="fixed bottom-5 right-5 z-[80] grid size-14 place-items-center rounded-full bg-white text-ink-950 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)] transition hover:bg-ember-200 md:bottom-8"
      >
        <CartIcon className="size-5" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ember-500 text-[10px] font-bold text-white">
            {count}
          </span>
        ) : null}
      </button>

      <StoreCart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={lines}
        onSetQty={setQty}
        onRemove={removeFromCart}
      />
    </>
  );
}
