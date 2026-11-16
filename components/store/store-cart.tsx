"use client";

import { useEffect } from "react";
import type { StoreProduct } from "@/lib/store";
import { formatPrice } from "@/lib/store";
import { ArrowRightIcon, CheckIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";

export type CartLine = { product: StoreProduct; qty: number };

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  onSetQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
};

export function StoreCart({ open, onClose, lines, onSetQty, onRemove }: CartDrawerProps) {
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.product.price, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-ink-900/95 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="font-display text-xl font-semibold tracking-tight text-mist-50">
            Your cart
            {count > 0 && <span className="ml-2 text-[13px] font-medium text-mist-500">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="grid size-9 place-items-center rounded-full text-mist-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-display text-2xl font-semibold tracking-tight text-mist-50">
              Nothing here yet.
            </p>
            <p className="max-w-60 text-[13px] leading-relaxed text-mist-500">
              Your cart is empty — go find something worth carrying.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 rounded-full bg-white px-6 py-3 text-[13px] font-semibold text-ink-950 transition hover:bg-ember-200"
            >
              Shop the gear
            </button>
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex-1 overflow-y-auto px-6">
              <ul className="divide-y divide-white/[0.06]">
                {lines.map(({ product, qty }) => (
                  <li key={product.id} className="flex gap-4 py-5">
                    <div
                      className="relative size-20 shrink-0 overflow-hidden rounded-2xl"
                      style={{ background: `linear-gradient(160deg, ${product.art.from}, ${product.art.to})` }}
                    >
                      <span className="absolute bottom-2 left-2 font-display text-2xl font-bold text-white/[0.14]">
                        {product.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[15px] font-semibold tracking-tight text-mist-50">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-mist-500">{product.category}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-1.5 py-1">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${product.name}`}
                            onClick={() => onSetQty(product.id, qty - 1)}
                            className="grid size-6 place-items-center rounded-full text-mist-300 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <MinusIcon className="size-3" />
                          </button>
                          <span className="w-5 text-center font-display text-sm font-semibold text-mist-50">
                            {qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${product.name}`}
                            onClick={() => onSetQty(product.id, qty + 1)}
                            className="grid size-6 place-items-center rounded-full text-mist-300 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <PlusIcon className="size-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-display text-[15px] font-semibold text-mist-50">
                            {formatPrice(product.price * qty)}
                          </p>
                          <button
                            type="button"
                            aria-label={`Remove ${product.name} from cart`}
                            onClick={() => onRemove(product.id)}
                            className="grid size-7 place-items-center rounded-full text-mist-500 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            <TrashIcon className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-white/[0.08] px-6 py-5">
              <div className="flex items-center justify-between text-[13px] text-mist-400">
                <span>Subtotal</span>
                <span className="font-display text-lg font-semibold text-mist-50">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1.5 text-[11.5px] text-mist-600">
                Shipping calculated at checkout · repairs handled in-house.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[13.5px] font-semibold text-ink-950 transition hover:bg-ember-200"
              >
                Checkout
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
