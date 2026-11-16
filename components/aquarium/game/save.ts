import { BALANCE } from "./config";
import type { GameState } from "./types";

/**
 * Single persistence boundary. Every read/write of the save goes through this
 * module so a server-backed save can replace localStorage without touching the
 * game reducer, the HUD or the scene.
 */

const storageKey = BALANCE.saveKey;

export function createInitialSave(now = Date.now()): GameState {
  return {
    version: BALANCE.saveVersion,
    coins: BALANCE.startingCoins,
    lifetimeCoins: BALANCE.startingCoins,
    lastSeen: now,
    daily: { lastClaim: "", streak: 0 },
    // The three residents the pond shipped with. One is the starting koi;
    // the other two keep the opening scene as composed in the Figma frame.
    fish: [
      {
        instanceId: "resident-kohaku",
        itemId: "kohaku",
        name: "Kohaku",
        hunger: 82,
        lastFedAt: now,
      },
      {
        instanceId: "resident-sanke",
        itemId: "sanke",
        name: "Sanke",
        hunger: 76,
        lastFedAt: now,
      },
      {
        instanceId: "resident-showa",
        itemId: "showa",
        name: "Showa",
        hunger: 70,
        lastFedAt: now,
      },
    ],
    ownedPlants: [],
    ownedDecor: [],
    placedPlants: [],
    placedDecor: [],
    waterTint: "crimson",
    ownedWater: ["crimson"],
    activeLightId: "daylight",
    ownedLights: ["daylight"],
    isNight: false,
    plaque: { text: "KYOKO", font: "display", color: "#e9b96e" },
    upgrades: { pond: 0, filter: 0, autoFeeder: 0, booster: 0 },
    quests: { feeds: 0, plantsBought: 0, species: 3, coins: 0 },
    claimedQuests: [],
    settings: { sound: false, reducedFx: false },
  };
}

function sanitize(input: unknown, now: number): GameState {
  const base = createInitialSave(now);
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<GameState>;
  if (raw.version !== BALANCE.saveVersion) {
    // Kept as a single migration point. The v1 prototype had no save; older
    // or unknown versions start clean instead of half-loading.
    if (raw.version && raw.version < BALANCE.saveVersion) return base;
    return base;
  }
  return {
    ...base,
    ...raw,
    coins: Number.isFinite(raw.coins) ? Math.max(0, raw.coins as number) : base.coins,
    lifetimeCoins: Number.isFinite(raw.lifetimeCoins)
      ? Math.max(0, raw.lifetimeCoins as number)
      : base.lifetimeCoins,
    lastSeen: Number.isFinite(raw.lastSeen) ? (raw.lastSeen as number) : now,
    daily: { ...base.daily, ...(raw.daily ?? {}) },
    fish: Array.isArray(raw.fish) && raw.fish.length ? raw.fish : base.fish,
    ownedPlants: Array.isArray(raw.ownedPlants) ? raw.ownedPlants : [],
    ownedDecor: Array.isArray(raw.ownedDecor) ? raw.ownedDecor : [],
    placedPlants: Array.isArray(raw.placedPlants) ? raw.placedPlants : [],
    placedDecor: Array.isArray(raw.placedDecor) ? raw.placedDecor : [],
    upgrades: { ...base.upgrades, ...(raw.upgrades ?? {}) },
    quests: { ...base.quests, ...(raw.quests ?? {}) },
    claimedQuests: Array.isArray(raw.claimedQuests) ? raw.claimedQuests : [],
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    plaque: raw.plaque ?? base.plaque,
    waterTint: raw.waterTint ?? base.waterTint,
    ownedWater: Array.isArray(raw.ownedWater) ? raw.ownedWater : base.ownedWater,
    activeLightId: raw.activeLightId ?? base.activeLightId,
    ownedLights: Array.isArray(raw.ownedLights) ? raw.ownedLights : base.ownedLights,
    isNight: Boolean(raw.isNight),
  };
}

export function loadGame(): GameState {
  if (typeof window === "undefined") return createInitialSave();
  try {
    const text = window.localStorage.getItem(storageKey);
    if (!text) return createInitialSave();
    return sanitize(JSON.parse(text), Date.now());
  } catch (error) {
    console.warn("[kyoko] Could not load the save", error);
    return createInitialSave();
  }
}

export function saveGame(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ ...state, lastSeen: Date.now() }),
    );
  } catch (error) {
    console.warn("[kyoko] Could not write the save", error);
  }
}

export function clearGame() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn("[kyoko] Could not clear the save", error);
  }
}

export function saveSignature(state: GameState) {
  return JSON.stringify({
    fish: state.fish.map((entry) => entry.instanceId),
    plants: state.placedPlants,
    decor: state.placedDecor,
    plaque: state.plaque,
    waterTint: state.waterTint,
    light: state.activeLightId,
    night: state.isNight,
  });
}
