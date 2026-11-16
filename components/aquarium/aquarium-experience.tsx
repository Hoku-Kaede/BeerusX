"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  DEFAULT_SETTINGS,
  KOI_SOURCES,
  SLIDERS,
  type PondSettings,
  type SliderKey,
} from "./koi-config";
import { KoiPond, type KoiPondHandle } from "./koi-pond";
import { SplashScreen } from "@/components/splash-screen";
import { BlurText, GradientText, SplitText, FadeContent, AnimatedContent, CountUp } from "@/components/reactbits";
import { GameProvider, useGame } from "./game/GameContext";
import { GameHud } from "./game/hud";
import { DecorateOverlay } from "./game/DecorateOverlay";
import { buildRoster, environmentOf } from "./game/economy";
import type { Rarity } from "./game/types";

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return prefersReduced;
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M8 13.25V3.15M3.9 7.65 8 3.55l4.1 4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScatterIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="1.35" fill="currentColor" />
      <circle cx="3.25" cy="4.4" r="1" fill="currentColor" opacity="0.82" />
      <circle cx="12.6" cy="4.9" r="0.9" fill="currentColor" opacity="0.72" />
      <circle cx="12.2" cy="12.25" r="0.8" fill="currentColor" opacity="0.62" />
      <circle cx="4.1" cy="11.9" r="0.7" fill="currentColor" opacity="0.52" />
    </svg>
  );
}

function RippleIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle
        cx="8"
        cy="8"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.8"
      />
      <circle
        cx="8"
        cy="8"
        r="6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

function RigIcon() {
  return (
    <svg viewBox="0 0 18 16" aria-hidden="true" focusable="false">
      <path
        d="M2.6 11.4c2.4-3.8 5.2-5.4 8.1-5.5 2.1 0 3.5.6 4.7 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="2.6" cy="11.4" r="1.35" fill="currentColor" />
      <circle cx="6.4" cy="7.9" r="1.1" fill="currentColor" opacity="0.9" />
      <circle cx="10.7" cy="5.9" r="1.1" fill="currentColor" opacity="0.9" />
      <circle cx="15.4" cy="7.9" r="1.35" fill="currentColor" />
    </svg>
  );
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {playing ? (
        <>
          <rect x="4.2" y="3.4" width="2.5" height="9.2" rx="0.8" fill="currentColor" />
          <rect x="9.3" y="3.4" width="2.5" height="9.2" rx="0.8" fill="currentColor" />
        </>
      ) : (
        <path d="M5.1 3.2 12.4 8l-7.3 4.8V3.2Z" fill="currentColor" />
      )}
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M2 4.3h7.2M12.2 4.3H14M2 11.7h1.9M6.9 11.7H14M2 8h4.1M9.1 8H14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <circle cx="10.7" cy="4.3" r="1.45" fill="currentColor" />
      <circle cx="5.4" cy="11.7" r="1.45" fill="currentColor" />
      <circle cx="7.6" cy="8" r="1.45" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="m4 4 8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AquariumExperience() {
  return (
    <GameProvider>
      <AquariumInner />
    </GameProvider>
  );
}

