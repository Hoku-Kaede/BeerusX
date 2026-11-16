"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BALANCE } from "./config";
import {
  beautyOf,
  clockStamp,
  fmtCoins,
  incomePerSecond,
  offlineEarnings,
  waterRgb,
} from "./economy";
import {
  createInitialSave,
  clearGame,
  loadGame,
  saveGame,
} from "./save";
import { dateKey, gameReducer, type GameAction } from "./state";
import type { GameState, Rarity } from "./types";

type FloatCoin = {
  id: number;
  x: number;
  y: number;
  amount: number;
  rarity?: Rarity;
};

type Welcome = {
  coins: number;
  hours: number;
};

type GameContextValue = {
  state: GameState;
  dispatch: (action: GameAction) => void;
  income: number;
  beauty: number;
  floats: FloatCoin[];
  spawnFloat: (amount: number, nx: number, ny: number, rarity?: Rarity) => void;
  feed: () => boolean;
  eat: (count: number, nx: number, ny: number, rarity: Rarity) => void;
  play: (kind: "coin" | "feed" | "buy" | "claim" | "error") => void;
  welcome: Welcome | null;
  dismissWelcome: () => void;
  dailyClaimable: boolean;
  dailyReward: number;
  resetProgress: () => void;
  toast: string | null;
  notify: (message: string) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

const noopStorage = () => undefined;

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    createInitialSave,
  );
  const [floats, setFloats] = useState<FloatCoin[]>([]);
  const [welcome, setWelcome] = useState<Welcome | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const nextFloat = useRef(1);
  const audioRef = useRef<AudioContext | null>(null);
  const loadedRef = useRef(false);
  const toastTimer = useRef<number | null>(null);

  // Load once, then settle offline income + hunger since the last visit.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const saved = loadGame();
    const now = Date.now();
    const offline = offlineEarnings(saved, now);
    dispatch({
      type: "replace",
      state: { ...saved, lastSeen: now },
    });
    if (offline.coins > 0) {
      dispatch({ type: "offline", coins: offline.coins });
      setWelcome({
        coins: offline.coins,
        hours: offline.seconds / 3600,
      });
    }
  }, []);

  // Passive income and hunger. One interval, one reducer tick.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return;
      dispatch({ type: "tick", dt: 1, now: Date.now() });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Debounced persistence, plus a flush when the tab is hidden.
  useEffect(() => {
    if (!loadedRef.current) return;
    const id = window.setTimeout(() => saveGame(state), 700);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    const flush = () => saveGame(state);
    const onVisibility = () => {
      if (document.hidden) flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const play = useCallback((kind: "coin" | "feed" | "buy" | "claim" | "error") => {
    if (!state.settings.sound) return;
    try {
      audioRef.current ??= new AudioContext();
      const ctx = audioRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const map = {
        coin: [660, 990, 0.12],
        feed: [320, 220, 0.16],
        buy: [440, 740, 0.2],
        claim: [520, 880, 0.28],
        error: [180, 140, 0.16],
      } as const;
      const [from, to, length] = map[kind];
      osc.type = kind === "error" ? "square" : "sine";
      osc.frequency.setValueAtTime(from, now);
      osc.frequency.exponentialRampToValueAtTime(to, now + length);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
      osc.start(now);
      osc.stop(now + length + 0.02);
    } catch {
      // Audio is a nicety; never block the pond on it.
    }
  }, [state.settings.sound]);

  const spawnFloat = useCallback(
    (amount: number, nx: number, ny: number, rarity?: Rarity) => {
      const id = nextFloat.current++;
      setFloats((current) => [
        ...current.slice(-11),
        { id, x: nx, y: ny, amount, rarity },
      ]);
      window.setTimeout(() => {
        setFloats((current) => current.filter((entry) => entry.id !== id));
      }, 1150);
    },
    [],
  );

  const feed = useCallback(() => {
    if (state.coins < BALANCE.economy.feedCost) {
      notify("Not enough coins to feed");
      play("error");
      return false;
    }
    dispatch({ type: "feed", now: Date.now() });
    play("feed");
    return true;
  }, [state.coins, notify, play]);

  const eat = useCallback(
    (count: number, nx: number, ny: number, rarity: Rarity) => {
      if (count <= 0) return;
      const reward = count * BALANCE.economy.feedReward;
      dispatch({ type: "eat", count });
      spawnFloat(reward, nx, ny, rarity);
      play("coin");
    },
    [spawnFloat, play],
  );

  const dismissWelcome = useCallback(() => setWelcome(null), []);

  const resetProgress = useCallback(() => {
    clearGame();
    dispatch({ type: "replace", state: createInitialSave() });
    notify("Progress reset");
  }, [notify]);

  const income = useMemo(() => incomePerSecond(state), [state]);
  const beauty = useMemo(() => beautyOf(state), [state]);
  const dailyClaimable = state.daily.lastClaim !== clockStamp();
  const dailyReward =
    BALANCE.economy.dailyBase +
    (state.daily.lastClaim === dateKey(Date.now() - 86_400_000)
      ? Math.min(
          state.daily.streak,
          BALANCE.economy.dailyMaxStreak - 1,
        )
      : 0) *
      BALANCE.economy.dailyStep;

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      dispatch,
      income,
      beauty,
      floats,
      spawnFloat,
      feed,
      eat,
      play,
      welcome,
      dismissWelcome,
      dailyClaimable,
      dailyReward,
      resetProgress,
      toast,
      notify,
    }),
    [
      state,
      income,
      beauty,
      floats,
      spawnFloat,
      feed,
      eat,
      play,
      welcome,
      dismissWelcome,
      dailyClaimable,
      dailyReward,
      resetProgress,
      toast,
      notify,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside GameProvider");
  return value;
}

export { fmtCoins, waterRgb };
export type { FloatCoin };
