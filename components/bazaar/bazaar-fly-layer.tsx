"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBazaarStore } from "@/lib/bazaar-store";
import { getBazaarProduct } from "@/lib/bazaar";
import { BazaarArt } from "./bazaar-art";

export function BazaarFlyLayer() {
  const flyRequest = useBazaarStore((state) => state.flyRequest);
  const clearFlyRequest = useBazaarStore((state) => state.clearFlyRequest);
  const addToCart = useBazaarStore((state) => state.addToCart);

  useEffect(() => {
    if (!flyRequest) return;
    const product = getBazaarProduct(flyRequest.productId);
    if (!product) {
      clearFlyRequest();
      return;
    }
    addToCart(product.id, flyRequest.variantId, 1);
    clearFlyRequest();
  }, [flyRequest, clearFlyRequest, addToCart]);

  if (!flyRequest) return null;
  const product = getBazaarProduct(flyRequest.productId);
  if (!product) return null;

  const art = product.variants.find((v) => v.id === flyRequest.variantId)?.art ?? product.art;
  const { rect } = flyRequest;

  const anchor = typeof document !== "undefined" ? document.querySelector<HTMLElement>("[data-bazaar-cart-anchor]") : null;
  const targetX = anchor ? anchor.getBoundingClientRect().left + anchor.getBoundingClientRect().width / 2 - rect.x - rect.width / 2 : rect.x + rect.width;
  const targetY = anchor ? anchor.getBoundingClientRect().top + anchor.getBoundingClientRect().height / 2 - rect.y - rect.height / 2 : rect.y + rect.height;

  return (
    <AnimatePresence>
      <motion.div
        key={flyRequest.key}
        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        animate={{ x: targetX, y: targetY, scale: 1, opacity: 1 }}
        exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.9 }}
        style={{
          position: "fixed",
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          zIndex: 200,
          pointerEvents: "none",
        }}
      >
        <BazaarArt art={art} className="h-full w-full" />
      </motion.div>
    </AnimatePresence>
  );
}
