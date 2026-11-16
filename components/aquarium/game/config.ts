import type {
  DecorDef,
  FishDef,
  LightDef,
  PlantDef,
  QuestDef,
  Rarity,
  UpgradeDef,
  WaterDef,
} from "./types";

/**
 * ---------------------------------------------------------------------------
 * KYOKO balance sheet
 * ---------------------------------------------------------------------------
 * Every tunable number in the game loop lives here. Change a price, a rate or
 * a cap and the HUD, shop and simulation all follow. No balance constant is
 * allowed anywhere else.
 */

export const BALANCE = {
  startingCoins: 100,
  saveVersion: 3,
  saveKey: "kyoko.aquarium.save",

  economy: {
    /** Base coins per second for one common koi at full happiness. */
    fishBase: 0.07,
    /** Beauty contributes this fraction per beauty point. */
    beautyFactor: 0.012,
    /** Happiness multiplier range: hungry → thriving. */
    happinessMin: 0.35,
    happinessMax: 1.45,
    /** Income booster adds this fraction per level. */
    boosterStep: 0.22,
    /** Offline earnings cap, in seconds (8 hours). */
    offlineCap: 28_800,
    /** Feeding a fish costs coins per pellet cluster tap. */
    feedCost: 4,
    /** Coins awarded per pellet eaten. */
    feedReward: 2,
    /** Happiness gained per pellet, and passive decay per minute. */
    feedGain: 16,
    hungerDecayPerMinute: 0.55,
    /** Auto-feeder slows hunger decay by this fraction per level. */
    autoFeederSlow: 0.28,
    /** Filter adds happiness floor per level. */
    filterComfort: 0.08,
    /** Daily login base reward plus streak step (7-day loop). */
    dailyBase: 40,
    dailyStep: 15,
    dailyMaxStreak: 7,
  },

  rarity: {
    common: { multiplier: 1, label: "Common", color: "#b9a58c" },
    uncommon: { multiplier: 1.55, label: "Uncommon", color: "#84c2a2" },
    rare: { multiplier: 2.6, label: "Rare", color: "#7fb4e8" },
    epic: { multiplier: 4.2, label: "Epic", color: "#c58ce8" },
    legendary: { multiplier: 7.4, label: "Legendary", color: "#f0c060" },
  } satisfies Record<
    Rarity,
    { multiplier: number; label: string; color: string }
  >,

  pond: {
    /** Fish capacity by pond level. */
    slots: [3, 5, 7, 9, 12],
    /** Decoration capacity by pond level. */
    decorSlots: [6, 9, 13, 18, 24],
    /** Plant capacity by pond level. */
    plantSlots: [4, 6, 9, 12, 16],
  },

  decorate: {
    gridSnap: 0.035,
    minX: 0.08,
    maxX: 0.92,
    minY: 0.08,
    maxY: 0.92,
    minScale: 0.65,
    maxScale: 1.65,
    rotateStep: (15 * Math.PI) / 180,
    sellRefund: 0.5,
  },

  mobile: {
    /** Reduced plant / fish / DPR budgets under this viewport width. */
    breakpoint: 720,
    plantCapMobile: 8,
    dprCapMobile: 1.15,
    dprCapDesktop: 1.6,
  },
} as const;

const koi = (
  id: string,
  name: string,
  rarity: Rarity,
  price: number,
  source: number,
  tint: readonly [number, number, number],
  length: number,
  cruise: number,
  tail: number,
  glow: number,
  blurb: string,
): FishDef => ({
  id,
  name,
  rarity,
  price,
  source,
  tint,
  length,
  cruise,
  tail,
  glow,
  blurb,
});

