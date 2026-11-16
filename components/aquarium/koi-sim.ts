import {
  BONE_COUNT,
  KOI_LANES,
  POND,
  clamp,
  lerp,
  sizeScale,
  type PondSettings,
} from "./koi-config";
import type { KoiRig } from "./koi-rig";
import type { RenderFish, WaveImpulse } from "./koi-renderer";

export type FishRosterEntry = {
  id: string;
  itemId: string;
  source: number;
  length: number;
  cruise: number;
  depth: number;
  tint: readonly [number, number, number];
  glow: number;
  tail: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  home?: readonly [number, number];
  heading?: number;
};

export type SimRig = {
  source: number;
  rig: KoiRig;
};

export type SimPointer = {
  x: number;
  y: number;
  active: boolean;
};

export type InteractionMode = "feed" | "ripple";

export type FeedCursor = {
  x: number;
  y: number;
  active: boolean;
};

export type Pellet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  age: number;
  bobPhase: number;
  eaten: boolean;
};

export type FeedEvent = {
  x: number;
  y: number;
  itemId: string;
  rarity: FishRosterEntry["rarity"];
};

export type ParticleEvent = {
  x: number;
  y: number;
  size: number;
  type: number;
  alpha: number;
  vx?: number;
  vy?: number;
  age?: number;
  life?: number;
  wobblePhase?: number;
  startSize?: number;
  endSize?: number;
  delay?: number;
};

export type SimOptions = {
  reducedMotion: boolean;
  pointer: SimPointer;
  interactionMode?: InteractionMode;
  feedCursor?: FeedCursor;
};

/**
 * The five intentions a koi drifts between. Adapted from Nagomi's swim-state
 * machine: most of the time the fish glides, but it regularly coasts with a
 * limp tail, hovers almost in place, snaps into a short burst, and pivots its
 * whole body around to a new course. The transitions are what stop the pond
 * reading as three sprites on fixed loops.
 */
export const SwimState = {
  Glide: 0,
  Coast: 1,
  Hover: 2,
  Burst: 3,
  Pivot: 4,
} as const;
export type SwimState = (typeof SwimState)[keyof typeof SwimState];

const STATE_NAMES = ["glide", "coast", "hover", "burst", "pivot"] as const;

export type SchoolFish = {
  id: string;
  itemId: string;
  rarity: FishRosterEntry["rarity"];
  tint: readonly [number, number, number];
  glow: number;
  tailFactor: number;
  homeX: number;
  homeY: number;
  homeHeading: number;
  lane: number;
  source: number;
  rig: KoiRig;
  x: number;
  y: number;
  heading: number;
  speed: number;
  angularVelocity: number;
  /** Committed turn side, used to escape the exactly-180° steering dead zone. */
  turnBias: number;
  cruise: number;
  maxSpeed: number;
  cruiseFactor: number;
  maxFactor: number;
  reactivity: number;
  length: number;
  worldScale: number;
  depth: number;
  /** The lane's resting depth: the centre the random walk hovers around. */
  baseDepth: number;
  depthTarget: number;
  depthAge: number;
  depthDuration: number;
  depthRate: number;
  alpha: number;
  phase: number;
  seed: number;
  state: SwimState;
  stateAge: number;
  stateDuration: number;
  pivotHeading: number;
  tailEffort: number;
  startle: number;
  entryAt: number;
  callDelay: number;
  respondedToCall: boolean;
  callResponseAge: number;
  orbitDirection: number;
  gulpAt: number;
  surfaceElevation: number;
  gulpTimer: number;
  eatCooldown: number;
  targetPelletId: number | null;
  feedingBoost: number;
  boneAngles: Float32Array;
  bonePos: Float32Array;
  tailTimer: number;
  rng: number;
};

type Call = {
  x: number;
  y: number;
  until: number;
  /** 0 — 1. A tap is a full-strength call; a hover lure is softer. */
  strength: number;
  /** Fish rise toward the surface when the call is food. */
  rise: boolean;
  /** Circle the point instead of stopping short of it. */
  gather: boolean;
};

const TAU = Math.PI * 2;

const shortestAngle = (from: number, to: number) => {
  let delta = (to - from + Math.PI) % TAU;
  if (delta < 0) delta += TAU;
  return delta - Math.PI;
};

const wrapAngle = (angle: number) =>
  (((angle + Math.PI) % TAU) + TAU) % TAU - Math.PI;

const smoothstep = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function bodyExtents(fish: SchoolFish) {
  const halfLength = fish.length * 0.55;
  const halfWidth = clamp(
    (fish.length / Math.max(1.2, fish.rig.aspect)) * 0.5,
    fish.length * 0.14,
    fish.length * 0.45,
  );
  const cos = Math.abs(Math.cos(fish.heading));
  const sin = Math.abs(Math.sin(fish.heading));
  return {
    x: halfLength * cos + halfWidth * sin + 14,
    y: halfLength * sin + halfWidth * cos + 14,
    halfWidth,
  };
}

function defaultRoster(): FishRosterEntry[] {
  return KOI_LANES.map((lane, index) => ({
    id: `resident-${index}`,
    itemId: index === 0 ? "kohaku" : index === 1 ? "sanke" : "showa",
    source: lane.source,
    length: lane.length,
    cruise: lane.cruise,
    depth: lane.depth,
    tint: [1, 1, 1] as const,
    glow: 0,
    tail: 1,
    rarity: (index === 0 ? "common" : index === 1 ? "uncommon" : "rare") as
      | "common"
      | "uncommon"
      | "rare",
    home: lane.home,
    heading: lane.heading,
  }));
}

export class KoiSchool {
  readonly fish: SchoolFish[] = [];
  clock = 0;
  startle = 0;
  /** Dev-only snapshot of each lane's last steering solve, for the debug harness. */
  steerTrace: (Record<string, number | boolean> | null)[] = [null, null, null];

  pellets: Pellet[] = [];
  particles: ParticleEvent[] = [];
  feedEvents: FeedEvent[] = [];
  interactionMode: InteractionMode = "ripple";
  feedCursor: FeedCursor = { x: 0, y: 0, active: false };
  calm = false;
  private nextPelletId = 1;

  private readonly rigs: readonly SimRig[];
  private readonly impulses: WaveImpulse[] = [];
  private readonly backboneAngles = new Float32Array(BONE_COUNT);
  private readonly waveAngles = new Float32Array(BONE_COUNT);
  private width = 1;
  private height = 1;
  private unit = 1;
  private reduced = false;
  private pointer: SimPointer = { x: 0, y: 0, active: false };
  private call: Call | null = null;
  private fleeX = 0;
  private fleeY = 0;
  private fleeUntil = -1;

