"use client";

import { useState } from "react";
import { StoreProductCard } from "@/components/store/store-product-card";
import { storeCategories, products } from "@/lib/store";

type StoreGridProps = {
  onAdd: (id: string) => void;
};

export function StoreGrid({ onAdd }: StoreGridProps) {
  const [category, setCategory] = useState("All");

  const visible = category === "All" ? products : products.filter((p) => p.category === category);

  return (
    <section id="shop" aria-label="The lineup" className="animate-fade-up w-full">
      <div className="mx-auto w-full max-w-[1680px] px-5 md:px-9">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember-400">
              The lineup
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.035em] text-mist-50">
              Six designs. No filler.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-mist-400">
              Every product below is in production, in small batches, and repair-first.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
            {storeCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition ${
                  category === item
                    ? "bg-white text-ink-950"
                    : "border border-white/12 bg-white/[0.04] text-mist-300 hover:border-white/25 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <StoreProductCard key={product.id} product={product} onAdd={onAdd} />
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-16 text-center font-display text-2xl font-semibold text-mist-500">
            Nothing in this category yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
