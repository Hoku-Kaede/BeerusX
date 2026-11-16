export type StoreProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  tagline: string;
  description: string;
  materials: string[];
  badge?: string;
  featured?: boolean;
  art: { from: string; to: string; accent: string };
};

export const storeName = "Northline Supply Co.";
export const storeTagline = "Field gear, made properly.";

export const storeBlurb =
  "Small-batch outdoor gear for people who go anyway. Packs, shelters and cook systems field-tested before they ship.";

export const storeStats = [
  { value: "250", label: "Unit batches / year" },
  { value: "38k", label: "Orders shipped" },
  { value: "4.9", label: "Average rating" },
  { value: "24h", label: "Repair turnaround" },
];

export const storeMarqueeItems = [
  "Small-batch gear",
  "Built to be repaired",
  "Field tested",
  "Ships worldwide",
  "250 units / batch",
  "Repair-first design",
];

export const storePrinciples = [
  {
    index: "01",
    title: "Built to be repaired",
    description:
      "Every seam, strap and buckle is documented for repair. Send a thing back — we fix it within 24 hours.",
  },
  {
    index: "02",
    title: "Small batches",
    description:
      "Two-hundred-and-fifty unit runs per design. No two pieces from the same batch share a finish.",
  },
  {
    index: "03",
    title: "Field proven",
    description:
      "Each design spends 40+ days on real terrain before a single unit ships to a customer.",
  },
];

export const products: StoreProduct[] = [
  {
    id: "trail-40l",
    name: "Trail 40L Pack",
    category: "Packs",
    price: 289,
    compareAt: 349,
    rating: 4.9,
    reviews: 2314,
    tagline: "The pack that carries a season.",
    description:
      "Our flagship pack carries a season's worth of gear in 40 litres — clamshell opening, suspended load, repair-first straps.",
    materials: ["Ballistic nylon", "Recycled ripstop", "Adjustable torso system"],
    badge: "Best seller",
    featured: true,
    art: { from: "#223028", to: "#0c120e", accent: "#9dbb9f" },
  },
  {
    id: "summit-2p",
    name: "Summit 2P Tent",
    category: "Shelter",
    price: 449,
    rating: 4.8,
    reviews: 1187,
    tagline: "Weatherproof, packable.",
    description:
      "A two-person tent that pitches in eight minutes and shrugs off alpine wind. Vestibule doubles as gear storage.",
    materials: ["Ripstop nylon", "Aluminum poles", "Dome geometry"],
    art: { from: "#232a33", to: "#0c0f14", accent: "#8fa8c4" },
  },
  {
    id: "forge-cook",
    name: "Forge Cook System",
    category: "Cook",
    price: 159,
    rating: 4.9,
    reviews: 986,
    tagline: "Camp kitchen, simplified.",
    description:
      "Stove, pot and fuel in one field-repairable package. Boils 1 litre in six minutes, weighs less than your mug.",
    materials: ["Titanium", "Silicone", "Fuel cell"],
    art: { from: "#2b2118", to: "#120d0a", accent: "#d9a066" },
  },
  {
    id: "ridge-50l",
    name: "Ridge 50L Duffle",
    category: "Packs",
    price: 199,
    rating: 4.7,
    reviews: 764,
    tagline: "The one-bag kit.",
    description:
      "Fifty litres of organised chaos for the trip that decides to become two weeks.",
    materials: ["Waxed canvas", "Leather base", "Interior straps"],
    art: { from: "#2a2028", to: "#100c12", accent: "#c99a8f" },
  },
  {
    id: "base-quilt",
    name: "Base Camp Quilt",
    category: "Sleep",
    price: 329,
    rating: 4.8,
    reviews: 642,
    tagline: "Sleep that climbs.",
    description:
      "Down-climate quilt with draft collar and footbox cinch. Packs to a 19-inch sleeve.",
    materials: ["Down", "Recycled shell", "Footbox cinch"],
    art: { from: "#242b20", to: "#0d100c", accent: "#a8c08a" },
  },
  {
    id: "storm-shell",
    name: "Storm Shell Jacket",
    category: "Apparel",
    price: 429,
    rating: 4.9,
    reviews: 1452,
    tagline: "Three layers, one seam.",
    description:
      "A 2.5-layer shell that shrugs off alpine wind without the bulk of a hardshell. Seam-sealed, repairable.",
    materials: ["2.5-layer", "DWR", "Seam tape"],
    badge: "New",
    art: { from: "#2b2a26", to: "#100f0d", accent: "#d8c9a3" },
  },
];

export const storeCategories = [
  "All",
  "Packs",
  "Shelter",
  "Cook",
  "Sleep",
  "Apparel",
];

export const testimonials = [
  {
    quote:
      "The Trail replaced a pack I loved and immediately understood why I loved it. It carries more, wears less, and if it breaks I know exactly how to fix it.",
    name: "Mara K.",
    role: "Thru-hiked the PCT",
  },
  {
    quote:
      "Ordered Wednesday, in the tent by Sunday. The Summit 2P is the first tent I've used that I actually trust in a storm.",
    name: "Devon A.",
    role: "Alpine guide, CO",
  },
  {
    quote:
      "Forge cook + pot + fuel in one package. My camp kitchen went from three pieces of gear to one, and my shoulders thank me.",
    name: "Priya S.",
    role: "Car camper, WA",
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return currency.format(value);
}
