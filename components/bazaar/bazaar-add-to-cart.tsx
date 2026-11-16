"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useBazaarStore } from "@/lib/bazaar-store";

type BazaarAddToCartProps = {
  productId: string;
  variantId?: string | null;
  qty?: number;
  label?: string;
  className?: string;
};

export const BazaarAddToCart = memo(function BazaarAddToCart({
  productId,
  variantId = null,
  qty = 1,
  label = "Add to cart",
  className,
}: BazaarAddToCartProps) {
  const addToCart = useBazaarStore((state) => state.addToCart);
  const requestFly = useBazaarStore((state) => state.requestFly);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const el = event.currentTarget;
      addToCart(productId, variantId, qty);
      const rect = el.getBoundingClientRect();
      requestFly({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    },
    [addToCart, requestFly, productId, variantId, qty],
  );

  return (
    <motion.button
      type="button"
      data-bazaar-add-source=""
      onClick={handleClick}
      whileTap={{ scale: 0.97 }}
      className={className}
      aria-label={label}
    >
      {label}
    </motion.button>
  );
});