function AquariumInner() {
  const game = useGame();
  const [splashDone, setSplashDone] = useState(false);
  const [decorate, setDecorate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const pondRef = useRef<KoiPondHandle | null>(null);
  const revealRefs = useRef<HTMLElement[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const controlsButtonRef = useRef<HTMLButtonElement | null>(null);

  const [motionEnabled, setMotionEnabled] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"feed" | "ripple">("ripple");
  const [settings, setSettings] = useState<PondSettings>({
    ...DEFAULT_SETTINGS,
  });
  const reducedMotion = usePrefersReducedMotion();

  const rosterKey = game.state.fish
    .map((fish) => `${fish.instanceId}:${fish.itemId}`)
    .join("|");
  const roster = useMemo(
    () => buildRoster(game.state),
    // The signature is the identity: hunger ticks must not rebuild the school.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rosterKey],
  );
  const environment = useMemo(
    () => ({
      ...environmentOf(game.state),
      calm: decorate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      game.state.placedPlants,
      game.state.placedDecor,
      game.state.plaque,
      game.state.waterTint,
      game.state.activeLightId,
      game.state.isNight,
      decorate,
    ],
  );

  const ensureMotion = () => {
    if (!motionEnabled) setMotionEnabled(true);
  };

  const scatter = (origin?: HTMLElement) => {
    ensureMotion();
    pondRef.current?.scatter(origin);
  };

  const ripple = (origin?: HTMLElement) => {
    ensureMotion();
    pondRef.current?.ripple(origin);
  };

  const feed = () => {
    ensureMotion();
    pondRef.current?.feed();
  };

  const toggleMode = () => {
    const next = interactionMode === "feed" ? "ripple" : "feed";
    setInteractionMode(next);
    pondRef.current?.setInteractionMode(next);
  };

  const quickFeed = () => {
    ensureMotion();
    if (!game.feed()) return;
    setInteractionMode("feed");
    pondRef.current?.setInteractionMode("feed");
    pondRef.current?.feedScatterCluster();
  };

  const toggleDecorate = () => {
    ensureMotion();
    setDecorate((current) => {
      const next = !current;
      if (!next) setSelectedItem(null);
      return next;
    });
  };

  const handleFeedEvents = (
    events: readonly { x: number; y: number; rarity: Rarity }[],
  ) => {
    for (const event of events) {
      game.eat(1, event.x, event.y, event.rarity);
    }
  };

  const updateSetting = (key: SliderKey, value: number) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const toggleOverlay = () => {
    setSettings((current) => ({ ...current, overlay: !current.overlay }));
  };

  const reset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    pondRef.current?.replay();
  };

  const closeControls = () => {
    setControlsOpen(false);
    controlsButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!controlsOpen) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeControls();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [controlsOpen]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    const els = document.querySelectorAll(".aq-reveal");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const attract = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    pondRef.current?.attractTo(event.currentTarget);
  };

  const hint = !motionEnabled
    ? "Motion paused · press Play to stir the water"
    : reducedMotion
      ? "Motion slowed for your device · tap still sends a ring"
      : "Move to part the water · tap to feed the koi · drag to draw a current";

  return (
    <>
      {!splashDone && (
        <div className="aq-splash-overlay">
          <SplashScreen onDone={() => setSplashDone(true)} />
        </div>
      )}
      <div className="aq-page">
      <a className="aq-skip" href="#pond">
        Skip to the field note
      </a>

      <main id="content">
        <section
          ref={heroRef}
          className="aq-hero"
          data-motion={motionEnabled ? "on" : "off"}
          aria-labelledby="aq-title"
        >
          <div className="aq-water" aria-hidden="true" />

          <header className="aq-nav">
            <Link
              className="aq-brand"
              href="/aquarium"
              aria-label="KYOKO — an interactive aquarium study"
            >
              <span className="aq-brand__mark">KYOKO</span>
              <span className="aq-brand__rule" aria-hidden="true" />
              <span className="aq-brand__sub">Aquarium</span>
            </Link>

            <p className="aq-edition">
              <span>An interactive study</span>
              <span className="aq-edition__no">No. 01</span>
            </p>

            <div className="aq-nav__actions">
              <button
                type="button"
                className="aq-mode"
                data-aq-control
                aria-pressed={interactionMode === "feed"}
                onClick={toggleMode}
              >
                {interactionMode === "feed" ? "Feed mode" : "Ripple mode"}
              </button>
              <button
                type="button"
                className="aq-mode aq-mode--quick"
                data-aq-control
                onClick={quickFeed}
              >
                Drop feed
              </button>
            </div>
          </header>

          <div className="aq-headline">


            <h1
              className="aq-title"
              id="aq-title"
              ref={titleRef}
            >
              <span className="sr-only">KYOKO — a living koi pond</span>
              <span className="aq-title__reveal" aria-hidden="true">
                <img
                  src="/aquarium/title-kyoko.webp"
                  alt=""
                  width={3033}
                  height={711}
                  fetchPriority="high"
                  decoding="async"
                  draggable={false}
                />
              </span>
            </h1>
          </div>

          <KoiPond
            ref={pondRef}
            rootRef={heroRef}
            titleRef={titleRef}
            motionEnabled={motionEnabled}
            reducedMotion={reducedMotion}
            settings={settings}
            roster={roster}
            environment={environment}
            onFeed={handleFeedEvents}
            onFeedAttempt={() => game.feed()}
          />
          <GameHud decorate={decorate} onToggleDecorate={toggleDecorate} />
          <DecorateOverlay
            active={decorate}
            selectedId={selectedItem}
            onSelect={setSelectedItem}
            onExit={() => {
              setDecorate(false);
              setSelectedItem(null);
            }}
          />
          <div className="aq-bottom">
            <div className="aq-bottom__row">
              <div className="aq-copy">
                <p className="aq-lede">
                  <strong>{roster.length} koi, one current.</strong>{" "}
                  <BlurText text="Move through the water and they part. Tap the surface and the koi gather for a moment; then the current carries them home." />
                </p>

                <div className="aq-actions">
                  <button
                    type="button"
                    className="aq-btn aq-btn--ghost"
                    data-aq-control
                    onClick={() => scatter()}
                    onPointerEnter={attract}
                  >
                    <span>Scatter the koi</span>
                    <span className="aq-btn__icon">
                      <ScatterIcon />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="aq-btn aq-btn--ghost"
                    data-aq-control
                    onClick={quickFeed}
                  >
                    <span>Feed the koi</span>
                    <span className="aq-btn__icon">
                      <RippleIcon />
                    </span>
                  </button>
                </div>
              </div>

              <div className="aq-bottom__aside">
                <p className="aq-hint" aria-live="polite">
                  {interactionMode === "feed"
                    ? "Feed mode: hover to lure, click to drop 3 pellets, drag to trail"
                    : hint}
                </p>
                <p className="aq-live">
                  <span className="aq-live__dot" aria-hidden="true" />
                  20 bones per koi · live rig
                </p>
              </div>
            </div>
          </div>

          {controlsOpen ? (
            <div
              ref={panelRef}
              id="aq-controls"
              className="aq-panel"
              role="region"
              aria-label="Water controls"
              tabIndex={-1}
            >
              <div className="aq-panel__head">
                <div>
                  <p className="aq-panel__eyebrow">Live simulation</p>
                  <h2 className="aq-panel__title">Water controls</h2>
                </div>
                <div className="aq-panel__head-actions">
                  <button
                    type="button"
                    className="aq-panel__reset"
                    data-aq-control
                    onClick={reset}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="aq-panel__close"
                    data-aq-control
                    aria-label="Close water controls"
                    onClick={closeControls}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className="aq-panel__switches">
                <button
                  type="button"
                  className="aq-toggle"
                  data-aq-control
                  aria-pressed={motionEnabled}
                  onClick={() => setMotionEnabled((current) => !current)}
                >
                  <PlayPauseIcon playing={motionEnabled} />
                  <span>{motionEnabled ? "Pause" : "Play"}</span>
                </button>

                <button
                  type="button"
                  className="aq-toggle aq-toggle--switch"
                  data-aq-control
                  role="switch"
                  aria-checked={settings.overlay}
                  onClick={toggleOverlay}
                >
                  <RigIcon />
                  <span>20-bone rig</span>
                  <span
                    className="aq-toggle__track"
                    data-on={settings.overlay ? "true" : "false"}
                    aria-hidden="true"
                  >
                    <span className="aq-toggle__thumb" />
                  </span>
                </button>
              </div>

              <div className="aq-panel__actions">
                <button
                  type="button"
                  className="aq-mini"
                  data-aq-control
                  onClick={() => ripple()}
                >
                  <RippleIcon />
                  <span>Ripple burst</span>
                </button>
                <button
                  type="button"
                  className="aq-mini"
                  data-aq-control
                  onClick={() => scatter()}
                >
                  <ScatterIcon />
                  <span>Scatter koi</span>
                </button>
              </div>

              <div className="aq-panel__sliders">
                {SLIDERS.map((slider) => {
                  const value = settings[slider.key];
                  const percent =
                    ((value - slider.min) / (slider.max - slider.min)) * 100;
                  const id = `aq-slider-${slider.key}`;
                  return (
                    <div className="aq-slider" key={slider.key}>
                      <div className="aq-slider__head">
                        <label htmlFor={id}>{slider.label}</label>
                        <output htmlFor={id}>{slider.format(value)}</output>
                      </div>
                      <input
                        id={id}
                        className="aq-range"
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={value}
                        aria-valuetext={slider.format(value)}
                        style={
                          {
                            "--aq-fill": `${percent.toFixed(1)}%`,
                          } as CSSProperties
                        }
                        onChange={(event) =>
                          updateSetting(slider.key, Number(event.target.value))
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <p className="aq-panel__note">
                Click the water to feed the koi. Drag to draw a current. Every
                slider changes the live rig.
              </p>
            </div>
          ) : null}
        </section>

      </main>
    </div>
    </>
  );
}
