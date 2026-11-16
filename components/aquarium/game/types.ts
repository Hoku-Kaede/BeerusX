export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type PlantKind =
  | "seaweed"
  | "lily"
  | "lotus"
  | "kelp"
  | "ribbon"
  | "fern";

export type DecorKind =
  | "rocks"
  | "driftwood"
  | "stone_lantern"
  | "bridge"
  | "statue"
  | "torii";

export type ShopTab =
  | "Fish"
  | "Plants"
  | "Lights"
  | "Decor"
  | "Water"
  | "Upgrades";

export type FishDef = {
  id: string;
  name: string;
  rarity: Rarity;
  price: number;
  /** Index into KOI_SOURCES — every species reuses the authored bone rig. */
  source: number;
  /** Multiplicative body colour. */
  tint: readonly [number, number, number];
  /** Emissive rim, 0 = none. */
  glow: number;
  /** Spine length as a fraction of the pond's short side. */
  length: number;
  /** Cruise speed as a fraction of the pond's short side per second. */
  cruise: number;
  /** Tail-beat frequency multiplier. */
  tail: number;
  blurb: string;
};

export type PlantDef = {
  id: string;
  name: string;
  kind: PlantKind;
  price: number;
  beauty: number;
  blurb: string;
};

export type DecorDef = {
  id: string;
  name: string;
  kind: DecorKind;
  price: number;
  beauty: number;
  /** Optional image-backed thumbnail and in-scene asset. */
  imageUrl?: string;
  blurb: string;
};

export type LightDef = {
  id: string;
  name: string;
  price: number;
  beauty: number;
  /** 0 none · 1 warm lanterns · 2 moonlight · 3 Kyoto neon · 4 bioluminescent. */
  lightKind: number;
  night?: boolean;
  blurb: string;
};

export type WaterDef = {
  id: string;
  name: string;
  price: number;
  rgb: readonly [number, number, number];
  blurb: string;
};

export type UpgradeId = "pond" | "filter" | "autoFeeder" | "booster";

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  blurb: string;
  /** Cost to reach level index + 1. */
  costs: readonly number[];
};

export type QuestMetric = "feeds" | "plantsBought" | "species" | "coins";

export type QuestDef = {
  id: string;
  label: string;
  metric: QuestMetric;
  target: number;
  reward: number;
};

export type PlacedPlant = {
  instanceId: string;
  itemId: string;
  kind: PlantKind;
  nx: number;
  ny: number;
  scale: number;
  rotation: number;
  seed: number;
};

export type PlacedDecor = {
  instanceId: string;
  itemId: string;
  kind: DecorKind;
  nx: number;
  ny: number;
  scale: number;
  rotation: number;
  seed: number;
  imageUrl?: string;
};

export type PlaqueFont = "display" | "sans" | "mono";

export type Plaque = {
  text: string;
  font: PlaqueFont;
  color: string;
};

export type OwnedFish = {
  instanceId: string;
  itemId: string;
  name: string;
  /** 0 — 100. Well fed fish earn more. */
  hunger: number;
  /** Unix ms of the last feed. */
  lastFedAt: number;
};

export type OwnedItem = {
  instanceId: string;
  itemId: string;
  placed: boolean;
};

export type QuestProgress = {
  feeds: number;
  plantsBought: number;
  species: number;
  coins: number;
};

export type GameSettings = {
  sound: boolean;
  reducedFx: boolean;
};

export type GameState = {
  version: number;
  coins: number;
  lifetimeCoins: number;
  lastSeen: number;
  daily: {
    lastClaim: string;
    streak: number;
  };
  fish: OwnedFish[];
  ownedPlants: OwnedItem[];
  ownedDecor: OwnedItem[];
  placedPlants: PlacedPlant[];
  placedDecor: PlacedDecor[];
  waterTint: string;
  ownedWater: string[];
  activeLightId: string;
  ownedLights: string[];
  isNight: boolean;
  plaque: Plaque | null;
  upgrades: Record<UpgradeId, number>;
  quests: QuestProgress;
  claimedQuests: string[];
  settings: GameSettings;
};

export type AquariumEnvironment = {
  plants: PlacedPlant[];
  decor: PlacedDecor[];
  plaque: Plaque | null;
  waterRgb: readonly [number, number, number];
  waterCustomMix: number;
  lightKind: number;
  lightColor: readonly [number, number, number];
  lightIntensity: number;
  nightFactor: number;
  calm: boolean;
};

export type FeedReward = {
  amount: number;
  nx: number;
  ny: number;
  rarity: Rarity;
};
