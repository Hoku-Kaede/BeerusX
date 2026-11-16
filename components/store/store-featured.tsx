"use client";

import { ArrowRightIcon, CheckIcon, StarIcon } from "@/components/icons";
import type { StoreProduct } from "@/lib/store";
import { formatPrice } from "@/lib/store";

type StoreFeaturedProps = {
  product: StoreProduct;
  onAdd: (id: string) => void;
};

export function StoreFeatured({ product, onAdd }: StoreFeaturedProps) {
  return (
    <section id="featured" aria-label={`${product.name} — featured`} className="animate-fade-up w-full">
      <div className="mx-auto grid w-full max-w-[1680px] items-center gap-14 px-5 md:px-9 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-white/[0.08]">
          <div
            className="absolute inset-0 transition-transform duration-[700ms] ease-out hover:scale-[1.05]"
            style={{
              background: `linear-gradient(160deg, ${product.art.from}, ${product.art.to})`,
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 size-56 rounded-full blur-3xl opacity-60"
            style={{ backgroundColor: product.art.accent }}
          />
          <span
            aria-hidden="true"
            className="absolute bottom-[12%] left-[50%] -translate-x-1/2 font-display text-[9rem] font-bold leading-none text-white/[0.12]"
          >
            {product.name.charAt(0)}
          </span>
          {product.badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mist-50 backdrop-blur-md">
              {product.badge}
            </span>
          ) : null}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember-400">
            The trail — featured
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.4rem,4.6vw,3.8rem)] font-bold leading-[1.02] tracking-[-0.035em] text-mist-50">
            {product.name}
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-mist-400">{product.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-display text-[2rem] font-semibold tracking-tight text-mist-50">
              {formatPrice(product.price)}
            </p>
            {product.compareAt ? (
              <p className="font-display text-lg font-semibold text-mist-600 line-through">
                {formatPrice(product.compareAt)}
              </p>
            ) : null}
            <p className="flex items-center gap-2 text-[12.5px] text-mist-400">
              <StarIcon className="size-3.5 text-ember-400" />
              {product.rating} · {product.reviews.toLocaleString()} reviews
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onAdd(product.id)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-semibold text-ink-950 transition hover:bg-ember-200"
            >
              Add to cart — {formatPrice(product.price)}
            </button>
            <a
              href="#shop"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-3.5 text-[14px] font-medium text-mist-50 backdrop-blur-md transition hover:border-white/40 hover:bg-white/[0.12]"
            >
              More like this
              <ArrowRightIcon className="size-4" />
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/[0.08] pt-6">
            {product.materials.map((material) => (
              <li key={material} className="flex items-center gap-2 text-[12px] text-mist-500">
                <CheckIcon className="size-3 text-signal-400" />
                {material}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
