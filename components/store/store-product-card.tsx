"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckIcon, StarIcon } from "@/components/icons";
import type { StoreProduct } from "@/lib/store";
import { formatPrice } from "@/lib/store";

type ProductCardProps = {
  product: StoreProduct;
  onAdd: (id: string) => void;
};

export function StoreProductCard({ product, onAdd }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAdd(product.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="group flex flex-col gap-5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/[0.08]">
        <div
          className="absolute inset-0 transition-transform duration-[700ms] ease-out group-hover:scale-[1.05]"
          style={{
            background: `linear-gradient(160deg, ${product.art.from}, ${product.art.to})`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 size-44 rounded-full blur-3xl opacity-60"
          style={{ backgroundColor: product.art.accent }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-[14%] left-[50%] -translate-x-1/2 font-display text-[7rem] font-bold leading-none text-white/[0.13]"
        >
          {product.name.charAt(0)}
        </span>

        {product.badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mist-50 backdrop-blur-md">
            {product.badge}
          </span>
        ) : null}

        <span className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white text-ink-950 opacity-0 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.8)] backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
          <ArrowRightIcon className="size-4" />
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl font-semibold tracking-tight text-mist-50">
            {product.name}
          </h3>
          <p className="font-display text-xl font-semibold text-mist-50">
            {formatPrice(product.price)}
          </p>
        </div>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">
          {product.category}
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-mist-400">{product.tagline}</p>
        <div className="mt-3 flex items-center gap-2 text-[12.5px] text-mist-400">
          <StarIcon className="size-3.5 text-ember-400" />
          <span className="font-semibold text-mist-200">{product.rating}</span>
          <span className="text-mist-600">·</span>
          <span>{product.reviews.toLocaleString()} reviews</span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-semibold text-ink-950 transition hover:bg-ember-200"
        >
          {added ? (
            <>
              <CheckIcon className="size-4" />
              Added
            </>
          ) : (
            <>
              Add to cart
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </button>
      </div>
    </article>
  );
}
