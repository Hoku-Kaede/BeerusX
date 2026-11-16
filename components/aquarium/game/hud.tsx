"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  BALANCE,
  DECOR,
  FISH,
  LIGHTS,
  PLANTS,
  QUESTS,
  UPGRADES,
  WATER_TINTS,
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
import { fmtCoins, questMetric } from "./economy";
import { useGame } from "./GameContext";
import type {
  DecorDef,
  FishDef,
  LightDef,
  PlantDef,
  QuestDef,
  ShopTab,
  UpgradeDef,
  WaterDef,
} from "./types";

const TABS: readonly ShopTab[] = [
  "Fish",
  "Plants",
  "Lights",
  "Decor",
  "Water",
  "Upgrades",
];

type Reveal = { name: string; rarity: FishDef["rarity"]; tint: readonly [number, number, number] };

export function GameHud({
  decorate,
  onToggleDecorate,
}: {
  decorate: boolean;
  onToggleDecorate: () => void;
}) {
  const { state, dispatch, income, beauty, floats, welcome, dismissWelcome, dailyClaimable, dailyReward, resetProgress, toast, notify, play } =
    useGame();
  const [panel, setPanel] = useState<"shop" | "quests" | "settings" | null>(null);
  const [tab, setTab] = useState<ShopTab>("Fish");
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [rotatingCoin, setRotatingCoin] = useState(0);
  const [plaqueText, setPlaqueText] = useState(state.plaque?.text ?? "");

  useEffect(() => {
    setRotatingCoin((value) => value + 1);
  }, [Math.floor(state.coins)]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const revealTimer = useRefSafe();

  const revealFish = (def: FishDef) => {
    setReveal({ name: def.name, rarity: def.rarity, tint: def.tint });
    play("buy");
    revealTimer(() => setReveal(null), 2400);
  };

  const slots = pondSlots(state.upgrades.pond);
  const plantedCount = state.placedPlants.length;
  const decorCount = state.placedDecor.length;

  const buy = (action: () => void) => {
    action();
    play("buy");
  };

  const quests = QUESTS;

  return (
    <>
      <div className="aq-hud">
        <div className="aq-hud__stats">
          <div className="aq-hud__coins" key={rotatingCoin} aria-live="polite">
            <span className="aq-hud__coin" aria-hidden="true" />
            <span>{fmtCoins(state.coins)}</span>
          </div>
          <div className="aq-hud__meta">
            <span className="aq-hud__income">+{income.toFixed(2)}/s</span>
            <span className="aq-hud__beauty">{beauty.toFixed(1)} beauty</span>
          </div>
        </div>

        <nav className="aq-hud__actions" aria-label="Aquarium game">
          <button
            type="button"
            className="aq-hud__btn"
            data-aq-control
            aria-pressed={panel === "shop"}
            onClick={() => setPanel(panel === "shop" ? null : "shop")}
          >
            Shop
          </button>
          <button
            type="button"
            className="aq-hud__btn"
            data-aq-control
            aria-pressed={decorate}
            onClick={onToggleDecorate}
          >
            {decorate ? "Done" : "Decorate"}
          </button>
          <button
            type="button"
            className="aq-hud__btn"
            data-aq-control
            aria-pressed={panel === "quests"}
            onClick={() => setPanel(panel === "quests" ? null : "quests")}
          >
            Quests
          </button>
          <button
            type="button"
            className="aq-hud__btn"
            data-aq-control
            aria-pressed={panel === "settings"}
            onClick={() => setPanel(panel === "settings" ? null : "settings")}
          >
            Settings
          </button>
          {dailyClaimable ? (
            <button
              type="button"
              className="aq-hud__btn aq-hud__btn--gold"
              data-aq-control
              onClick={() => {
                dispatch({ type: "claimDaily", now: Date.now() });
                play("claim");
                notify(`Daily reward +${dailyReward}`);
              }}
            >
              Daily +{dailyReward}
            </button>
          ) : null}
        </nav>
      </div>

      {floats.map((float) => (
        <span
          key={float.id}
          className="aq-float-coin"
          style={{
            left: `${float.x * 100}%`,
            top: `${float.y * 100}%`,
            color: float.rarity
              ? BALANCE.rarity[float.rarity].color
              : "var(--aq-gold)",
          }}
          aria-hidden="true"
        >
          +{float.amount}
        </span>
      ))}

      {welcome ? (
        <div className="aq-modal" role="dialog" aria-modal="true" aria-labelledby="aq-welcome-title">
          <div className="aq-modal__card">
            <p className="aq-panel__eyebrow">Welcome back</p>
            <h2 id="aq-welcome-title">The pond kept swimming.</h2>
            <p>
              You were away for {welcome.hours < 1 ? "a little while" : `${welcome.hours.toFixed(1)} hours`}.
              Your koi earned <strong>{fmtCoins(welcome.coins)} coins</strong>.
            </p>
            <button type="button" className="aq-btn" onClick={dismissWelcome}>
              Collect
            </button>
          </div>
        </div>
      ) : null}

      {reveal ? (
        <div className={`aq-loot aq-loot--${reveal.rarity}`} role="status">
          <span className="aq-loot__ring" aria-hidden="true" />
          <span className="aq-loot__fish" style={{ background: `rgb(${reveal.tint.map((v) => Math.round(v * 180)).join(" ")})` }} />
          <span className="aq-loot__rarity">{BALANCE.rarity[reveal.rarity].label}</span>
          <strong>{reveal.name}</strong>
          <span>joined the pond</span>
        </div>
      ) : null}

      {toast ? (
        <div className="aq-toast" role="status">
          {toast}
        </div>
      ) : null}

      {panel === "shop" ? (
        <section className="aq-shop" aria-label="Shop">
          <header className="aq-shop__head">
            <div>
              <p className="aq-panel__eyebrow">Sanctuary supply</p>
              <h2 className="aq-shop__title">Shop</h2>
            </div>
            <button
              type="button"
              className="aq-panel__close"
              aria-label="Close shop"
              onClick={() => setPanel(null)}
            >
              ×
            </button>
          </header>
          <div className="aq-shop__tabs" role="tablist" aria-label="Shop categories">
            {TABS.map((entry) => (
              <button
                key={entry}
                type="button"
                role="tab"
                aria-selected={tab === entry}
                className="aq-shop__tab"
                data-active={tab === entry ? "true" : "false"}
                onClick={() => setTab(entry)}
              >
                {entry}
              </button>
            ))}
          </div>
          <div className="aq-shop__body">
            {tab === "Fish"
              ? FISH.map((def) => {
                  const owned = state.fish.filter((fish) => fish.itemId === def.id).length;
                  const full = state.fish.length >= slots;
                  const poor = state.coins < def.price;
                  return (
                    <ShopCard
                      key={def.id}
                      name={def.name}
                      blurb={def.blurb}
                      price={def.price}
                      rarity={def.rarity}
                      preview={
                        <span
                          className="aq-shop__fish"
                          style={{
                            background: `linear-gradient(120deg, rgb(${def.tint.map((v) => Math.round(v * 120)).join(" ")}), rgb(${def.tint.map((v) => Math.round(v * 220)).join(" ")}))`,
                          }}
                        />
                      }
                      meta={owned ? `Owned ${owned}` : undefined}
                      disabled={full || poor}
                      status={full ? "Tank full" : poor ? "Not enough coins" : undefined}
                      onBuy={() => {
                        if (full) return notify("Tank is full — upgrade the pond");
                        if (poor) return notify("Not enough coins");
                        buy(() => dispatch({ type: "buyFish", itemId: def.id }));
                        revealFish(def);
                      }}
                    />
                  );
                })
              : null}

            {tab === "Plants"
              ? PLANTS.map((def) => (
                  <ShopCard
                    key={def.id}
                    name={def.name}
                    blurb={def.blurb}
                    price={def.price}
                    preview={<span className="aq-shop__swatch" data-kind={def.kind} />}
                    meta={`+${def.beauty} beauty`}
                    disabled={state.coins < def.price || state.ownedPlants.filter((item) => !item.placed).length + plantedCount >= plantSlots(state.upgrades.pond)}
                    status={
                      state.coins < def.price
                        ? "Not enough coins"
                        : state.ownedPlants.filter((item) => !item.placed).length + plantedCount >= plantSlots(state.upgrades.pond)
                          ? "Plant slots full"
                          : undefined
                    }
                    onBuy={() => {
                      if (state.coins < def.price) return notify("Not enough coins");
                      if (state.ownedPlants.filter((item) => !item.placed).length + plantedCount >= plantSlots(state.upgrades.pond)) {
                        return notify("Plant slots full — upgrade the pond");
                      }
                      buy(() => dispatch({ type: "buyPlant", itemId: def.id }));
                      notify(`${def.name} added to inventory`);
                    }}
                  />
                ))
              : null}

            {tab === "Decor"
              ? DECOR.map((def) => (
                  <ShopCard
                    key={def.id}
                    name={def.name}
                    blurb={def.blurb}
                    price={def.price}
                    preview={
                      def.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="aq-shop__img" src={def.imageUrl} alt="" />
                      ) : (
                        <span className="aq-shop__swatch" data-kind={def.kind} />
                      )
                    }
                    meta={`+${def.beauty} beauty`}
                    disabled={state.coins < def.price || state.ownedDecor.filter((item) => !item.placed).length + decorCount >= decorSlots(state.upgrades.pond)}
                    status={
                      state.coins < def.price
                        ? "Not enough coins"
                        : state.ownedDecor.filter((item) => !item.placed).length + decorCount >= decorSlots(state.upgrades.pond)
                          ? "Decor slots full"
                          : undefined
                    }
                    onBuy={() => {
                      if (state.coins < def.price) return notify("Not enough coins");
                      if (state.ownedDecor.filter((item) => !item.placed).length + decorCount >= decorSlots(state.upgrades.pond)) {
                        return notify("Decor slots full — upgrade the pond");
                      }
                      buy(() => dispatch({ type: "buyDecor", itemId: def.id }));
                      notify(`${def.name} added to inventory`);
                    }}
                  />
                ))
              : null}

            {tab === "Lights"
              ? LIGHTS.map((def) => {
                  const owned = state.ownedLights.includes(def.id);
                  const active = state.activeLightId === def.id;
                  const poor = state.coins < def.price;
                  return (
                    <ShopCard
                      key={def.id}
                      name={def.name}
                      blurb={def.blurb}
                      price={def.price}
                      preview={<span className="aq-shop__swatch" data-kind={`light-${def.lightKind}`} />}
                      meta={`+${def.beauty} beauty`}
                      disabled={!owned && poor}
                      status={active ? "Active" : owned ? "Owned" : poor ? "Not enough coins" : undefined}
                      actionLabel={active ? "Active" : owned ? "Use" : "Buy"}
                      onBuy={() => {
                        if (active) return;
                        if (!owned && poor) return notify("Not enough coins");
                        buy(() => dispatch({ type: "buyLight", itemId: def.id }));
                      }}
                    />
                  );
                })
              : null}

            {tab === "Water"
              ? WATER_TINTS.map((def) => {
                  const owned = state.ownedWater.includes(def.id);
                  const active = state.waterTint === def.id;
                  const poor = state.coins < def.price;
                  return (
                    <ShopCard
                      key={def.id}
                      name={def.name}
                      blurb={def.blurb}
                      price={def.price}
                      preview={
                        <span
                          className="aq-shop__swatch aq-shop__swatch--water"
                          style={{
                            background: `rgb(${def.rgb.map((v) => Math.round(v * 255)).join(" ")})`,
                          }}
                        />
                      }
                      disabled={!owned && poor}
                      status={active ? "Active" : owned ? "Owned" : poor ? "Not enough coins" : undefined}
                      actionLabel={active ? "Active" : owned ? "Use" : "Buy"}
                      onBuy={() => {
                        if (active) return;
                        if (!owned && poor) return notify("Not enough coins");
                        buy(() => dispatch({ type: "buyWater", itemId: def.id }));
                      }}
                    />
                  );
                })
              : null}

            {tab === "Upgrades"
              ? UPGRADES.map((def) => {
                  const level = state.upgrades[def.id];
                  const cost = upgradeCost(def.id, level);
                  const maxed = !Number.isFinite(cost);
                  const poor = state.coins < cost;
                  return (
                    <ShopCard
                      key={def.id}
                      name={`${def.name} · Lv ${level}`}
                      blurb={def.blurb}
                      price={maxed ? 0 : cost}
                      preview={<span className="aq-shop__swatch" data-kind={`upgrade-${def.id}`} />}
                      meta={
                        def.id === "pond"
                          ? `${slots} fish · ${decorSlots(state.upgrades.pond)} decor`
                          : undefined
                      }
                      disabled={maxed || poor}
                      status={maxed ? "Maxed" : poor ? "Not enough coins" : undefined}
                      actionLabel={maxed ? "Maxed" : "Upgrade"}
                      onBuy={() => {
                        if (maxed) return;
                        if (poor) return notify("Not enough coins");
                        buy(() => dispatch({ type: "buyUpgrade", id: def.id }));
                      }}
                    />
                  );
                })
              : null}
          </div>
        </section>
      ) : null}

      {panel === "quests" ? (
        <section className="aq-drawer" aria-label="Quests">
          <header className="aq-shop__head">
            <div>
              <p className="aq-panel__eyebrow">Small ceremonies</p>
              <h2 className="aq-shop__title">Quests</h2>
            </div>
            <button type="button" className="aq-panel__close" aria-label="Close quests" onClick={() => setPanel(null)}>
              ×
            </button>
          </header>
          <div className="aq-quests">
            {quests.map((quest) => (
              <QuestRow
                key={quest.id}
                quest={quest}
                value={questMetric(state, quest.metric)}
                claimed={state.claimedQuests.includes(quest.id)}
                onClaim={() => {
                  dispatch({ type: "claimQuest", id: quest.id });
                  play("claim");
                  notify(`Quest complete +${quest.reward}`);
                }}
              />
            ))}
          </div>
          <p className="aq-panel__note">
            Streak: day {state.daily.streak || 0}. Feeding, buying plants and
            collecting species all count.
          </p>
        </section>
      ) : null}

      {panel === "settings" ? (
        <section className="aq-drawer" aria-label="Settings">
          <header className="aq-shop__head">
            <div>
              <p className="aq-panel__eyebrow">The quiet room</p>
              <h2 className="aq-shop__title">Settings</h2>
            </div>
            <button type="button" className="aq-panel__close" aria-label="Close settings" onClick={() => setPanel(null)}>
              ×
            </button>
          </header>

          <div className="aq-settings">
            <div className="aq-settings__row">
              <span>Sound effects</span>
              <button
                type="button"
                className="aq-toggle aq-toggle--switch"
                role="switch"
                aria-checked={state.settings.sound}
                onClick={() => {
                  dispatch({
                    type: "setSettings",
                    patch: { sound: !state.settings.sound },
                  });
                  play("coin");
                }}
              >
                <span>{state.settings.sound ? "On" : "Off"}</span>
                <span className="aq-toggle__track" data-on={state.settings.sound ? "true" : "false"} aria-hidden="true">
                  <span className="aq-toggle__thumb" />
                </span>
              </button>
            </div>

            <div className="aq-settings__row">
              <span>Night water</span>
              <button
                type="button"
                className="aq-toggle"
                role="switch"
                aria-checked={state.isNight}
                onClick={() => dispatch({ type: "toggleNight" })}
              >
                {state.isNight ? "Night" : "Day"}
              </button>
            </div>

            <div className="aq-settings__plaque">
              <label htmlFor="aq-plaque">Plaque text · 40 chars</label>
              <input
                id="aq-plaque"
                value={plaqueText}
                maxLength={40}
                onChange={(event) => setPlaqueText(event.target.value)}
                placeholder="Name this tank"
              />
              <div className="aq-settings__plaque-row">
                <select
                  aria-label="Plaque font"
                  value={state.plaque?.font ?? "display"}
                  onChange={(event) =>
                    dispatch({
                      type: "setPlaque",
                      plaque: {
                        text: plaqueText,
                        font: event.target.value as "display" | "sans" | "mono",
                        color: state.plaque?.color ?? "#e9b96e",
                      },
                    })
                  }
                >
                  <option value="display">Display</option>
                  <option value="sans">Sans</option>
                  <option value="mono">Mono</option>
                </select>
                <select
                  aria-label="Plaque colour"
                  value={state.plaque?.color ?? "#e9b96e"}
                  onChange={(event) =>
                    dispatch({
                      type: "setPlaque",
                      plaque: {
                        text: plaqueText,
                        font: state.plaque?.font ?? "display",
                        color: event.target.value,
                      },
                    })
                  }
                >
                  <option value="#e9b96e">Brass</option>
                  <option value="#f7ecd8">Cream</option>
                  <option value="#e88b7a">Coral</option>
                  <option value="#9fd8cf">Jade</option>
                </select>
                <button
                  type="button"
                  className="aq-mini"
                  onClick={() => {
                    dispatch({
                      type: "setPlaque",
                      plaque: {
                        text: plaqueText,
                        font: state.plaque?.font ?? "display",
                        color: state.plaque?.color ?? "#e9b96e",
                      },
                    });
                    notify("Plaque set");
                  }}
                >
                  Set plaque
                </button>
              </div>
            </div>

            <button
              type="button"
              className="aq-danger"
              onClick={() => {
                if (window.confirm("Reset all aquarium progress? This cannot be undone.")) {
                  resetProgress();
                  setPanel(null);
                }
              }}
            >
              Reset progress
            </button>
            <p className="aq-panel__note">
              Progress is saved in this browser only. Version {state.version}.
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}

function ShopCard({
  name,
  blurb,
  price,
  rarity,
  preview,
  meta,
  status,
  disabled,
  actionLabel = "Buy",
  onBuy,
}: {
  name: string;
  blurb: string;
  price: number;
  rarity?: FishDef["rarity"];
  preview: ReactNode;
  meta?: string;
  status?: string;
  disabled?: boolean;
  actionLabel?: string;
  onBuy: () => void;
}) {
  return (
    <article
      className="aq-card"
      data-rarity={rarity ?? "none"}
      style={
        rarity
          ? ({
              "--rarity": BALANCE.rarity[rarity].color,
            } as CSSProperties)
          : undefined
      }
    >
      <div className="aq-card__preview">{preview}</div>
      <div className="aq-card__copy">
        <div className="aq-card__title">
          <h3>{name}</h3>
          {rarity ? <span>{BALANCE.rarity[rarity].label}</span> : null}
        </div>
        <p>{blurb}</p>
        {meta ? <span className="aq-card__meta">{meta}</span> : null}
      </div>
      <div className="aq-card__buy">
        {price > 0 ? <span className="aq-card__price">{fmtCoins(price)}</span> : <span className="aq-card__price">Free</span>}
        <button type="button" className="aq-card__btn" disabled={disabled} onClick={onBuy}>
          {status ?? actionLabel}
        </button>
      </div>
    </article>
  );
}

function QuestRow({
  quest,
  value,
  claimed,
  onClaim,
}: {
  quest: QuestDef;
  value: number;
  claimed: boolean;
  onClaim: () => void;
}) {
  const done = value >= quest.target;
  return (
    <div className="aq-quest" data-done={done ? "true" : "false"}>
      <div>
        <strong>{quest.label}</strong>
        <span>
          {Math.min(value, quest.target)}/{quest.target} · +{quest.reward} coins
        </span>
      </div>
      <button type="button" className="aq-card__btn" disabled={!done || claimed} onClick={onClaim}>
        {claimed ? "Claimed" : done ? "Claim" : "Locked"}
      </button>
    </div>
  );
}

/** Tiny timer helper that clears on unmount without leaking a timeout. */
function useRefSafe() {
  const timers = useMemo(() => new Set<number>(), []);
  useEffect(() => {
    return () => {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
    };
  }, [timers]);
  return (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };
}
