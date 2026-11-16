"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefObject,
} from "react";
import {
  KOI_SOURCES,
  POND,
  TITLE,
  clamp,
  lerp,
  type PondSettings,
} from "./koi-config";
import { KoiRenderer, type TitleRect } from "./koi-renderer";
import {
  KoiSchool,
  type FeedEvent,
  type FishRosterEntry,
  type SimPointer,
  type SimRig,
} from "./koi-sim";
import { buildKoiRig, type KoiRig } from "./koi-rig";
import { PlantManager } from "./game/plants";
import { drawDecor } from "./game/decor-renderer";
import type { AquariumEnvironment } from "./game/types";

export type KoiPondHandle = {
  replay: () => void;
  ripple: (origin?: HTMLElement) => void;
  feed: (origin?: HTMLElement) => void;
  scatter: (origin?: HTMLElement) => void;
  attractTo: (element: HTMLElement) => void;
  setInteractionMode: (mode: "feed" | "ripple") => void;
  getInteractionMode: () => "feed" | "ripple";
  feedScatterCluster: () => void;
  applySceneState: () => void;
};

export type { FeedEvent, FishRosterEntry };

type KoiPondProps = {
  rootRef: RefObject<HTMLElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  motionEnabled: boolean;
  reducedMotion: boolean;
  settings: PondSettings;
  roster?: readonly FishRosterEntry[];
  environment?: AquariumEnvironment;
  onFeed?: (events: readonly FeedEvent[]) => void;
  onFeedAttempt?: () => boolean;
};

type EngineOptions = {
  canvas: HTMLCanvasElement;
  root: HTMLElement;
  titleRef: RefObject<HTMLHeadingElement | null>;
  getMotionEnabled: () => boolean;
  getReducedMotion: () => boolean;
  getSettings: () => PondSettings;
  getRoster: () => readonly FishRosterEntry[];
  getEnvironment: () => AquariumEnvironment;
  onFeed: (events: readonly FeedEvent[]) => void;
  onFeedAttempt: () => boolean;
};

type DecodedImage = {
  image: ImageBitmap | HTMLImageElement;
  release: () => void;
};

const FIXED_STEP = 1 / 60;

const defaultEnvironment: AquariumEnvironment = {
  plants: [],
  decor: [],
  plaque: null,
  waterRgb: [0.585, 0.03, 0.027],
  waterCustomMix: 0,
  lightKind: 0,
  lightColor: [1, 0.72, 0.42],
  lightIntensity: 1,
  nightFactor: 0,
  calm: false,
};