  constructor(
    rigs: readonly SimRig[],
    width: number,
    height: number,
    roster?: readonly FishRosterEntry[],
  ) {
    this.rigs = rigs;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.unit = Math.min(this.width, this.height);
    const entries = roster ?? defaultRoster();
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const rig = rigs.find((candidate) => candidate.source === entry.source);
      if (!rig) continue;
      this.fish.push(this.createFish(index, rig.rig, entry));
    }
    this.reset();
  }

  private createFish(
    lane: number,
    rig: KoiRig,
    entry: FishRosterEntry,
  ): SchoolFish {
    const scale = sizeScale(this.width, this.height);
    const unit = this.unit;
    const seedRng =
      (0x9e3779b9 ^ Math.imul(lane + 1, 0x85ebca6b)) >>> 0;
    let rng = seedRng;
    const rand = () => {
      rng ^= rng << 13;
      rng >>>= 0;
      rng ^= rng >>> 17;
      rng ^= rng << 5;
      rng >>>= 0;
      return (rng & 0x00ffffff) / 0x01000000;
    };
    const heading =
      entry.heading ??
      (lane % 2 === 0 ? 0.42 : -1.18) + (rand() - 0.5) * 0.6;
    const initialState = (lane % 5) as SwimState;
    const cruiseFactor = 0.88 + rand() * 0.24;
    const maxFactor = 1.55 + rand() * 0.35;
    const cruise = entry.cruise * scale * unit * cruiseFactor;
    const depthDuration = lerp(
      POND.depth.stateMin,
      POND.depth.stateMax,
      rand(),
    );
    const initialStateSpec = this.stateSpec(initialState);
    const home = entry.home ?? [
      0.18 + ((lane * 0.27) % 0.64),
      0.24 + ((lane * 0.19) % 0.4),
    ];

    return {
      id: entry.id,
      itemId: entry.itemId,
      rarity: entry.rarity,
      tint: entry.tint,
      glow: entry.glow,
      tailFactor: entry.tail,
      homeX: home[0],
      homeY: home[1],
      homeHeading: heading,
      lane,
      source: entry.source,
      rig,
      x: home[0] * this.width,
      y: home[1] * this.height,
      heading,
      speed: cruise,
      angularVelocity: 0,
      turnBias: lane % 2 === 0 ? 1 : -1,
      cruise,
      maxSpeed: cruise * maxFactor,
      cruiseFactor,
      maxFactor,
      reactivity: 0.35 + rand() * 0.65,
      length: entry.length * scale * unit,
      worldScale: (entry.length * scale * unit) / Math.max(1e-6, rig.restLength),
      depth: entry.depth,
      baseDepth: entry.depth,
      depthTarget: entry.depth,
      depthAge: rand() * depthDuration,
      depthDuration,
      depthRate: 3 / lerp(POND.depth.transitionMin, POND.depth.transitionMax, rand()),
      alpha: 0,
      phase: rand() * TAU,
      seed: rand() * TAU,
      state: initialState,
      stateAge: 0,
      stateDuration: initialStateSpec.min + (initialStateSpec.max - initialStateSpec.min) * rand(),
      pivotHeading: heading,
      tailEffort: 0.6,
      startle: 0,
      entryAt: 0.12 + Math.min(lane, 8) * 0.14,
      callDelay: 0,
      respondedToCall: false,
      callResponseAge: 0,
      orbitDirection: rand() < 0.5 ? -1 : 1,
      gulpAt: 6 + rand() * 9,
      surfaceElevation: 0,
      gulpTimer: 0,
      eatCooldown: 0,
      targetPelletId: null,
      feedingBoost: 0,
      boneAngles: new Float32Array(BONE_COUNT),
      bonePos: new Float32Array(BONE_COUNT * 2),
      tailTimer: rand() * 0.1,
      rng: seedRng,
    };
  }

  setSize(width: number, height: number) {
    const nextWidth = Math.max(1, width);
    const nextHeight = Math.max(1, height);
    const sx = nextWidth / Math.max(1, this.width);
    const sy = nextHeight / Math.max(1, this.height);
    const oldUnit = Math.max(1, this.unit);
    const ratio = Math.min(nextWidth, nextHeight) / oldUnit;
    this.width = nextWidth;
    this.height = nextHeight;
    this.unit = Math.min(nextWidth, nextHeight);

    for (const fish of this.fish) {
      if (sx !== 1 || sy !== 1) {
        fish.x *= sx;
        fish.y *= sy;
      }
      fish.length *= ratio;
      fish.worldScale = fish.length / Math.max(1e-6, fish.rig.restLength);
      fish.cruise *= ratio;
      fish.maxSpeed *= ratio;
      const extents = bodyExtents(fish);
      const floor = Math.min(
        nextHeight - extents.y - 8,
        nextHeight * POND.fishFloor,
      );
      fish.x = clamp(fish.x, extents.x + 6, nextWidth - extents.x - 6);
      fish.y = clamp(fish.y, extents.y + 6, Math.max(extents.y + 6, floor));
    }
  }

  reset() {
    this.clock = 0;
    this.startle = 0;
    this.call = null;
    this.fleeUntil = -1;
    this.impulses.length = 0;
    this.pellets.length = 0;
    this.particles.length = 0;
    this.feedCursor.active = false;

    for (let index = 0; index < this.fish.length; index += 1) {
      const fish = this.fish[index];
      fish.rng = (0x9e3779b9 ^ Math.imul(fish.lane + 1, 0x85ebca6b)) >>> 0;
      fish.x = fish.homeX * this.width;
      fish.y = fish.homeY * this.height;
      fish.heading = fish.homeHeading;
      fish.speed = fish.cruise;
      fish.angularVelocity = 0;
      fish.turnBias = fish.lane % 2 === 0 ? 1 : -1;
      fish.alpha = 0;
      fish.startle = 0;
      fish.state = (fish.lane % 5) as SwimState;
      fish.stateAge = 0;
      fish.stateDuration = this.range(
        fish,
        this.stateSpec(fish.state).min,
        this.stateSpec(fish.state).max,
      );
      fish.pivotHeading = fish.heading;
      fish.tailEffort = 0.6;
      fish.phase = this.range(fish, 0, TAU);
      fish.seed = this.range(fish, 0, TAU);
      fish.orbitDirection = this.random(fish) < 0.5 ? -1 : 1;
      fish.entryAt = 0.12 + index * 0.14;
      fish.tailTimer = this.random(fish) * 0.1;
      fish.callDelay = 0;
      fish.respondedToCall = false;
      fish.callResponseAge = 0;
      fish.gulpAt = this.clock + this.range(fish, 6, 14);
      fish.surfaceElevation = 0;
      fish.gulpTimer = 0;
      fish.eatCooldown = 0;
      fish.targetPelletId = null;
      fish.feedingBoost = 0;
      fish.depth = this.range(fish, POND.depth.min, POND.depth.max);
      fish.depthTarget = fish.depth;
      fish.depthAge = this.range(fish, 0, POND.depth.stateMin);
      fish.depthDuration = this.range(fish, POND.depth.stateMin, POND.depth.stateMax);
      fish.depthRate =
        3 / this.range(fish, POND.depth.transitionMin, POND.depth.transitionMax);
      this.updateRig(fish, 1 / 60, {
        tailFrequency: 1,
        tailAmplitude: 1,
        swimSpeed: 1,
        waterDamping: 0.36,
        refraction: 1,
        overlay: false,
      });
    }
  }

  step(dt: number, settings: PondSettings, options: SimOptions) {
    if (dt <= 0) return;
    const step = Math.min(dt, 1 / 24);
    this.clock += step;
    this.reduced = options.reducedMotion;
    this.pointer = options.pointer;
    if (options.interactionMode) this.interactionMode = options.interactionMode;
    if (options.feedCursor) this.feedCursor = options.feedCursor;
    this.startle = Math.max(
      0,
      this.startle - step / POND.disturb.startleDecay,
    );

    if (this.call && this.call.until <= this.clock) {
      this.call = null;
    }

    this.updatePellets(step);
    this.updateParticles(step);

    for (const fish of this.fish) {
      fish.startle = Math.max(
        0,
        fish.startle - step / POND.disturb.startleDecay,
      );
      fish.alpha = smoothstep(
        (this.clock - fish.entryAt) / (this.reduced ? 1.8 : 1.15),
      );

      fish.eatCooldown = Math.max(0, fish.eatCooldown - step);
      fish.gulpTimer = Math.max(0, fish.gulpTimer - step * 2.35);
      fish.feedingBoost = Math.max(0, fish.feedingBoost - step * 0.55);
      if (fish.targetPelletId) fish.feedingBoost = Math.max(fish.feedingBoost, 0.35);

      if (fish.alpha < 0.05) {
        this.updateRig(fish, step, settings);
        continue;
      }

      this.updateCall(fish, step);
      this.updateNaturalState(fish, step);
      this.updateFeeding(fish, step);
      if (fish.targetPelletId) {
        if (fish.state !== SwimState.Burst) {
          fish.state = SwimState.Burst;
          fish.stateAge = 0;
          fish.stateDuration = 0.6;
        }
        fish.tailEffort = Math.max(fish.tailEffort, 1.05);
      }
      this.updateDepth(fish, step);
      this.updateSurfaceElevation(fish, step);
      this.updateGulp(fish, step);
      this.steer(fish, step, settings);
      this.updateRig(fish, step, settings);
      this.emitTailWake(fish, step, settings);
    }
  }

  /** Xorshift32 so each koi keeps a stable, reproducible temperament. */
  private random(fish: SchoolFish) {
    let value = fish.rng >>> 0;
    value ^= value << 13;
    value >>>= 0;
    value ^= value >>> 17;
    value ^= value << 5;
    value >>>= 0;
    fish.rng = value;
    return (fish.rng & 0x00ffffff) / 0x01000000;
  }

  private range(fish: SchoolFish, low: number, high: number) {
    return low + (high - low) * this.random(fish);
  }

  private updateCall(fish: SchoolFish, dt: number) {
    if (!this.call) {
      if (fish.respondedToCall) {
        // Return to the fish's natural depth as soon as the food is gone.
        fish.depthAge = fish.depthDuration;
        fish.respondedToCall = false;
        fish.callResponseAge = 0;
      }
      fish.callDelay = 0;
      return;
    }

    fish.callDelay = Math.max(0, fish.callDelay - dt);
    if (fish.respondedToCall) {
      fish.callResponseAge += dt;
      return;
    }
    if (fish.callDelay > 0) return;

    fish.respondedToCall = true;
    fish.callResponseAge = 0;
    fish.orbitDirection = this.random(fish) < 0.5 ? -1 : 1;
    if (this.call.rise) {
      fish.depthTarget = POND.call.riseDepth;
      fish.depthRate = 3 / Math.max(0.1, POND.call.riseSeconds);
    }
    this.enterState(fish, SwimState.Burst);
  }

  private updateNaturalState(fish: SchoolFish, dt: number) {
    // While food is on the surface the fish hold their excited burst; letting
    // the natural machine fall into Hover mid-chase looks like a limp tail on
    // a fish that is visibly racing for the call.
    if (this.call?.gather && fish.respondedToCall) return;
    fish.stateAge += dt;
    if (fish.stateAge < fish.stateDuration) return;

    const roll = this.random(fish);
    switch (fish.state) {
      case SwimState.Glide:
        if (roll < 0.25) this.enterState(fish, SwimState.Coast);
        else if (roll < 0.43) this.enterState(fish, SwimState.Hover);
        else if (roll < 0.61) this.enterState(fish, SwimState.Pivot);
        else if (roll < 0.72) this.enterState(fish, SwimState.Burst);
        else this.enterState(fish, SwimState.Glide);
        break;
      case SwimState.Coast:
        if (roll < 0.38) this.enterState(fish, SwimState.Hover);
        else if (roll < 0.72) this.enterState(fish, SwimState.Glide);
        else if (roll < 0.9) this.enterState(fish, SwimState.Pivot);
        else this.enterState(fish, SwimState.Burst);
        break;
      case SwimState.Hover:
        if (roll < 0.34) this.enterState(fish, SwimState.Pivot);
        else if (roll < 0.55) this.enterState(fish, SwimState.Burst);
        else this.enterState(fish, SwimState.Glide);
        break;
      case SwimState.Burst:
        this.enterState(fish, SwimState.Coast);
        break;
      case SwimState.Pivot:
        this.enterState(fish, roll < 0.38 ? SwimState.Burst : SwimState.Glide);
        break;
    }
  }

  private enterState(fish: SchoolFish, next: SwimState) {
    if (
      this.reduced &&
      (next === SwimState.Burst || next === SwimState.Pivot)
    ) {
      next = this.random(fish) < 0.5 ? SwimState.Glide : SwimState.Coast;
    }
    fish.state = next;
    fish.stateAge = 0;
    fish.stateDuration =
      this.durationFor(fish, next) * (this.reduced ? 1.7 : 1);
    if (next === SwimState.Pivot) {
      const direction = this.random(fish) < 0.5 ? -1 : 1;
      fish.pivotHeading = wrapAngle(
        fish.heading +
          direction *
            this.range(
              fish,
              POND.swim.pivotAngleMin,
              POND.swim.pivotAngleMax,
            ),
      );
    }
  }

  private durationFor(fish: SchoolFish, state: SwimState) {
    const spec = this.stateSpec(state);
    return this.range(fish, spec.min, spec.max);
  }

  private stateSpec(state: SwimState) {
    switch (state) {
      case SwimState.Glide:
        return POND.states.glide;
      case SwimState.Coast:
        return POND.states.coast;
      case SwimState.Hover:
        return POND.states.hover;
      case SwimState.Burst:
        return POND.states.burst;
      case SwimState.Pivot:
        return POND.states.pivot;
    }
  }

  private updateDepth(fish: SchoolFish, dt: number) {
    const risingForCall = this.call?.rise === true && fish.respondedToCall;
    if (!risingForCall) {
      fish.depthAge += dt;
      if (fish.depthAge >= fish.depthDuration) {
        fish.depthAge = 0;
        fish.depthDuration =
          this.range(fish, POND.depth.stateMin, POND.depth.stateMax) *
          (this.reduced ? 1.5 : 1);
        const base = fish.baseDepth;
        fish.depthTarget = clamp(
          base +
            (this.random(fish) * 2 - 1) * POND.depth.range,
          POND.depth.min,
          POND.depth.max,
        );
        fish.depthRate =
          3 /
          this.range(
            fish,
            POND.depth.transitionMin,
            POND.depth.transitionMax,
          );
      }
    }
    fish.depth +=
      (fish.depthTarget - fish.depth) *
      (1 - Math.exp(-fish.depthRate * dt));
  }

  /**
   * Calm koi occasionally mouth the surface. The bubble is small, but it ties
   * the fish to the water surface instead of leaving them as free-floating
   * sprites.
   */
  private updateGulp(fish: SchoolFish, dt: number) {
    if (this.clock < fish.gulpAt) return;
    const calm =
      fish.state === SwimState.Hover ||
      fish.state === SwimState.Coast ||
      fish.state === SwimState.Glide;
    const settled =
      calm &&
      !this.call &&
      fish.depth <= POND.call.gulpDepth &&
      fish.speed <= fish.cruise * 0.72;
    if (!settled) {
      fish.gulpAt = this.clock + 2.4 + this.random(fish) * 2.4;
      return;
    }

    const forwardX = Math.cos(fish.heading);
    const forwardY = Math.sin(fish.heading);
    this.queueImpulse(
      (fish.bonePos[0] + forwardX * fish.length * 0.08) / this.width,
      (fish.bonePos[1] + forwardY * fish.length * 0.08) / this.height,
      fish.length * 0.13,
      POND.wave.tailStrength * 0.9,
    );
    fish.gulpAt =
      this.clock +
      this.range(fish, POND.call.gulpIntervalMin, POND.call.gulpIntervalMax);
  }

  private steer(fish: SchoolFish, dt: number, settings: PondSettings) {
    const extents = bodyExtents(fish);
    const forwardX = Math.cos(fish.heading);
    const forwardY = Math.sin(fish.heading);

    /*
     * Nagomi's steering: hold the current course, then curve it with two slow
     * sine waves. There is no waypoint to arrive at, so the fish never snaps
     * to a new heading; it accumulates gentle turns and occasionally resolves
     * them with a pivot.
     */
    let steerX = forwardX;
    let steerY = forwardY;
    if (fish.state === SwimState.Pivot) {
      steerX = Math.cos(fish.pivotHeading) * 4.7;
      steerY = Math.sin(fish.pivotHeading) * 4.7;
    } else if (fish.state !== SwimState.Hover) {
      const wander =
        Math.sin(this.clock * 0.29 + fish.seed) * 0.66 +
        Math.sin(this.clock * 0.113 + fish.seed * 1.73) * 0.4;
      steerX = forwardX * 0.95 + Math.cos(fish.heading + wander) * 0.58;
      steerY = forwardY * 0.95 + Math.sin(fish.heading + wander) * 0.58;
    } else {
      steerX *= 0.22;
      steerY *= 0.22;
    }

    // A weak pull toward the koi's home band keeps the Figma composition
    // recognisable without turning the drift back into waypoint chasing.
    const homeX =
      (fish.homeX +
        Math.sin(this.clock * 0.071 + fish.seed) *
          POND.motion.wanderX *
          0.85) *
      this.width;
    const homeY =
      (fish.homeY +
        Math.sin(this.clock * 0.053 + fish.seed * 2.1) *
          POND.motion.wanderY *
          0.85) *
      this.height;
    const homeDx = homeX - fish.x;
    const homeDy = homeY - fish.y;
    const homeDistance = Math.hypot(homeDx, homeDy) || 1;
    const homePull =
      clamp(homeDistance / (this.unit * 0.5), 0, 1) * 0.34;
    steerX += (homeDx / homeDistance) * homePull;
    steerY += (homeDy / homeDistance) * homePull;

    // Separation, with a whisper of alignment when two koi cross paths.
    let alignX = 0;
    let alignY = 0;
    let neighbours = 0;
    for (const other of this.fish) {
      if (other === fish) continue;
      const ox = fish.x - other.x;
      const oy = fish.y - other.y;
      const gap = Math.hypot(ox, oy);
      const bodyGap = (fish.length + other.length) * 0.5;
      if (gap > 0.001 && gap < bodyGap) {
        const push = 1 - gap / bodyGap;
        steerX += (ox / gap) * push * 2.25;
        steerY += (oy / gap) * push * 2.25;
      }
      if (gap > 0.001 && gap < bodyGap * 2.4) {
        alignX += Math.cos(other.heading);
        alignY += Math.sin(other.heading);
        neighbours += 1;
      }
    }
    if (neighbours > 0) {
      const alignLength = Math.hypot(alignX, alignY) || 1;
      steerX += (alignX / alignLength) * 0.18;
      steerY += (alignY / alignLength) * 0.18;
    }

    if (this.pointer.active && !this.reduced && !this.call) {
      const px = fish.x - this.pointer.x;
      const py = fish.y - this.pointer.y;
      const gap = Math.hypot(px, py);
      const radius = POND.pointer.radius + fish.length * 0.18;
      if (gap > 0.001 && gap < radius) {
        const push = 1 - gap / radius;
        steerX += (px / gap) * push * push * POND.pointer.force;
        steerY += (py / gap) * push * push * POND.pointer.force;
      }
    }

    if (this.call && fish.callDelay <= 0) {
      const ax = this.call.x - fish.x;
      const ay = this.call.y - fish.y;
      const gap = Math.hypot(ax, ay) || 1;
      const nearRadius = this.call.gather
        ? Math.max(this.unit * 0.045, fish.length * POND.call.gatherRadius)
        : Math.max(this.unit * 0.12, fish.length * 1.4);
      if (gap > nearRadius) {
        const chasing =
          this.call.gather &&
          fish.callResponseAge < POND.call.chaseBoost;
        const force = this.call.gather
          ? chasing
            ? POND.call.chaseForce
            : POND.call.approachForce
          : POND.attract.force;
        steerX += (ax / gap) * force * this.call.strength;
        steerY += (ay / gap) * force * this.call.strength;
      } else {
        // Circle rather than bump noses at the food.
        const orbit =
          fish.orbitDirection *
          POND.call.orbitForce *
          (this.call.gather ? 1 : 0.42);
        steerX += (-ay / gap) * orbit;
        steerY += (ax / gap) * orbit;
        steerX -= (ax / gap) * 0.55;
        steerY -= (ay / gap) * 0.55;
      }
    }

    // Feeding: pellet seeking and cursor anticipation.
    let feedingSurge = 0;
    if (fish.targetPelletId != null) {
      const target = this.pellets.find((p) => p.id === fish.targetPelletId && !p.eaten);
      if (target) {
        const dx = target.x - fish.x;
        const dy = target.y - fish.y;
        const dist = Math.hypot(dx, dy) || 1;
        steerX += (dx / dist) * 6.5;
        steerY += (dy / dist) * 6.5;
        if (dist < 700) {
          feedingSurge = 0.45 + (1 - Math.min(dist, 700) / 700) * 0.85;
        }
        if (dist < 220) feedingSurge = Math.max(feedingSurge, 1.1);
      } else {
        fish.targetPelletId = null;
      }
    } else if (this.pellets.length === 0 && this.feedCursor.active) {
      const dx = this.feedCursor.x - fish.x;
      const dy = this.feedCursor.y - fish.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 75 && dist < 560) {
        const inv = 1 / Math.max(1, dist);
        const pull = 0.55 * (1 - Math.abs(dist - 320) / 320);
        steerX += dx * inv * pull;
        steerY += dy * inv * pull;
        feedingSurge = Math.max(feedingSurge, 0.16);
      }
    }
    fish.feedingBoost = Math.max(fish.feedingBoost, feedingSurge);

    /*
     * Scatter is a strong, short-lived away-vector rather than a heading
     * assignment. The koi lean into the escape through the same speed-coupled
     * angular spring as every other turn, so no frame can snap the spine.
     * The vector is applied after the wall solve, where any outward component
     * can be projected along the glass instead of into it.
     */
    let fleePushX = 0;
    let fleePushY = 0;
    if (this.clock < this.fleeUntil) {
      const awayX = fish.x - this.fleeX;
      const awayY = fish.y - this.fleeY;
      const awayGap = Math.hypot(awayX, awayY);
      const awayAngle =
        awayGap > 0.001
          ? Math.atan2(awayY, awayX)
          : fish.heading + (this.random(fish) - 0.5) * 0.8;
      const fade = clamp(
        (this.fleeUntil - this.clock) / POND.disturb.fleeSeconds,
        0,
        1,
      );
      fleePushX = Math.cos(awayAngle) * POND.disturb.fleeForce * fade;
      fleePushY = Math.sin(awayAngle) * POND.disturb.fleeForce * fade;
    }

    /*
     * Early boundary steering, measured against the predicted body rather than
     * the current centre. The old fixed margin was smaller than the half-length
     * of the large koi, so a fish could touch the top or side glass while the
     * soft steering still read "no danger" — it then bounced against the hard
     * clamp every frame and crawled along the wall.
     */
    const floor = Math.min(
      this.height - extents.y - 8,
      this.height * POND.fishFloor,
    );
    const probeSpeed = Math.max(fish.speed, this.unit * 0.015);
    const probeX =
      fish.x +
      Math.cos(fish.heading) * probeSpeed * POND.motion.wallLookahead;
    const probeY =
      fish.y +
      Math.sin(fish.heading) * probeSpeed * POND.motion.wallLookahead;
    const pad = POND.motion.wallPad;
    const wallForce = POND.motion.wallForce;
    const left = clamp((pad - (probeX - extents.x)) / pad, 0, 1);
    const right = clamp(
      (pad - (this.width - probeX - extents.x)) / pad,
      0,
      1,
    );
    const top = clamp((pad - (probeY - extents.y)) / pad, 0, 1);
    /*
     * The floor is a composition line for the koi's centre, not glass: the
     * centre is clamped above it while the body is free to drape below it
     * toward the copy. Measuring this edge with the body half-height made a
     * large koi watch the wrong boundary and sit far higher than the Figma
     * composition.
     */
    const bottom = clamp((pad - (floor - probeY)) / pad, 0, 1);

    /*
     * Curves add up at a corner, so a simple "push away from the wall" vector
     * can demand a 160° turn the koi cannot complete before contact. Follow
     * the glass instead: keep some inward pressure and a larger tangent
     * component. Each wall's tangent follows the heading until another wall
     * is close, then turns away from that corner. Corner proximity is
     * measured in body lengths from the predicted body edge (or centre at the
     * composition floor), so the tangent direction changes continuously; a
     * fixed risk threshold flipped it instantly and could steer a fish already
     * inside the pad into the corner. Summing all four walls with continuous
     * risk weights makes a corner resolve to one stable diagonal instead of
     * flickering between two axes frame by frame.
     */
    const cornerRange = Math.max(
      1,
      fish.length * POND.motion.wallCornerRange,
    );
    const nearTop = clamp(1 - (probeY - extents.y) / cornerRange, 0, 1);
    const nearBottom = clamp(1 - (floor - probeY) / cornerRange, 0, 1);
    const nearLeft = clamp(1 - (probeX - extents.x) / cornerRange, 0, 1);
    const nearRight = clamp(
      1 - (this.width - probeX - extents.x) / cornerRange,
      0,
      1,
    );

    const verticalFollow = Math.sin(fish.heading) >= 0 ? 1 : -1;
    const verticalAway = nearTop >= nearBottom ? 1 : -1;
    const verticalTangent =
      verticalFollow +
      (verticalAway - verticalFollow) * Math.max(nearTop, nearBottom);
    const horizontalFollow = Math.cos(fish.heading) >= 0 ? 1 : -1;
    const horizontalAway = nearRight >= nearLeft ? -1 : 1;
    const horizontalTangent =
      horizontalFollow +
      (horizontalAway - horizontalFollow) * Math.max(nearLeft, nearRight);

    const wallRisk = Math.max(left, right, top, bottom);
    if (wallRisk > 0) {
      const inwardX = left - right;
      const inwardY = top - bottom;
      const wallTangentX = (top + bottom) * horizontalTangent;
      const wallTangentY = (left + right) * verticalTangent;
      steerX += (inwardX * 0.55 + wallTangentX * 1.35) * wallForce;
      steerY += (inwardY * 0.55 + wallTangentY * 1.35) * wallForce;
    }

    /*
     * A scatter centred in the pond pushes a corner fish straight at the
     * glass. Near any wall, strip the outward component of the flee impulse
     * so the startle still reads as a dart, but one that runs along the glass
     * rather than pinning the koi against it.
     */
    if (fleePushX !== 0 || fleePushY !== 0) {
      const project = (risk: number, nx: number, ny: number) => {
        if (risk <= 0) return;
        const outward = fleePushX * nx + fleePushY * ny;
        if (outward < 0) {
          fleePushX -= nx * outward;
          fleePushY -= ny * outward;
        }
      };
      project(left, 1, 0);
      project(right, -1, 0);
      project(top, 0, 1);
      project(bottom, 0, -1);
      steerX += fleePushX;
      steerY += fleePushY;
    }

    const steerLength = Math.hypot(steerX, steerY) || 1;
    const desiredAngle = Math.atan2(
      steerY / steerLength,
      steerX / steerLength,
    );

    const reducedScale = this.reduced ? POND.swim.reducedSpeed : 1;
    const baseIntent = fish.cruise * settings.swimSpeed * reducedScale;
    let desiredSpeed: number;
    const chasing =
      Boolean(this.call) &&
      fish.respondedToCall &&
      fish.callResponseAge < POND.call.chaseBoost;
    if (chasing) {
      const fade = 1 - clamp(fish.callResponseAge / POND.call.chaseBoost, 0, 1);
      desiredSpeed =
        fish.maxSpeed *
        settings.swimSpeed *
        reducedScale *
        (POND.call.chaseSpeed + fade * POND.call.chaseExtra);
    } else if (this.call && fish.callDelay <= 0) {
      const gap = Math.hypot(this.call.x - fish.x, this.call.y - fish.y);
      const urgency = clamp(gap / (this.unit * 0.5), 0.2, 1);
      desiredSpeed =
        baseIntent +
        (fish.maxSpeed * settings.swimSpeed - baseIntent) * urgency;
    } else {
      const stateSpeed =
        fish.state === SwimState.Coast
          ? POND.swim.coastSpeed
          : fish.state === SwimState.Hover
            ? POND.swim.hoverSpeed
            : fish.state === SwimState.Burst
              ? fish.maxSpeed * POND.swim.burstSpeed
              : fish.state === SwimState.Pivot
                ? POND.swim.pivotSpeed
                : POND.swim.glideSpeed;
      desiredSpeed =
        fish.state === SwimState.Burst
          ? stateSpeed * settings.swimSpeed * reducedScale
          : baseIntent * stateSpeed;
    }
    desiredSpeed *= 1 + fish.startle * POND.motion.startleSpeed * 0.42;
    if (fish.feedingBoost > 0) {
      desiredSpeed = Math.max(desiredSpeed, baseIntent * (1.35 + fish.feedingBoost * 1.8));
      desiredSpeed *= 1 + fish.feedingBoost * 0.9;
    }
    desiredSpeed = clamp(
      desiredSpeed,
      fish.cruise * (this.reduced ? 0.2 : 0.03),
      fish.maxSpeed * 2.4,
    );
    if (this.calm && fish.feedingBoost <= 0) desiredSpeed *= 0.34;

    const speedResponse =
      fish.state === SwimState.Coast
        ? POND.swim.easeCoast
        : fish.state === SwimState.Hover
          ? POND.swim.easeHover
          : fish.state === SwimState.Burst
            ? POND.swim.easeBurst
            : fish.state === SwimState.Pivot
              ? POND.swim.easePivot
              : POND.swim.easeGlide;
    fish.speed +=
      (desiredSpeed - fish.speed) * (1 - Math.exp(-speedResponse * dt));

    let targetEffort: number = POND.swim.tailGlide;
    switch (fish.state) {
      case SwimState.Glide:
        targetEffort = POND.swim.tailGlide;
        break;
      case SwimState.Coast:
        targetEffort = POND.swim.tailCoast;
        break;
      case SwimState.Hover:
        targetEffort = POND.swim.tailHover;
        break;
      case SwimState.Burst:
        targetEffort = POND.swim.tailBurst;
        break;
      case SwimState.Pivot:
        targetEffort = POND.swim.tailPivot;
        break;
    }
    targetEffort += fish.startle * 0.4;
    fish.tailEffort +=
      (targetEffort - fish.tailEffort) *
      (1 - Math.exp(-POND.swim.tailResponse * dt));

    /*
     * Angular inertia with a speed-coupled minimum turn radius: the heading
     * eases toward the target at a bounded rate, and the fish slows gently
     * into tight corners instead of pivoting in place.
     */
    const minTurnRadius = Math.max(
      POND.motion.turnRadiusMin,
      fish.length * POND.motion.turnRadiusBody,
    );
    const speedTurnRate = clamp(fish.speed / minTurnRadius, 0.35, 2.1);
    /*
     * Near the glass the koi gets extra turning authority. Without it a fast
     * burst could not finish the curve before contact, and the hard clamp
     * would decide the pose instead of the steering. The cap stays below the
     * pivot rate, so this reads as a firm swerve, not a spin.
     */
    const wallTurnRate = wallRisk * POND.motion.wallTurnRate;
    const maxTurnRateNow =
      fish.state === SwimState.Pivot
        ? POND.swim.pivotTurnRate
        : Math.max(speedTurnRate, wallTurnRate);
    const turnGain =
      fish.state === SwimState.Pivot
        ? POND.swim.pivotTurnBoost
        : POND.motion.desiredTurnGain;
    const angleDiff = shortestAngle(fish.heading, desiredAngle);
    /*
     * At almost exactly 180° the sign of the error is numerically arbitrary;
     * with a jittering wall target it flipped every frame and the spring
     * cancelled itself, pinning the koi against the glass. Commit to one turn
     * side through that dead zone, then return to normal signed steering.
     */
    const antipodal = Math.abs(angleDiff) > Math.PI - 0.35;
    if (!antipodal && Math.abs(angleDiff) > 0.08) {
      fish.turnBias = Math.sign(angleDiff);
    }
    const turnError = antipodal ? fish.turnBias * Math.PI : angleDiff;
    const omegaBefore = fish.angularVelocity;
    const targetAngularVel = clamp(
      turnError * turnGain,
      -maxTurnRateNow,
      maxTurnRateNow,
    );
    fish.angularVelocity +=
      (targetAngularVel - fish.angularVelocity) *
      (dt * POND.motion.angularResponse);
    fish.heading = wrapAngle(fish.heading + fish.angularVelocity * dt);

    if (process.env.NODE_ENV !== "production") {
      this.steerTrace[fish.lane] = {
        lane: fish.lane,
        clock: Number(this.clock.toFixed(3)),
        fleeActive: this.clock < this.fleeUntil,
        fleeX: this.fleeX,
        fleeY: this.fleeY,
        steerX: Number(steerX.toFixed(2)),
        steerY: Number(steerY.toFixed(2)),
        desiredAngle: Number(desiredAngle.toFixed(3)),
        heading: Number(fish.heading.toFixed(3)),
        angleDiff: Number(angleDiff.toFixed(3)),
        turnError: Number(turnError.toFixed(3)),
        antipodal,
        turnBias: fish.turnBias,
        speed: Number(fish.speed.toFixed(1)),
        state: fish.state,
        stateAge: Number(fish.stateAge.toFixed(2)),
        stateDuration: Number(fish.stateDuration.toFixed(2)),
        pivotHeading: Number(fish.pivotHeading.toFixed(3)),
        maxTurnRateNow: Number(maxTurnRateNow.toFixed(3)),
        turnGain,
        omegaBefore: Number(omegaBefore.toFixed(3)),
        targetAngularVel: Number(targetAngularVel.toFixed(3)),
        angularVelocity: Number(fish.angularVelocity.toFixed(3)),
        length: Number(fish.length.toFixed(1)),
        extentsY: Number(extents.y.toFixed(1)),
        x: Number(fish.x.toFixed(1)),
        y: Number(fish.y.toFixed(1)),
        left: Number(left.toFixed(2)),
        right: Number(right.toFixed(2)),
        top: Number(top.toFixed(2)),
        bottom: Number(bottom.toFixed(2)),
      };
    }

    /*
     * Turning bleeds a little speed, but per second, not per frame. The old
     * flat multiplier compounded sixty times a second; at only 0.35 rad/s it
     * was an 88%/s drag, so a gliding koi could never reach its cruise speed
     * and a hard wall turn braked it to a near-stop.
     */
    const turnDrag = Math.min(0.3, Math.abs(fish.angularVelocity) * 0.12);
    fish.speed *= Math.exp(-turnDrag * dt);

    fish.x += Math.cos(fish.heading) * fish.speed * dt;
    fish.y += Math.sin(fish.heading) * fish.speed * dt;

    // Hard glass, only as a last resort after the soft steering.
    const nextExtents = bodyExtents(fish);
    const minX = nextExtents.x + 6;
    const maxX = this.width - nextExtents.x - 6;
    const minY = nextExtents.y + 6;
    const maxY = Math.max(minY, floor);
    let bounced = false;
    if (fish.x < minX) {
      fish.x = minX;
      bounced = true;
    } else if (fish.x > maxX) {
      fish.x = maxX;
      bounced = true;
    }
    if (fish.y < minY) {
      fish.y = minY;
      bounced = true;
    } else if (fish.y > maxY) {
      fish.y = maxY;
      bounced = true;
    }
    if (bounced) {
      /*
       * Gentle glass friction, applied per second rather than per contact.
       * The old flat 0.82 multiplier compounded every frame of contact and
       * bled nearly all the speed out of a fish sliding along the wall.
       * Do not re-aim the angular spring here: contact already means the
       * predicted-edge steering could not finish in time, and fighting it
       * with a second target made the heading stall every frame.
       */
      fish.speed *= Math.exp(-1.8 * dt);
    }
    fish.x = clamp(fish.x, 16, this.width - 16);
    fish.y = clamp(fish.y, 16, Math.min(this.height - 16, floor));

    if (process.env.NODE_ENV !== "production") {
      const trace = this.steerTrace[fish.lane];
      if (trace) {
        trace.bounced = bounced;
        trace.yAfter = Number(fish.y.toFixed(1));
        trace.omegaFinal = Number(fish.angularVelocity.toFixed(3));
      }
    }
  }

  private updateRig(fish: SchoolFish, dt: number, settings: PondSettings) {
    // Dynamic beat rate for the tail wave: the koi sweeps faster when it
    // bursts and eases off while it glides or hovers. Deriving this from the
    // already-eased tail effort keeps the amplitude continuous across state
    // changes; a state test here made the tail pop on burst entry.
    const burstEnergy = clamp(
      (fish.tailEffort - POND.swim.tailGlide) /
        Math.max(1e-6, POND.swim.tailBurst - POND.swim.tailGlide),
      0,
      1.5,
    );
    const freqHz =
      settings.tailFrequency *
      fish.tailFactor *
      (0.75 + (fish.speed / 120) * 0.55 + burstEnergy * 0.9);
    fish.phase += freqHz * TAU * dt;

    const waveStrength = (0.18 + burstEnergy * 0.08) * settings.tailAmplitude;
    const last = BONE_COUNT - 1;

    /*
     * Backbone spine angles: the authored skeleton orientation plus the
     * heading turn, plus the turn follow-through (clamped per joint to an
     * anatomical bend limit so hard turns never kink or fold the mesh). The
     * authored spline already carries the artwork's natural curvature, so the
     * chain is seeded from it instead of a straight heading line.
     */
    const backbone = this.backboneAngles;
    const restBones = fish.rig.restBones;
    const headingTurn = wrapAngle(fish.heading + Math.PI - restBones[0].angle);
    for (let bone = 0; bone < BONE_COUNT; bone += 1) {
      const s = bone / last;
      /*
       * The bend allowance grows smoothly from head to tail. The previous
       * three-tier clamp switched limits between adjacent bones, which put a
       * small, moving kink in the spine mid-turn, and was visible as a glitch.
       */
      const headToMid = smoothstep((s - 0.18) / 0.42);
      const midToTail = smoothstep((s - 0.58) / 0.42);
      const maxBend =
        POND.skin.headBend +
        (POND.skin.midBend - POND.skin.headBend) * headToMid +
        (POND.skin.tailBend - POND.skin.midBend) * midToTail;
      const turnBend = 0;
      const straighten = 1;
      const peduncleAngle = restBones[0].angle;
      const restAngle = wrapAngle(restBones[bone].angle + (peduncleAngle - restBones[bone].angle) * straighten);
      backbone[bone] = wrapAngle(restAngle + headingTurn + turnBend);
    }

    // Bilaterally symmetric traveling subcarangiform wave layered on top of
    // the backbone, plus the whole-body swimming flex. The wave is odd about
    // the body axis, so left and right tail sweeps peak symmetrically.
    const wave = this.waveAngles;
    for (let bone = 0; bone < BONE_COUNT; bone += 1) {
      const s = bone / last;
      const envelope =
        s < 0.15
          ? -0.04 * (1 - s / 0.15)
          : Math.pow((s - 0.15) / 0.85, 1.45);
      const phaseArg = s * 5.0 - fish.phase;
      const waveProfile =
        Math.sin(phaseArg) + 0.06 * Math.sin(phaseArg * 3.0) * s * s;
      // The standing "whole-body flex" term was a second, non-travelling bend
      // layered on top of the travelling wave. It held the fish in a pulsed
      // C/S pose that read as a tail curved sideways, and it is not needed
      // for visible wiggle (the travelling wave carries that).
      wave[bone] = wrapAngle(
        backbone[bone] + waveStrength * envelope * waveProfile,
      );
    }

    // Forward integration from the snout along exact rest segment lengths so
    // segment lengths never stretch, and store the smoothed segment tangents
    // as the bone angles the skinning shader consumes.
    const positions = fish.bonePos;
    positions[0] = 0;
    positions[1] = 0;
    for (let bone = 1; bone < BONE_COUNT; bone += 1) {
      const segmentDir = wrapAngle(
        wave[bone - 1] + 0.5 * wrapAngle(wave[bone] - wave[bone - 1]),
      );
      const segment = Math.max(
        4,
        fish.rig.restSegLengths[bone - 1] * fish.worldScale,
      );
      positions[bone * 2] = positions[bone * 2 - 2] + Math.cos(segmentDir) * segment;
      positions[bone * 2 + 1] = positions[bone * 2 - 1] + Math.sin(segmentDir) * segment;
      /*
     * Skinning rotation for bone i is (uBoneAngle[i] - uRestAngle[i]); it
     * must be the bone's own tangent, not the segment direction ending at
     * it (which is the previous joint's orientation) — otherwise every bone
     * lags by half a turn and the authored C-curve reads as bent sideways.
     */
    fish.boneAngles[bone] = wave[bone];
    }
    fish.boneAngles[0] = wave[0];

    let centroidX = 0;
    let centroidY = 0;
    for (let bone = 0; bone < BONE_COUNT; bone += 1) {
      centroidX += positions[bone * 2];
      centroidY += positions[bone * 2 + 1];
    }
    centroidX /= BONE_COUNT;
    centroidY /= BONE_COUNT;
    const offsetX = fish.x - centroidX;
    const offsetY = fish.y - centroidY;
    for (let bone = 0; bone < BONE_COUNT; bone += 1) {
      positions[bone * 2] += offsetX;
      positions[bone * 2 + 1] += offsetY;
    }
  }

  private emitTailWake(
    fish: SchoolFish,
    dt: number,
    settings: PondSettings,
  ) {
    if (!settings.tailAmplitude || fish.alpha < 0.4) return;
    const effectiveDepth = fish.depth * (1 - fish.surfaceElevation * 0.88);
    if (effectiveDepth >= 0.35) return;
    const reference = Math.max(
      1,
      fish.cruise * Math.max(0.4, settings.swimSpeed),
    );
    const speedRatio = clamp(fish.speed / reference, 0, 2.8);
    // A koi hovering in place should not stack wake rings on one spot. Only a
    // fish that is actually travelling gets to disturb the surface.
    if (speedRatio < 0.22) return;
    fish.tailTimer +=
      dt * (0.35 + speedRatio * 1.0 + clamp(fish.tailEffort, 0, 1.2) * 0.3);
    if (fish.tailTimer < POND.wave.tailInterval) return;
    fish.tailTimer -= POND.wave.tailInterval;

    const tail = BONE_COUNT - 1;
    const strength =
      POND.wave.tailStrength *
      settings.tailAmplitude *
      (0.55 + speedRatio * 0.5) *
      (0.55 + Math.abs(Math.sin(fish.phase)) * 0.6) *
      (this.reduced ? 0.22 : 1);
    this.queueImpulse(
      fish.bonePos[tail * 2] / this.width,
      fish.bonePos[tail * 2 + 1] / this.height,
      fish.length * POND.wave.tailRadiusBody,
      strength,
    );
  }

  queueImpulse(
    x: number,
    y: number,
    radius: number,
    strength: number,
  ) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (this.impulses.length > 40) this.impulses.shift();
    this.impulses.push({
      x: clamp(x, 0.02, 0.98),
      y: clamp(y, 0.02, 0.98),
      radius: Math.max(12, radius),
      strength,
    });
  }

  consumeImpulses() {
    if (!this.impulses.length) return [];
    return this.impulses.splice(0, 6);
  }

  get pendingImpulses() {
    return this.impulses.length;
  }

  rippleAt(x: number, y: number, strength = 1) {
    this.queueImpulse(
      x / this.width,
      y / this.height,
      POND.wave.clickRadius,
      POND.wave.clickStrength * strength * (this.reduced ? 0.4 : 1),
    );
  }

  /**
   * Tap = food. Each koi answers after a delay scaled by distance and its own
   * temperament, rises toward the surface, and circles the spot. A ring still
   * travels out immediately, so the interaction reads either way.
   */
  tapAt(x: number, y: number) {
    this.rippleAt(x, y, 1);
    if (this.reduced) return;

    this.call = {
      x: clamp(x, 0, this.width),
      y: clamp(y, 0, this.height),
      until: this.clock + POND.call.duration,
      strength: 1,
      rise: true,
      gather: true,
    };
    for (const fish of this.fish) {
      const distance = Math.hypot(fish.x - x, fish.y - y);
      const distanceAmount = Math.pow(
        clamp(distance / (this.unit * POND.call.distanceAtMax), 0, 1),
        POND.call.distanceExponent,
      );
      fish.callDelay =
        POND.call.minDelay +
        distanceAmount * POND.call.maxDistanceDelay +
        this.random(fish) * POND.call.jitter +
        (1 - fish.reactivity) * POND.call.temperamentDelay;
      fish.respondedToCall = false;
      fish.callResponseAge = 0;
      fish.orbitDirection = this.random(fish) < 0.5 ? -1 : 1;
      fish.startle = Math.max(fish.startle, 0.12);
    }
  }

  scatterAt(x: number, y: number) {
    this.rippleAt(x, y, 1.15);
    this.startle = 1;
    this.call = null;
    this.fleeX = x;
    this.fleeY = y;
    this.fleeUntil = this.clock + POND.disturb.fleeSeconds;
    if (this.reduced) return;

    const farRadius = POND.disturb.farRadius;
    for (const fish of this.fish) {
      const distance = Math.hypot(fish.x - x, fish.y - y);
      const near = 1 - clamp(distance / farRadius, 0, 1);
      fish.startle = Math.max(fish.startle, 0.45 + near * 0.55);
      fish.respondedToCall = false;
      fish.callDelay = 0;
      fish.callResponseAge = 0;
      fish.speed = fish.maxSpeed;
      /*
       * The old startle teleported the heading to point away, which snapped
       * the whole 20-bone chain in a single frame. The flee vector in steer()
       * now does the same job through the angular spring: the koi accelerate
       * first, then carve away, and the rig keeps its authored curvature.
       */
      this.enterState(fish, SwimState.Burst);
    }
  }

  /**
   * Hovering a control lures the koi without the full food response: a short,
   * soft call with no depth change.
   */
  attractTo(x: number, y: number) {
    if (this.reduced) return;
    this.call = {
      x: clamp(x, 0, this.width),
      y: clamp(y, 0, this.height),
      until: this.clock + POND.attract.duration,
      strength: 0.55,
      rise: false,
      gather: false,
    };
    for (const fish of this.fish) {
      fish.callDelay = this.random(fish) * 0.3;
      fish.respondedToCall = false;
      fish.callResponseAge = 0;
    }
  }

  setPointer(pointer: SimPointer) {
    this.pointer = pointer;
  }

  setInteractionMode(mode: InteractionMode) {
    this.interactionMode = mode;
    if (mode !== "feed") {
      this.feedCursor.active = false;
    }
  }

  setCalmMode(calm: boolean) {
    this.calm = calm;
    if (calm) this.call = null;
  }

  setRoster(roster: readonly FishRosterEntry[]) {
    const existing = new Map(this.fish.map((fish) => [fish.id, fish]));
    const next: SchoolFish[] = [];
    for (let index = 0; index < roster.length; index += 1) {
      const entry = roster[index];
      const rig = this.rigs.find((candidate) => candidate.source === entry.source);
      if (!rig) continue;
      const current = existing.get(entry.id);
      if (current) {
        current.lane = index;
        current.itemId = entry.itemId;
        current.rarity = entry.rarity;
        current.tint = entry.tint;
        current.glow = entry.glow;
        current.tailFactor = entry.tail;
        next.push(current);
        continue;
      }
      next.push(this.createFish(index, rig.rig, entry));
    }
    this.fish.splice(0, this.fish.length, ...next);
    if (this.steerTrace.length !== next.length) {
      this.steerTrace = next.map(() => null);
    }
    this.pellets = [];
    this.feedEvents.length = 0;
  }

  getPlantInteractors() {
    const indices = [0, 7, 14, 19];
    return this.fish.map((fish) => ({
      heading: fish.heading,
      speed: fish.speed,
      animBones: indices.map((bone) => ({
        x: fish.bonePos[bone * 2],
        y: fish.bonePos[bone * 2 + 1],
      })),
    }));
  }

  consumeFeedEvents(): FeedEvent[] {
    if (!this.feedEvents.length) return [];
    return this.feedEvents.splice(0, this.feedEvents.length);
  }

  setFeedCursor(x: number, y: number, active: boolean) {
    this.feedCursor.x = clamp(x, 0, this.width);
    this.feedCursor.y = clamp(y, 0, this.height);
    this.feedCursor.active = active;
  }

  private spawnPellet(x: number, y: number, vx = 0, vy = 0) {
    if (this.pellets.length >= 60) this.pellets.shift();
    const px = clamp(x, 20, this.width - 20);
    const py = clamp(y, 20, this.height - 20);
    this.pellets.push({
      id: this.nextPelletId++,
      x: px,
      y: py,
      vx,
      vy,
      size: 11 + Math.random() * 3.5,
      age: 0,
      bobPhase: Math.random() * Math.PI * 2,
      eaten: false,
    });
  }

  dropPelletsAt(x: number, y: number, count = 3) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 18 + Math.random() * 42;
      this.spawnPellet(
        x + (Math.random() - 0.5) * 12,
        y + (Math.random() - 0.5) * 12,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );
    }
  }

  trailPelletAt(x: number, y: number) {
    this.spawnPellet(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
  }

  scatterFeedCluster(centerX = this.width * 0.5, centerY = this.height * 0.5, count = 5) {
    this.dropPelletsAt(centerX, centerY, count);
  }

  private updatePellets(dt: number) {
    for (let i = this.pellets.length - 1; i >= 0; i -= 1) {
      const p = this.pellets[i];
      if (p.eaten) {
        this.pellets.splice(i, 1);
        continue;
      }
      p.age += dt;
      p.bobPhase += dt * 3.4;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const drag = Math.exp(-dt * 4.2);
      p.vx *= drag;
      p.vy *= drag;
      p.x = clamp(p.x, 20, this.width - 20);
      p.y = clamp(p.y, 20, this.height - 20);
      if (p.age >= 28) this.pellets.splice(i, 1);
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      const age = (p.age ?? 0) + dt;
      p.age = age;
      const life = p.life ?? 1;
      if (p.delay && p.delay > 0) {
        p.delay -= dt;
        if (p.delay > 0) continue;
        p.delay = 0;
      }
      if (p.type === 2) {
        p.x += (p.vx ?? 0) * dt;
        p.y += (p.vy ?? 0) * dt;
        p.vy = (p.vy ?? 0) - 14 * dt;
        p.wobblePhase = (p.wobblePhase ?? 0) + dt * 8;
        p.x += Math.sin(p.wobblePhase) * 3.5 * dt;
      } else if (p.type === 3) {
        const t = clamp(age / life, 0, 1);
        const eased = 1 - (1 - t) * (1 - t);
        p.size = (p.startSize ?? p.size) + ((p.endSize ?? p.size) - (p.startSize ?? p.size)) * eased;
      }
      const t = clamp(age / life, 0, 1);
      if (p.type === 3) p.alpha = (1 - t) * 0.9;
      else if (p.type === 2) p.alpha = (1 - t) * 0.85;
      if (age >= life) this.particles.splice(i, 1);
    }
  }

  private onEatPellet(
    fish: SchoolFish,
    _pellet: Pellet,
    snoutX: number,
    snoutY: number,
  ) {
    this.feedEvents.push({
      x: snoutX / Math.max(1, this.width),
      y: snoutY / Math.max(1, this.height),
      itemId: fish.itemId,
      rarity: fish.rarity,
    });
    this.queueImpulse(snoutX / this.width, snoutY / this.height, 26, 0.56);
    this.particles.push({ x: snoutX, y: snoutY, size: 18, startSize: 18, endSize: 78, type: 3, alpha: 0.9, age: 0, life: 0.62 });
    this.particles.push({ x: snoutX, y: snoutY, size: 14, startSize: 14, endSize: 52, type: 3, alpha: 0.9, age: 0, life: 0.54, delay: 0.06 });
    for (let i = 0; i < 8; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 28;
      this.particles.push({
        x: snoutX + Math.cos(a) * (2 + Math.random() * 6),
        y: snoutY + Math.sin(a) * (2 + Math.random() * 6),
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 10,
        size: 2.2 + Math.random() * 3.2,
        type: 2,
        alpha: 0.85,
        age: 0,
        life: 0.65 + Math.random() * 0.65,
        wobblePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private getSnout(fish: SchoolFish) {
    const fx = Math.cos(fish.heading);
    const fy = Math.sin(fish.heading);
    return { x: fish.bonePos[0] + fx * fish.length * 0.08, y: fish.bonePos[1] + fy * fish.length * 0.08 };
  }

  private updateFeeding(fish: SchoolFish, _dt: number) {
    const hx = fish.x + Math.cos(fish.heading) * fish.length * 0.42;
    const hy = fish.y + Math.sin(fish.heading) * fish.length * 0.42;
    if (fish.eatCooldown <= 0 && this.pellets.length > 0) {
      let bestId: number | null = null;
      let bestScore = Infinity;
      let best: Pellet | null = null;
      for (const p of this.pellets) {
        if (p.eaten) continue;
        const dx = p.x - fish.x;
        const dy = p.y - fish.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 780) continue;
        let crowdPenalty = 0;
        for (const other of this.fish) {
          if (other === fish || other.targetPelletId !== p.id) continue;
          const otherDist = Math.hypot(other.x - p.x, other.y - p.y);
          if (otherDist < dist - 20) crowdPenalty += 110;
        }
        const angleToPellet = Math.atan2(dy, dx);
        const score = dist + Math.abs(wrapAngle(angleToPellet - fish.heading)) * 55 + crowdPenalty;
        if (score < bestScore) {
          bestScore = score;
          bestId = p.id;
          best = p;
        }
      }
      fish.targetPelletId = bestId;
      if (best) {
        const mouthDist = Math.hypot(best.x - hx, best.y - hy);
        const centerDist = Math.hypot(best.x - fish.x, best.y - fish.y);
        if (mouthDist < Math.max(46, fish.length * 0.22) || centerDist < Math.max(40, fish.length * 0.16)) {
          best.eaten = true;
          fish.targetPelletId = null;
          fish.gulpTimer = 1.0;
          fish.eatCooldown = 0.36;
          fish.feedingBoost = Math.max(fish.feedingBoost, 0.55);
          fish.startle = Math.max(fish.startle, 0.15);
          fish.speed = Math.min(fish.maxSpeed * 1.35, fish.speed + 40);
          fish.pivotHeading = wrapAngle(fish.heading + (Math.random() * 0.75 - 0.375));
          this.onEatPellet(fish, best, hx, hy);
        }
      }
    } else if (this.pellets.length === 0) {
      fish.targetPelletId = null;
    }
  }

  private updateSurfaceElevation(fish: SchoolFish, dt: number) {
    const seeking = Boolean(fish.targetPelletId) || fish.gulpTimer > 0 || (this.feedCursor.active && this.pellets.length === 0);
    const rate = seeking ? 2.6 : 1.1;
    const target = seeking ? 1 : 0;
    fish.surfaceElevation += (target - fish.surfaceElevation) * (1 - Math.exp(-rate * dt));
    fish.surfaceElevation = clamp(fish.surfaceElevation, 0, 1);
  }

  renderFish(): RenderFish[] {
    return this.fish.map((fish) => {
      const effectiveDepth = fish.depth * (1 - fish.surfaceElevation * 0.88);
      const surfaceScale = 1 + fish.surfaceElevation * 0.085;
      const gulpAmount = fish.gulpTimer > 0 ? Math.sin(fish.gulpTimer * Math.PI) : 0;
      return {
        source: fish.source,
        bonePos: fish.bonePos,
        boneAngle: fish.boneAngles,
        worldScale: fish.worldScale,
        alpha: fish.alpha,
        depth: effectiveDepth,
        surfaceScale,
        gulpAmount,
        tint: fish.tint,
        glow: fish.glow,
      } as RenderFish & { surfaceScale: number; gulpAmount: number };
    }) as unknown as RenderFish[];
  }

  getRenderParticles(): ParticleEvent[] {
    const out: ParticleEvent[] = [];
    for (const p of this.pellets) {
      if (p.eaten) continue;
      const scaleIn = Math.min(1, p.age / 0.14);
      const fadeOut = p.age > 26 ? Math.max(0, 1 - (p.age - 26) / 2) : 1;
      const alpha = scaleIn * fadeOut;
      if (alpha <= 0.001) continue;
      const bob = Math.sin(p.bobPhase) * 1.4;
      const y = p.y + bob;
      const size = p.size * (0.85 + 0.15 * scaleIn);
      // Pellet riverbed shadow (type 1), offset (+20, +24)
      out.push({ x: p.x + 20, y: p.y + 24, size: size * 1.9, type: 1, alpha });
      // Floating pellet (type 0)
      out.push({ x: p.x, y, size, type: 0, alpha });
    }
    for (const p of this.particles) {
      if ((p.delay ?? 0) > 0) continue;
      if ((p.alpha ?? 0) <= 0.001) continue;
      out.push(p);
    }
    return out;
  }

  consumeParticles(): ParticleEvent[] {
    return this.getRenderParticles();
  }

  get debugFish() {
    return this.fish.map((fish) => ({
      lane: fish.lane,
      source: fish.source,
      x: Math.round(fish.x),
      y: Math.round(fish.y),
      heading: Number(fish.heading.toFixed(3)),
      speed: Number(fish.speed.toFixed(2)),
      state: STATE_NAMES[fish.state],
      tailEffort: Number(fish.tailEffort.toFixed(2)),
      depth: Number(fish.depth.toFixed(2)),
      alpha: Number(fish.alpha.toFixed(3)),
      startle: Number(fish.startle.toFixed(3)),
      bones: BONE_COUNT,
      tail: [
        Math.round(fish.bonePos[(BONE_COUNT - 1) * 2]),
        Math.round(fish.bonePos[(BONE_COUNT - 1) * 2 + 1]),
      ],
    }));
  }
}