export const FISH: readonly FishDef[] = [
  koi("kohaku", "Kohaku", "common", 0, 0, [1, 1, 1], 0.33, 0.105, 1, 0, "White body, crimson crown. The pond's first resident."),
  koi("sanke", "Sanke", "uncommon", 180, 1, [1, 0.96, 0.94], 0.31, 0.098, 1.05, 0, "White with red and ink-black flecks."),
  koi("tancho", "Tancho", "uncommon", 240, 0, [1.02, 0.97, 0.9], 0.3, 0.11, 1.1, 0, "A single vermilion sun on a white body."),
  koi("showa", "Showa", "rare", 420, 2, [0.92, 0.82, 0.8], 0.44, 0.088, 0.95, 0, "Black skin under red and white plates."),
  koi("ogon", "Ogon", "rare", 480, 2, [1.22, 1.02, 0.6], 0.43, 0.09, 0.92, 0.08, "A metallic gold koi that catches every caustic."),
  koi("butterfly", "Butterfly", "epic", 980, 1, [1.08, 0.86, 0.96], 0.35, 0.085, 0.78, 0.05, "Long, ribbon fins that trail the current."),
  koi("albino", "Albino", "legendary", 2200, 0, [1.42, 1.3, 1.26], 0.34, 0.1, 0.85, 0.16, "Pearl-white, with eyes like garnet."),
  koi("arowana", "Arowana", "epic", 1250, 2, [0.96, 1.06, 0.8], 0.52, 0.082, 0.72, 0.05, "A long silver predator that glides like a blade."),
  koi("discus", "Discus", "rare", 620, 1, [1.16, 0.78, 0.66], 0.3, 0.094, 1.28, 0, "Tall, round and slow, with a nervous flick."),
  koi("angelfish", "Angelfish", "uncommon", 320, 2, [0.84, 1.02, 1.14], 0.3, 0.096, 1.18, 0, "A cool blue-silver drifter with a long dorsal."),
  koi("hanabi", "Hanabi", "legendary", 2800, 1, [0.82, 1.24, 1.3], 0.36, 0.086, 0.9, 0.38, "A bioluminescent koi lit from inside by blue fire."),
];

export const PLANTS: readonly PlantDef[] = [
  { id: "ribbon_weed", name: "Ribbon weed", kind: "ribbon", price: 40, beauty: 3, blurb: "Long crimson blades that comb the current." },
  { id: "seaweed", name: "Seaweed", kind: "seaweed", price: 55, beauty: 4, blurb: "A dense clump of swaying green ribbons." },
  { id: "kelp", name: "Kelp", kind: "kelp", price: 80, beauty: 6, blurb: "Tall, broad fronds that reach for the light." },
  { id: "fern", name: "Water fern", kind: "fern", price: 95, beauty: 7, blurb: "Scalloped leaves with a soft bronze edge." },
  { id: "lily", name: "Lily pads", kind: "lily", price: 120, beauty: 8, blurb: "Three floating pads that ride the surface." },
  { id: "lotus", name: "Lotus", kind: "lotus", price: 210, beauty: 13, blurb: "A cream-gold blossom above floating pads." },
];

export const DECOR: readonly DecorDef[] = [
  { id: "river_rocks", name: "River rocks", kind: "rocks", price: 60, beauty: 3, blurb: "A weathered stone from the river's edge." },
  { id: "driftwood", name: "Driftwood", kind: "driftwood", price: 90, beauty: 5, blurb: "Three bleached branches, sunk and settled." },
  { id: "stone_lantern", name: "Stone lantern", kind: "stone_lantern", price: 160, beauty: 9, blurb: "A flickering amber chamber in granite." },
  { id: "bridge", name: "Wooden bridge", kind: "bridge", price: 240, beauty: 11, blurb: "Vermilion rails and a worn plank deck." },
  { id: "statue", name: "Bronze statue", kind: "statue", price: 320, beauty: 14, blurb: "A small guardian on a brass-ringed plinth." },
  { id: "torii", name: "Torii gate", kind: "torii", price: 480, beauty: 20, blurb: "A vermilion gate marking the water's threshold." },
];