async function loadImage(src: string): Promise<DecodedImage> {
  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${src} (${response.status})`);
  }
  const blob = await response.blob();

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    return {
      image: bitmap,
      release: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.decoding = "async";
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(`Could not decode ${src}`));
      element.src = url;
    });
    return {
      image,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function createEngine({
  canvas,
  root,
  titleRef,
  getMotionEnabled,
  getReducedMotion,
  getSettings,
  getRoster,
  getEnvironment,
  onFeed,
  onFeedAttempt,
}: EngineOptions) {
  let renderer: KoiRenderer;
  try {
    renderer = new KoiRenderer(canvas);
  } catch (error) {
    console.error("[aquarium] WebGL2 could not start", error);
    root.dataset.aqState = "fallback";
    return null;
  }

  let school: KoiSchool | null = null;
  let ready = false;
  let destroyed = false;
  let failed = false;
  let running = false;
  let visible = true;
  let raf = 0;
  let rigs: SimRig[] = [];
  let lastFrame = 0;
  let waveAccumulator = 0;
  let fpsFrames = 0;
  let fpsWindowStart = 0;

  let width = Math.max(1, root.clientWidth || window.innerWidth);
  let height = Math.max(1, root.clientHeight || window.innerHeight);
  let scrollOffset = 0;
  let heroTop = 0;
  let lastRippleX = -1;
  let lastRippleY = -1;
  let lastFeedDisturbAt = 0;
  let lastFeedTrailAt = 0;
  let pointerDown = false;
  let interactionMode: "feed" | "ripple" = "ripple";
  const pointer: SimPointer = { x: 0, y: 0, active: false };
  const plants = new PlantManager();
  let decorCanvas: HTMLCanvasElement | null = null;
  let decorContext: CanvasRenderingContext2D | null = null;
  let decorKey = "";
  let decorDirty = true;
  let lastNight = -1;
  let lastLanternDraw = 0;
  let plantKey = "";
  let rosterKey = "";
  let calm = false;
  let waterRgb: readonly [number, number, number] = [0.585, 0.03, 0.027];
  let waterMix = 0;
  let lightKind = 0;
  let lightColor: readonly [number, number, number] = [1, 0.72, 0.42];
  let lightIntensity = 1;
  let nightFactor = 0;
  const registered = new Map<
    number,
    { source: number; rig: KoiRig; image: ImageBitmap | HTMLImageElement }
  >();
  const keepAlive = new Map<number, ImageBitmap | HTMLImageElement>();

  root.dataset.aqState = "loading";

  function measureTitle(): TitleRect | null {
    const element = titleRef.current;
    if (!element) return null;
    const rootRect = root.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;
    return {
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * Scroll distance through the hero, in CSS pixels. It is clamped to one
   * stage height and softened when the reader prefers reduced motion.
   */
  function readScroll() {
    const raw = Math.max(0, window.scrollY - heroTop);
    const travel = Math.min(raw, height);
    scrollOffset = travel * (getReducedMotion() ? 0.32 : 1);
    return scrollOffset;
  }

  function isInteractive(target: EventTarget | null) {
    return Boolean(
      (target as Element | null)?.closest(
        "a, button, input, select, textarea, label, [data-aq-control]",
      ),
    );
  }

  function drawEnvironment(elapsed: number) {
    const env = getEnvironment();
    const key = JSON.stringify({
      plants: env.plants,
      decor: env.decor,
      plaque: env.plaque,
    });
    if (key !== decorKey) {
      decorKey = key;
      decorDirty = true;
    }
    if (env.plants.length && key !== plantKey) {
      plantKey = key;
      plants.sync(env.plants, width, height);
    } else if (!env.plants.length && plants.count) {
      plantKey = key;
      plants.sync([], width, height);
    }

    const targetNight = env.nightFactor;
    if (Math.abs(targetNight - lastNight) > 0.002) {
      lastNight = targetNight;
      nightFactor = targetNight;
      decorDirty = true;
    }

    const hasLantern = env.decor.some((item) => item.kind === "stone_lantern");
    if (hasLantern && elapsed - lastLanternDraw > 0.08) {
      lastLanternDraw = elapsed;
      decorDirty = true;
    }

    waterRgb = env.waterRgb;
    waterMix = env.waterCustomMix;
    lightKind = env.lightKind;
    lightColor = env.lightColor;
    lightIntensity = env.lightIntensity;
    calm = env.calm;
    school?.setCalmMode(calm);

    renderer.setWaterState(
      waterRgb,
      waterMix,
      nightFactor,
      lightColor,
      lightIntensity,
      lightKind,
    );

    if (decorDirty) {
      decorDirty = false;
      if (!decorCanvas) {
        decorCanvas = document.createElement("canvas");
        decorContext = decorCanvas.getContext("2d");
      }
      if (decorCanvas && decorContext) {
        const dpr = Math.min(
          window.devicePixelRatio || 1,
          width < 720 ? 1.35 : 1.6,
        );
        decorCanvas.width = Math.max(1, Math.round(width * dpr));
        decorCanvas.height = Math.max(1, Math.round(height * dpr));
        decorContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawDecor(decorContext, {
          width,
          height,
          nightFactor,
          elapsed,
          decor: env.decor,
          plaque: env.plaque,
        });
        renderer.setDecorCanvas(decorCanvas);
      }
    }
  }

  function redraw() {
    if (!ready || destroyed || !school) return;
    const settings = getSettings();
    drawEnvironment(school.clock);
    plants.buildGeometry("floor", school.clock);
    plants.buildGeometry("surface", school.clock);
    renderer.setPlantGeometry(plants.floorGeometry, plants.surfaceGeometry);
    renderer.render(
      school.renderFish(),
      school.clock,
      settings.refraction,
      settings.overlay,
      readScroll(),
      school.getRenderParticles(),
    );
  }

  function advance(dt: number, drawFrame = true) {
    if (!ready || destroyed || !school) return;
    const settings = getSettings();
    school.step(dt, settings, {
      reducedMotion: getReducedMotion(),
      pointer,
      interactionMode,
      feedCursor: school.feedCursor,
    });

    const events = school.consumeFeedEvents();
    if (events.length) onFeed(events);

    const env = getEnvironment();
    plants.update(dt, school.clock, school.getPlantInteractors(), {
      x: pointer.x,
      y: pointer.y,
      active: pointer.active && env.calm,
    });

    waveAccumulator += dt;
    const damping = lerp(
      POND.wave.dampingMax,
      POND.wave.dampingMin,
      settings.waterDamping,
    );
    let steps = 0;
    while (waveAccumulator >= FIXED_STEP && steps < 2) {
      const impulses = steps === 0 ? school.consumeImpulses() : [];
      renderer.stepWaves(damping, POND.wave.speed, impulses);
      waveAccumulator -= FIXED_STEP;
      steps += 1;
    }
    if (steps === 2 && waveAccumulator > FIXED_STEP * 2) {
      waveAccumulator = FIXED_STEP;
    }

    if (drawFrame) {
      drawEnvironment(school.clock);
      plants.buildGeometry("floor", school.clock);
      plants.buildGeometry("surface", school.clock);
      renderer.setPlantGeometry(plants.floorGeometry, plants.surfaceGeometry);
      renderer.render(
        school.renderFish(),
        school.clock,
        settings.refraction,
        settings.overlay,
        readScroll(),
        school.getRenderParticles(),
      );
    }
  }

  function frame(now: number) {
    if (!running || destroyed) return;
    const delta = lastFrame
      ? Math.min((now - lastFrame) / 1000, 1 / 24)
      : FIXED_STEP;
    lastFrame = now;
    advance(delta);
    fpsFrames += 1;
    if (now - fpsWindowStart >= 500) {
      fpsFrames = 0;
      fpsWindowStart = now;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || destroyed || !ready || failed) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = 0;
  }

  function sync() {
    if (
      !ready ||
      destroyed ||
      failed ||
      !getMotionEnabled() ||
      !visible ||
      document.hidden
    ) {
      stop();
      return;
    }
    start();
  }

  function resize() {
    if (destroyed) return;
    const rect = root.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    heroTop = rect.top + window.scrollY;
    renderer.setTitleRect(measureTitle());
    try {
      renderer.setSize(width, height);
      school?.setSize(width, height);
      plants.resize(width, height, getEnvironment().plants ?? []);
      decorDirty = true;
      redraw();
    } catch (error) {
      console.error("[aquarium] Could not resize the pond", error);
      failed = true;
      stop();
      root.dataset.aqState = "fallback";
    }
  }

  function pointFromEvent(event: PointerEvent) {
    const rect = root.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function pointFromElement(element: HTMLElement) {
    const rootRect = root.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left - rootRect.left + rect.width * 0.5,
      y: rect.top - rootRect.top + rect.height * 0.5,
    };
  }

  function onPointerMove(event: PointerEvent) {
    if (isInteractive(event.target)) {
      pointer.active = false;
      if (school) school.setFeedCursor(0, 0, false);
      return;
    }

    const point = pointFromEvent(event);
    pointer.x = point.x;
    pointer.y = point.y;
    const inside = point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;

    if (interactionMode === "feed" && school) {
      pointer.active = false;
      if (inside) {
        school.setFeedCursor(point.x, point.y, true);
        const now = performance.now();
        if (!pointerDown && now - lastFeedDisturbAt > 56) {
          school.queueImpulse(point.x / width, point.y / height, 14, 0.09);
          lastFeedDisturbAt = now;
        }
        if (pointerDown && now - lastFeedTrailAt > 85) {
          school.trailPelletAt(point.x, point.y);
          lastFeedTrailAt = now;
          if (!running) redraw();
        }
      } else {
        school.setFeedCursor(0, 0, false);
      }
      return;
    }

    pointer.active = inside && event.pointerType !== "touch";
    if (school) school.setFeedCursor(0, 0, false);

    if (
      event.buttons === 1 &&
      ready &&
      !destroyed &&
      !getReducedMotion() &&
      school
    ) {
      const distance = Math.hypot(point.x - lastRippleX, point.y - lastRippleY);
      if (lastRippleX < 0 || distance > Math.min(width, height) * 0.045) {
        school.scatterAt(point.x, point.y);
        lastRippleX = point.x;
        lastRippleY = point.y;
        if (!running) redraw();
      }
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || isInteractive(event.target) || !school) return;
    const point = pointFromEvent(event);
    pointerDown = true;

    if (interactionMode === "feed") {
      if (!onFeedAttempt()) return;
      school.setFeedCursor(point.x, point.y, true);
      school.dropPelletsAt(point.x, point.y, 3);
      school.queueImpulse(point.x / width, point.y / height, 18, 0.28);
      lastFeedTrailAt = performance.now();
      if (!running) redraw();
      return;
    }

    lastRippleX = point.x;
    lastRippleY = point.y;
    school.scatterAt(point.x, point.y);
    if (!running) redraw();
  }

  function onPointerUp() {
    pointerDown = false;
    lastRippleX = -1;
    lastRippleY = -1;
  }

  function onPointerLeave() {
    pointer.active = false;
    pointerDown = false;
    lastRippleX = -1;
    lastRippleY = -1;
    if (school) school.setFeedCursor(0, 0, false);
  }

  function onVisibilityChange() {
    sync();
  }

  function onScroll() {
    readScroll();
    if (!running) redraw();
  }

  function handleContextRestored() {
    if (destroyed) return;
    try {
      renderer.setSize(width, height);
    } catch (error) {
      console.error("[aquarium] Could not rebuild after context restore", error);
    }
    for (const entry of registered.values()) {
      try {
        renderer.registerSource(entry.source, entry.rig, entry.image);
      } catch (error) {
        console.error("[aquarium] Could not re-upload a Figma koi", error);
      }
    }
    if (rigs.length) {
      try {
        school = new KoiSchool(rigs, width, height, getRoster());
        rosterKey = getRoster().map((fish) => fish.id).join("|");
      } catch (error) {
        console.error("[aquarium] Could not rebuild the school", error);
      }
    }
    renderer.clearWaves();
    ready = true;
    redraw();
    sync();
  }

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(root);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      sync();
    },
    { rootMargin: "120px", threshold: 0.01 },
  );
  intersectionObserver.observe(root);

  root.addEventListener("pointermove", onPointerMove, { passive: true });
  root.addEventListener("pointerdown", onPointerDown, { passive: true });
  root.addEventListener("pointerup", onPointerUp, { passive: true });
  root.addEventListener("pointercancel", onPointerUp, { passive: true });
  root.addEventListener("pointerleave", onPointerLeave, { passive: true });
  canvas.addEventListener("contextrestored", handleContextRestored, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("scroll", onScroll, { passive: true });

  async function startup() {
    try {
      const settled = await Promise.allSettled(
        KOI_SOURCES.map(async (source, index) => {
          const decoded = await loadImage(source.src);
          try {
            const rig = buildKoiRig(decoded.image, source);
            return { index, decoded, rig };
          } catch (error) {
            decoded.release();
            throw error;
          }
        }),
      );

      if (destroyed) {
        for (const result of settled) {
          if (result.status === "fulfilled") result.value.decoded.release();
        }
        return;
      }

      const rigs: SimRig[] = [];
      for (const result of settled) {
        if (result.status === "rejected") {
          console.error("[aquarium] Could not prepare a Figma koi", result.reason);
          continue;
        }
        const { index, decoded, rig } = result.value;
        try {
          renderer.registerSource(index, rig, decoded.image);
          registered.set(index, { source: index, rig, image: decoded.image });
          keepAlive.set(index, decoded.image);
          rigs.push({ source: index, rig });
        } catch (error) {
          console.error("[aquarium] Could not upload a Figma koi", error);
        } finally {
          if (!keepAlive.has(index)) decoded.release();
        }
      }

      if (!rigs.length) {
        failed = true;
        root.dataset.aqState = "fallback";
        return;
      }

      const rect = root.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      heroTop = rect.top + window.scrollY;
      const title = await loadImage(TITLE.src);
      try {
        renderer.registerTitle(title.image, TITLE.width, TITLE.height);
        renderer.setTitleRect(measureTitle());
      } finally {
        title.release();
      }
      renderer.setSize(width, height);
      school = new KoiSchool(rigs, width, height, getRoster());
      rosterKey = getRoster().map((fish) => fish.id).join("|");
      renderer.clearWaves();
      ready = true;
      redraw();
      root.dataset.aqState = "ready";
      canvas.style.opacity = "1";

      if (process.env.NODE_ENV !== "production") {
        const debug = {
          get ready() {
            return ready;
          },
          get clock() {
            return school?.clock ?? 0;
          },
          get running() {
            return running;
          },
          get visible() {
            return visible;
          },
          get fish() {
            return school?.debugFish ?? [];
          },
          get schoolFish() {
            return school?.fish ?? [];
          },
          get steerTrace() {
            return school?.steerTrace ?? null;
          },
          get flee() {
            const state = school as unknown as {
              fleeX: number;
              fleeY: number;
              fleeUntil: number;
              clock: number;
            } | null;
            return state
              ? {
                  x: Number(state.fleeX.toFixed(1)),
                  y: Number(state.fleeY.toFixed(1)),
                  until: Number(state.fleeUntil.toFixed(2)),
                  clock: Number(state.clock.toFixed(2)),
                  active: state.clock < state.fleeUntil,
                }
              : null;
          },
          get settings() {
            return { ...getSettings() };
          },
          get stats() {
            return renderer.stats;
          },
          get fps() {
            const frames = fpsFrames;
            const since = performance.now() - fpsWindowStart;
            const elapsed = Math.max(1, since) / 1000;
            return Number((frames / elapsed).toFixed(1));
          },
          get readback() {
            return renderer.readback();
          },
          get waves() {
            return renderer.readWaves();
          },
          get impulseTrace() {
            return renderer.impulseTrace.slice(-80);
          },
          get errors() {
            const gl = (renderer as unknown as { gl: WebGL2RenderingContext }).gl;
            const list: string[] = [];
            for (let index = 0; index < 24; index += 1) {
              const error = gl.getError();
              if (error === null || error === 0) break;
              list.push(`0x${error.toString(16)}`);
            }
            return list;
          },
          get pendingImpulses() {
            return school?.pendingImpulses ?? 0;
          },
          get titleRect() {
            const rect = measureTitle();
            return rect
              ? {
                  x: Number(rect.x.toFixed(1)),
                  y: Number(rect.y.toFixed(1)),
                  width: Number(rect.width.toFixed(1)),
                  height: Number(rect.height.toFixed(1)),
                }
              : null;
          },
          get scroll() {
            return Number(readScroll().toFixed(1));
          },
          advance(seconds: number) {
            const steps = Math.max(1, Math.min(900, Math.round(seconds * 60)));
            for (let index = 0; index < steps; index += 1) {
              advance(FIXED_STEP, false);
            }
            redraw();
            return {
              clock: Number((school?.clock ?? 0).toFixed(2)),
              fish: school?.fish.length ?? 0,
              pendingImpulses: school?.pendingImpulses ?? 0,
            };
          },
          rippleAt(x: number, y: number) {
            school?.rippleAt(x, y, 1.2);
            if (!running) redraw();
            return true;
          },
          tapAt(x: number, y: number) {
            school?.tapAt(x, y);
            if (!running) redraw();
            return true;
          },
          scatterAt(x: number, y: number) {
            school?.scatterAt(x, y);
            if (!running) redraw();
            return true;
          },
        };
        (window as typeof window & { __aqDebug?: unknown }).__aqDebug = debug;
      }

      sync();
    } catch (error) {
      console.error("[aquarium] Could not start the pond", error);
      failed = true;
      root.dataset.aqState = "fallback";
      stop();
    }
  }

  function replay() {
    if (!school || destroyed) return;
    school.reset();
    waveAccumulator = 0;
    renderer.clearWaves();
    redraw();
    sync();
  }

  function ripple(origin?: HTMLElement) {
    if (!school || destroyed) return;
    const point = origin
      ? pointFromElement(origin)
      : { x: width * 0.5, y: height * 0.42 };
    school.rippleAt(point.x, point.y, 1.15);
    if (!running) redraw();
    sync();
  }

  function scatter(origin?: HTMLElement) {
    if (!school || destroyed) return;
    const point = origin
      ? pointFromElement(origin)
      : { x: width * 0.5, y: height * 0.4 };
    school.scatterAt(point.x, point.y);
    if (!running) redraw();
    sync();
  }

  function setInteractionMode(mode: "feed" | "ripple") {
    interactionMode = mode;
    if (school) school.setInteractionMode(mode);
    if (mode !== "feed" && school) school.setFeedCursor(0, 0, false);
  }

  function applySceneState() {
    plantKey = "";
    decorKey = "";
    decorDirty = true;
    const roster = getRoster();
    const nextKey = roster.map((fish) => fish.id).join("|");
    if (school && nextKey !== rosterKey) {
      rosterKey = nextKey;
      school.setRoster(roster);
    }
    redraw();
    sync();
  }

  function getInteractionMode() {
    return interactionMode;
  }

  function feedScatterCluster() {
    if (!school || destroyed) return;
    setInteractionMode("feed");
    school.scatterFeedCluster(width * 0.5, height * 0.5, 5);
    if (!running) redraw();
    sync();
  }

  /**
   * The primary action. A button in the footer cannot feed the koi at its own
   * coordinates without dragging them under the copy, so the call is placed in
   * open water just below the title.
   */
  function feed() {
    if (!school || destroyed) return;
    school.tapAt(width * 0.52, height * 0.46);
    if (!running) redraw();
    sync();
  }

  function attractTo(element: HTMLElement) {
    if (!school || destroyed) return;
    const point = pointFromElement(element);
    school.attractTo(
      point.x,
      clamp(
        point.y - POND.attract.drop,
        52,
        height * (POND.fishFloor - 0.05),
      ),
    );
    sync();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("pointerup", onPointerUp);
    root.removeEventListener("pointercancel", onPointerUp);
    root.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("contextrestored", handleContextRestored);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("scroll", onScroll);
    renderer.destroy();
    school = null;
    ready = false;
    root.dataset.aqState = "off";
    canvas.style.opacity = "0";
    const debugWindow = window as typeof window & { __aqDebug?: unknown };
    if (debugWindow.__aqDebug) delete debugWindow.__aqDebug;
  }

  return {
    startup,
    sync,
    redraw,
    replay,
    ripple,
    feed,
    scatter,
    attractTo,
    setInteractionMode,
    getInteractionMode,
    feedScatterCluster,
    applySceneState,
    destroy,
  };
}

export const KoiPond = forwardRef<KoiPondHandle, KoiPondProps>(function KoiPond(
  {
    rootRef,
    titleRef,
    motionEnabled,
    reducedMotion,
    settings,
    roster,
    environment,
    onFeed,
    onFeedAttempt,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
  const motionRef = useRef(motionEnabled);
  const reducedRef = useRef(reducedMotion);
  const settingsRef = useRef(settings);
  const rosterRef = useRef<readonly FishRosterEntry[]>(roster ?? []);
  const environmentRef = useRef<AquariumEnvironment | undefined>(environment);
  const feedRef = useRef(onFeed);
  const feedAttemptRef = useRef(onFeedAttempt);

  useEffect(() => {
    motionRef.current = motionEnabled;
    engineRef.current?.sync();
  }, [motionEnabled]);

  useEffect(() => {
    reducedRef.current = reducedMotion;
    engineRef.current?.redraw();
    engineRef.current?.sync();
  }, [reducedMotion]);

  useEffect(() => {
    settingsRef.current = settings;
    engineRef.current?.redraw();
  }, [settings]);

  // Latest props are read through refs, so a re-render on every coin tick does
  // not rebuild the school or drop live pellets.
  rosterRef.current = roster ?? [];
  environmentRef.current = environment;
  feedRef.current = onFeed;
  feedAttemptRef.current = onFeedAttempt;

  useEffect(() => {
    engineRef.current?.applySceneState();
  }, [roster, environment]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const engine = createEngine({
      canvas,
      root,
      titleRef,
      getMotionEnabled: () => motionRef.current,
      getReducedMotion: () => reducedRef.current,
      getSettings: () => settingsRef.current,
      getRoster: () => rosterRef.current,
      getEnvironment: () => environmentRef.current ?? defaultEnvironment,
      onFeed: (events) => feedRef.current?.(events),
      onFeedAttempt: () => feedAttemptRef.current?.() ?? true,
    });
    if (!engine) {
      root.dataset.aqState = "fallback";
      return;
    }

    engineRef.current = engine;
    void engine.startup();

    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [rootRef, titleRef]);

  useImperativeHandle(
    ref,
    () => ({
      replay: () => engineRef.current?.replay(),
      ripple: (origin?: HTMLElement) => engineRef.current?.ripple(origin),
      feed: () => engineRef.current?.feed(),
      scatter: (origin?: HTMLElement) => engineRef.current?.scatter(origin),
      attractTo: (element: HTMLElement) =>
        engineRef.current?.attractTo(element),
      setInteractionMode: (mode: "feed" | "ripple") =>
        engineRef.current?.setInteractionMode(mode),
      getInteractionMode: () => engineRef.current?.getInteractionMode() ?? "ripple",
      feedScatterCluster: () => engineRef.current?.feedScatterCluster(),
      applySceneState: () => engineRef.current?.applySceneState(),
    }),
    [],
  );

  return (
    <div className="aq-pond" aria-hidden="true">
      <canvas ref={canvasRef} className="aq-pond__canvas" />
    </div>
  );
});

KoiPond.displayName = "KoiPond";
