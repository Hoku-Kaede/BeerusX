import {
  BALANCE,
  QUESTS,
  decorById,
  decorSlots,
  fishById,
  lightById,
  plantById,
  plantSlots,
  pondSlots,
  upgradeCost,
  waterById,
} from "./config";
import { incomePerSecond, makeId, nextFishName, questMetric } from "./economy";
import type {
  GameState,
  PlacedDecor,
  PlacedPlant,
  Plaque,
} from "./types";

export type GameAction =
  | { type: "tick"; dt: number; now: number }
  | { type: "feed"; now: number }
  | { type: "eat"; count: number }
  | { type: "buyFish"; itemId: string }
  | { type: "buyPlant"; itemId: string }
  | { type: "buyDecor"; itemId: string }
  | { type: "buyLight"; itemId: string }
  | { type: "buyWater"; itemId: string }
  | { type: "buyUpgrade"; id: "pond" | "filter" | "autoFeeder" | "booster" }
  | { type: "placePlant"; instanceId: string; nx: number; ny: number }
  | { type: "placeDecor"; instanceId: string; nx: number; ny: number }
  | { type: "updatePlant"; instanceId: string; patch: Partial<PlacedPlant> }
  | { type: "updateDecor"; instanceId: string; patch: Partial<PlacedDecor> }
  | { type: "sellPlant"; instanceId: string }
  | { type: "sellDecor"; instanceId: string }
  | { type: "setWater"; id: string }
  | { type: "setLight"; id: string }
  | { type: "toggleNight" }
  | { type: "setPlaque"; plaque: Plaque | null }
  | { type: "claimQuest"; id: string }
  | { type: "claimDaily"; now: number }
  | { type: "setSettings"; patch: Partial<GameState["settings"]> }
  | { type: "offline"; coins: number }
  | { type: "replace"; state: GameState };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const snap = (value: number) =>
  clamp(
    Math.round(value / BALANCE.decorate.gridSnap) * BALANCE.decorate.gridSnap,
    BALANCE.decorate.minX,
    BALANCE.decorate.maxX,
  );

function spend(state: GameState, cost: number) {
  if (state.coins < cost) return null;
  return { ...state, coins: state.coins - cost };
}

