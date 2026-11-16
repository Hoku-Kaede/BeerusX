import type { Metadata } from "next";
import { Storefront } from "@/components/store/storefront";

export const metadata: Metadata = {
  title: "The Store — Northline Supply Co.",
  description:
    "Small-batch outdoor gear for people who go anyway. Packs, shelters and cook systems field-tested before they ship.",
};

export default function StorePage() {
  return <Storefront />;
}