export const LIGHTS: readonly LightDef[] = [
  { id: "daylight", name: "Signature crimson", price: 0, beauty: 0, lightKind: 0, blurb: "The original KYOKO water, unlit." },
  { id: "lanterns", name: "Warm lanterns", price: 180, beauty: 6, lightKind: 1, blurb: "Three amber pools drift on the surface." },
  { id: "moonlight", name: "Moonlight", price: 260, beauty: 8, lightKind: 2, night: true, blurb: "A silver lunar beam through moving water." },
  { id: "kyoto_neon", name: "Kyoto neon", price: 340, beauty: 10, lightKind: 3, blurb: "Neon edges borrowed from a night alley." },
  { id: "bioluminescent", name: "Bioluminescent aura", price: 460, beauty: 13, lightKind: 4, blurb: "Drifting plankton motes, lit from within." },
];

export const WATER_TINTS: readonly WaterDef[] = [
  { id: "crimson", name: "KYOKO crimson", price: 0, rgb: [0.585, 0.03, 0.027], blurb: "The house tint. Deep red, almost black at the floor." },
  { id: "ink", name: "Ink basin", price: 90, rgb: [0.08, 0.09, 0.12], blurb: "A cold, nearly monochrome black water." },
  { id: "moss", name: "Moss basin", price: 120, rgb: [0.09, 0.2, 0.13], blurb: "Still green, like a shaded spring." },
  { id: "jade", name: "Jade current", price: 150, rgb: [0.06, 0.24, 0.22], blurb: "A mineral teal with a bright caustic edge." },
  { id: "indigo", name: "Indigo night", price: 190, rgb: [0.07, 0.08, 0.26], blurb: "Deep blue, with a moonlit surface." },
  { id: "plum", name: "Plum water", price: 210, rgb: [0.25, 0.05, 0.2], blurb: "A dusky violet that keeps the crimson warmth." },
];

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: "pond",
    name: "Larger pond",
    blurb: "More room for koi and decorations.",
    costs: [220, 480, 900, 1600],
  },
  {
    id: "filter",
    name: "Silent filter",
    blurb: "Cleaner water keeps every koi happier.",
    costs: [160, 360, 720, 1200],
  },
  {
    id: "autoFeeder",
    name: "Auto-feeder",
    blurb: "Slows hunger while you are away.",
    costs: [260, 560, 1100],
  },
  {
    id: "booster",
    name: "Income booster",
    blurb: "Raises passive income from the whole pond.",
    costs: [300, 650, 1250, 2200],
  },
];

export const QUESTS: readonly QuestDef[] = [
  { id: "first_meal", label: "Feed the koi 10 times", metric: "feeds", target: 10, reward: 80 },
  { id: "green_thumb", label: "Buy a plant", metric: "plantsBought", target: 1, reward: 60 },
  { id: "collector", label: "Own 3 species", metric: "species", target: 3, reward: 180 },
  { id: "tide_turner", label: "Earn 500 coins", metric: "coins", target: 500, reward: 120 },
];

export const fishById = (id: string) =>
  FISH.find((entry) => entry.id === id) ?? FISH[0];
export const plantById = (id: string) =>
  PLANTS.find((entry) => entry.id === id) ?? PLANTS[0];
export const decorById = (id: string) =>
  DECOR.find((entry) => entry.id === id) ?? DECOR[0];
export const lightById = (id: string) =>
  LIGHTS.find((entry) => entry.id === id) ?? LIGHTS[0];
export const waterById = (id: string) =>
  WATER_TINTS.find((entry) => entry.id === id) ?? WATER_TINTS[0];

export function upgradeCost(id: UpgradeDef["id"], level: number) {
  const def = UPGRADES.find((entry) => entry.id === id);
  if (!def) return Infinity;
  return def.costs[level] ?? Infinity;
}

export function maxUpgradeLevel(id: UpgradeDef["id"]) {
  const def = UPGRADES.find((entry) => entry.id === id);
  return def ? def.costs.length : 0;
}

export function pondSlots(level: number) {
  return BALANCE.pond.slots[Math.min(level, BALANCE.pond.slots.length - 1)];
}
export function decorSlots(level: number) {
  return BALANCE.pond.decorSlots[Math.min(level, BALANCE.pond.decorSlots.length - 1)];
}
export function plantSlots(level: number) {
  return BALANCE.pond.plantSlots[Math.min(level, BALANCE.pond.plantSlots.length - 1)];
}