function addCoins(state: GameState, amount: number) {
  if (amount <= 0) return state;
  return {
    ...state,
    coins: state.coins + amount,
    lifetimeCoins: state.lifetimeCoins + amount,
    quests: {
      ...state.quests,
      coins: state.quests.coins + amount,
    },
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "replace":
      return action.state;

    case "offline":
      return action.coins > 0 ? addCoins(state, action.coins) : state;

    case "tick": {
      const decay =
        (BALANCE.economy.hungerDecayPerMinute / 60) *
        action.dt *
        Math.max(
          0.15,
          1 - state.upgrades.autoFeeder * BALANCE.economy.autoFeederSlow,
        );
      const fish = state.fish.map((entry) => ({
        ...entry,
        hunger: clamp(entry.hunger - decay, 0, 100),
      }));
      const next = { ...state, fish };
      // Passive income comes from the one shared economy function, so the HUD
      // rate and the coins actually credited can never drift apart.
      return addCoins(next, incomePerSecond(next) * action.dt);
    }

    case "feed": {
      if (state.coins < BALANCE.economy.feedCost) return state;
      const paid = spend(state, BALANCE.economy.feedCost);
      if (!paid) return state;
      return {
        ...paid,
        fish: paid.fish.map((entry) => ({
          ...entry,
          hunger: clamp(entry.hunger + BALANCE.economy.feedGain, 0, 100),
          lastFedAt: action.now,
        })),
        quests: {
          ...paid.quests,
          feeds: paid.quests.feeds + 1,
        },
      };
    }

    case "eat": {
      const amount = Math.max(0, action.count) * BALANCE.economy.feedReward;
      return amount ? addCoins(state, amount) : state;
    }

    case "buyFish": {
      const def = fishById(action.itemId);
      if (state.fish.length >= pondSlots(state.upgrades.pond)) return state;
      if (state.coins < def.price) return state;
      const paid = spend(state, def.price);
      if (!paid) return state;
      const species = new Set(paid.fish.map((entry) => entry.itemId));
      species.add(def.id);
      return {
        ...paid,
        fish: [
          ...paid.fish,
          {
            instanceId: makeId("fish"),
            itemId: def.id,
            name: nextFishName(paid, def.id),
            hunger: 72,
            lastFedAt: Date.now(),
          },
        ],
        quests: { ...paid.quests, species: species.size },
      };
    }

    case "buyPlant": {
      const def = plantById(action.itemId);
      if (state.coins < def.price) return state;
      const paid = spend(state, def.price);
      if (!paid) return state;
      return {
        ...paid,
        ownedPlants: [
          ...paid.ownedPlants,
          { instanceId: makeId("plant"), itemId: def.id, placed: false },
        ],
        quests: {
          ...paid.quests,
          plantsBought: paid.quests.plantsBought + 1,
        },
      };
    }

    case "buyDecor": {
      const def = decorById(action.itemId);
      if (state.coins < def.price) return state;
      const paid = spend(state, def.price);
      if (!paid) return state;
      return {
        ...paid,
        ownedDecor: [
          ...paid.ownedDecor,
          { instanceId: makeId("decor"), itemId: def.id, placed: false },
        ],
      };
    }

    case "buyLight": {
      const def = lightById(action.itemId);
      if (state.ownedLights.includes(def.id)) {
        return {
          ...state,
          activeLightId: def.id,
          isNight: def.night ? true : state.isNight,
        };
      }
      if (state.coins < def.price) return state;
      const paid = spend(state, def.price);
      if (!paid) return state;
      return {
        ...paid,
        activeLightId: def.id,
        ownedLights: [...paid.ownedLights, def.id],
        isNight: def.night ? true : paid.isNight,
      };
    }

    case "buyWater": {
      const def = waterById(action.itemId);
      if (state.ownedWater.includes(def.id)) {
        return { ...state, waterTint: def.id };
      }
      if (state.coins < def.price) return state;
      const paid = spend(state, def.price);
      if (!paid) return state;
      return {
        ...paid,
        waterTint: def.id,
        ownedWater: [...paid.ownedWater, def.id],
      };
    }

    case "buyUpgrade": {
      const level = state.upgrades[action.id];
      const cost = upgradeCost(action.id, level);
      if (!Number.isFinite(cost) || state.coins < cost) return state;
      const paid = spend(state, cost);
      if (!paid) return state;
      return {
        ...paid,
        upgrades: { ...paid.upgrades, [action.id]: level + 1 },
      };
    }

    case "placePlant": {
      if (state.placedPlants.length >= plantSlots(state.upgrades.pond)) {
        return state;
      }
      const owned = state.ownedPlants.find(
        (entry) => entry.instanceId === action.instanceId && !entry.placed,
      );
      if (!owned) return state;
      const def = plantById(owned.itemId);
      return {
        ...state,
        ownedPlants: state.ownedPlants.map((entry) =>
          entry.instanceId === owned.instanceId
            ? { ...entry, placed: true }
            : entry,
        ),
        placedPlants: [
          ...state.placedPlants,
          {
            instanceId: owned.instanceId,
            itemId: owned.itemId,
            kind: def.kind,
            nx: snap(action.nx),
            ny: snap(action.ny),
            scale: 1,
            rotation: 0,
            seed: hashSeed(owned.instanceId),
          },
        ],
      };
    }

    case "placeDecor": {
      if (state.placedDecor.length >= decorSlots(state.upgrades.pond)) {
        return state;
      }
      const owned = state.ownedDecor.find(
        (entry) => entry.instanceId === action.instanceId && !entry.placed,
      );
      if (!owned) return state;
      const def = decorById(owned.itemId);
      return {
        ...state,
        ownedDecor: state.ownedDecor.map((entry) =>
          entry.instanceId === owned.instanceId
            ? { ...entry, placed: true }
            : entry,
        ),
        placedDecor: [
          ...state.placedDecor,
          {
            instanceId: owned.instanceId,
            itemId: owned.itemId,
            kind: def.kind,
            nx: snap(action.nx),
            ny: snap(action.ny),
            scale: 1,
            rotation: 0,
            seed: hashSeed(owned.instanceId),
            imageUrl: def.imageUrl,
          },
        ],
      };
    }

    case "updatePlant": {
      return {
        ...state,
        placedPlants: state.placedPlants.map((entry) =>
          entry.instanceId === action.instanceId
            ? {
                ...entry,
                ...action.patch,
                nx:
                  action.patch.nx == null ? entry.nx : snap(action.patch.nx),
                ny:
                  action.patch.ny == null ? entry.ny : snap(action.patch.ny),
                scale: clamp(
                  action.patch.scale ?? entry.scale,
                  BALANCE.decorate.minScale,
                  BALANCE.decorate.maxScale,
                ),
              }
            : entry,
        ),
      };
    }

    case "updateDecor": {
      return {
        ...state,
        placedDecor: state.placedDecor.map((entry) =>
          entry.instanceId === action.instanceId
            ? {
                ...entry,
                ...action.patch,
                nx:
                  action.patch.nx == null ? entry.nx : snap(action.patch.nx),
                ny:
                  action.patch.ny == null ? entry.ny : snap(action.patch.ny),
                scale: clamp(
                  action.patch.scale ?? entry.scale,
                  BALANCE.decorate.minScale,
                  BALANCE.decorate.maxScale,
                ),
              }
            : entry,
        ),
      };
    }

    case "sellPlant": {
      const placed = state.placedPlants.find(
        (entry) => entry.instanceId === action.instanceId,
      );
      if (!placed) return state;
      const def = plantById(placed.itemId);
      return addCoins(
        {
          ...state,
          placedPlants: state.placedPlants.filter(
            (entry) => entry.instanceId !== action.instanceId,
          ),
          ownedPlants: state.ownedPlants.filter(
            (entry) => entry.instanceId !== action.instanceId,
          ),
        },
        Math.round(def.price * BALANCE.decorate.sellRefund),
      );
    }

    case "sellDecor": {
      const placed = state.placedDecor.find(
        (entry) => entry.instanceId === action.instanceId,
      );
      if (!placed) return state;
      const def = decorById(placed.itemId);
      return addCoins(
        {
          ...state,
          placedDecor: state.placedDecor.filter(
            (entry) => entry.instanceId !== action.instanceId,
          ),
          ownedDecor: state.ownedDecor.filter(
            (entry) => entry.instanceId !== action.instanceId,
          ),
        },
        Math.round(def.price * BALANCE.decorate.sellRefund),
      );
    }

    case "setWater":
      return state.ownedWater.includes(action.id)
        ? { ...state, waterTint: action.id }
        : state;

    case "setLight":
      return state.ownedLights.includes(action.id)
        ? {
            ...state,
            activeLightId: action.id,
            isNight: lightById(action.id).night ? true : state.isNight,
          }
        : state;

    case "toggleNight":
      return { ...state, isNight: !state.isNight };

    case "setPlaque":
      return { ...state, plaque: action.plaque };

    case "claimQuest": {
      const quest = QUESTS.find((entry) => entry.id === action.id);
      if (!quest || state.claimedQuests.includes(action.id)) return state;
      if (questMetric(state, quest.metric) < quest.target) return state;
      return addCoins(
        {
          ...state,
          claimedQuests: [...state.claimedQuests, action.id],
        },
        quest.reward,
      );
    }

    case "claimDaily": {
      const today = dateKey(action.now);
      if (state.daily.lastClaim === today) return state;
      const yesterday = dateKey(action.now - 86_400_000);
      const streak =
        state.daily.lastClaim === yesterday
          ? Math.min(state.daily.streak + 1, BALANCE.economy.dailyMaxStreak)
          : 1;
      const reward =
        BALANCE.economy.dailyBase +
        (streak - 1) * BALANCE.economy.dailyStep;
      return {
        ...addCoins(state, reward),
        daily: { lastClaim: today, streak },
      };
    }

    case "setSettings":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    default:
      return state;
  }
}

function dateKey(value: number) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export { dateKey, snap };
