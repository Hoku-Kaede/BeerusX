"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { bazaarCategories, products, type BazaarProduct } from "@/lib/bazaar";

type BazaarMegaMenuProps = {
  open: boolean;
  onClose: () => void;
  onSelectCategory: (slug: string) => void;
};

function featuredFor(slug: string): BazaarProduct[] {
  return products.filter((p) => p.category === slug && p.featured).slice(0, 3);
}

export function BazaarMegaMenu({ open, onClose, onSelectCategory }: BazaarMegaMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="region"
          aria-label="Shop by category"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-full z-60 hidden w-[min(880px,92vw)] rounded-3xl border p-5 shadow-pop lg:block"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-line)" }}
        >
          <div className="grid grid-cols-4 gap-4">
            {bazaarCategories.map((cat) => {
              const featured = featuredFor(cat.slug);
              return (
                <div key={cat.slug} className="rounded-2xl p-2">
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => {
                      onSelectCategory(cat.slug);
                      onClose();
                    }}
                  >
                    <p className="text-sm font-bold text-foreground">{cat.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{cat.blurb}</p>
                  </button>
                  <div className="mt-2 flex flex-col gap-2">
                    {featured.map((p) => (
                      <a
                        key={p.id}
                        href={`/product/${p.id}`}
                        onClick={onClose}
                        className="group flex items-center gap-2 rounded-xl p-1 transition hover:bg-surface-2"
                      >
                        <span
                          className="h-9 w-9 shrink-0 rounded-lg border"
                          style={{
                            background: `linear-gradient(150deg, ${p.art.from}, ${p.art.to})`,
                            borderColor: "var(--color-line)",
                          }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[11px] font-medium leading-tight text-foreground">{p.name}</span>
                          <span className="block text-[10px] font-semibold tabular-nums text-accent-deep">{`$${p.price}`}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
