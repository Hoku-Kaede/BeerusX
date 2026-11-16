import { FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD, TAX_RATE, type BazaarProduct } from "./bazaar";

export type CartLineInput = {
  product: BazaarProduct;
  variantId: string | null;
  qty: number;
};

export type PriceBreakdown = {
  itemsSubtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
  freeShippingProgress: number; // 0..1 fraction toward free shipping
  freeShippingRemaining: number;
};

export const COUPONS: Record<string, { kind: "percent"; value: number; label: string }> = {
  BAZA20: { kind: "percent", value: 0.2, label: "20% off" },
};

export const resolveCoupon = (code: string): { ok: true; discount: number } | { ok: false; reason: string } => {
  const normalized = code.trim().toUpperCase();
  const coupon = COUPONS[normalized];
  if (!coupon) return { ok: false, reason: "Coupon not recognized" };
  return { ok: true, discount: coupon.value };
};

export function unitPrice(product: BazaarProduct, variantId: string | null): number {
  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  return (variant?.priceDelta ?? 0) + product.price;
}

export function computeTotals(lines: CartLineInput[], couponCode: string = ""): PriceBreakdown {
  const itemsSubtotal = lines.reduce((sum, line) => sum + unitPrice(line.product, line.variantId) * line.qty, 0);
  const items = lines.reduce((sum, line) => sum + line.qty, 0);

  let discount = 0;
  const coupon = resolveCoupon(couponCode);
  if (coupon.ok) {
    discount = itemsSubtotal * coupon.discount;
  }

  const discountedSubtotal = itemsSubtotal - discount;
  const shipping =
    discountedSubtotal === 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = discountedSubtotal * TAX_RATE;
  const total = Math.max(0, discountedSubtotal + shipping + tax);

  const freeShippingProgress = Math.min(1, discountedSubtotal / FREE_SHIPPING_THRESHOLD);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);

  return {
    itemsSubtotal,
    discount,
    shipping,
    tax,
    total,
    itemCount: items,
    freeShippingProgress,
    freeShippingRemaining,
  };
}

export const formatMoney = (value: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
