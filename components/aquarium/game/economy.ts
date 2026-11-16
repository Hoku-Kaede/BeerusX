import {
  BALANCE,
  decorById,
  fishById,
  lightById,
  plantById,
  pondSlots,
  waterById,
} from "./config";
import type {
  GameState,
  OwnedFish,
  QuestMetric,
  Rarity,
} from "./types";

export function happinessOf(fish: OwnedFish, filterLevel: number) {
  const comfort = Math.min(0.3, filterLevel * BALANCE.economy.filterComfort);
  const raw = fish.hunger / 100;
  const eased = raw * (1 - comfort) + comfort;
  return Math.max(
    BALANCE.economy.happinessMin,
    Math.min(
      BALANCE.economy.happinessMax,
      BALANCE.economy.happinessMin +
        eased * (BALANCE.economy.happinessMax - BALANCE.economy.happinessMin),
    ),
  );
}

export function beautyOf(state: GameState) {
  let beauty = 0;
  for (const plant of state.placedPlants) {
    const def = plantById(plant.itemId);
    beauty += def.beauty * plant.scale;
  }
  for (const decor of state.placedDecor) {
    const def = decorById(decor.itemId);
    beauty += def.beauty * decor.scale;
  }
  beauty += lightById(state.activeLightId).beauty;
  beauty += state.fish.length * 1.5;
  return Math.round(beauty * 10) / 10;
}

export function incomePerSecond(state: GameState) {
  const beauty = beautyOf(state);
  const booster = 1 + state.upgrades.booster * BALANCE.economy.boosterStep;
  const beautyBoost = 1 + beauty * BALANCE.economy.beautyFactor;
  let total = 0;
  for (const fish of state.fish) {
    const def = fishById(fish.itemId);
    const rarity = BALANCE.rarity[def.rarity].multiplier;
    total +=
      BALANCE.economy.fishBase *
      rarity *
      happinessOf(fish, state.upgrades.filter) *
      beautyBoost *
      booster;
  }
  return total;
}

export function offlineEarnings(state: GameState, now: number) {
  const elapsed = Math.max(0, (now - state.lastSeen) / 1000);
  const capped = Math.min(elapsed, BALANCE.economy.offlineCap);
  if (capped < 45 || state.fish.length === 0) return { coins: 0, seconds: 0 };
  return {
    coins: Math.floor(incomePerSecond(state) * capped),
    seconds: Math.floor(capped),
  };
}

export function questMetric(state: GameState, metric: QuestMetric) {
  switch (metric) {
    case "feeds":
      return state.quests.feeds;
    case "plantsBought":
      return state.quests.plantsBought;
    case "species":
      return new Set(state.fish.map((fish) => fish.itemId)).size;
    case "coins":
      return Math.floor(state.quests.coins);
  }
}

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function rarityColor(rarity: Rarity) {
  return BALANCE.rarity[rarity].color;
}

export function fishCapacity(state: GameState) {
  return pondSlots(state.upgrades.pond);
}

export function nextFishName(state: GameState, itemId: string) {
  const def = fishById(itemId);
  const count = state.fish.filter((fish) => fish.itemId === itemId).length;
  return count === 0 ? def.name : `${def.name} ${count + 1}`;
}

export function fmtCoins(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 1000) return Math.floor(value).toLocaleString("en-US");
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export function clockStamp(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function waterRgb(state: GameState) {
  return waterById(state.waterTint).rgb;
}

export function environmentOf(state: GameState) {
  const rgb = waterById(state.waterTint).rgb;
  const light = lightById(state.activeLightId);
  return {
    plants: state.placedPlants,
    decor: state.placedDecor,
    plaque: state.plaque,
    waterRgb: rgb,
    waterCustomMix: state.waterTint === "crimson" ? 0 : 1,
    lightKind: light.lightKind,
    lightColor: lightColor(state),
    lightIntensity: state.isNight ? 1.35 : 1,
    nightFactor: state.isNight || light.night ? 1 : 0,
    calm: false,
  };
}

export function buildRoster(state: GameState) {
  return state.fish.map((owned, index) => {
    const def = fishById(owned.itemId);
    const column = index % 4;
    const row = Math.floor(index / 4);
    return {
      id: owned.instanceId,
      itemId: def.id,
      source: def.source,
      length: def.length,
      cruise: def.cruise,
      depth: 0.3 + ((index * 0.17) % 0.5),
      tint: def.tint,
      glow: def.glow,
      tail: def.tail,
      rarity: def.rarity,
      // Four to a row, staggered, so a growing school fills the pond instead
      // of piling onto the three Figma lanes.
      home: [
        0.18 + column * 0.2,
        0.26 + row * 0.16 + (column % 2) * 0.1,
      ] as [number, number],
      heading: (index % 2 === 0 ? 0.42 : -1.18) + (index % 3) * 0.3,
    };
  });
}

export function lightColor(state: GameState): readonly [number, number, number] {
  switch (lightById(state.activeLightId).lightKind) {
    case 1:
      return [1.0, 0.62, 0.28];
    case 2:
      return [0.62, 0.76, 1.0];
    case 3:
      return [0.92, 0.3, 0.72];
    case 4:
      return [0.32, 1.0, 0.82];
    default:
      return [1.0, 0.72, 0.42];
  }
}
