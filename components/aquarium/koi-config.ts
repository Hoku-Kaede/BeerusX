/**
 * ---------------------------------------------------------------------------
 * KYOKO — koi pond configuration
 * ---------------------------------------------------------------------------
 * The pond is built from the assets in the Figma composition:
 * https://www.figma.com/design/asCStUA7zlkgb6aZ5oQnqA/Untitled?node-id=0-1
 *
 * The current frame contains three koi (koi1, koi2, koi5) and the KYOKO
 * lettering. The centreline controls are normalised UV coordinates of each
 * fish's snout-to-tail spine. They are converted to isotropic image space at
 * rig-build time so the frozen C-curves can be uncurled without squashing the
 * artwork.
 *
 * To add another fish from the same Figma file:
 *   1. Export the layer as PNG and drop it in public/aquarium/.
 *   2. Append a KoiSource with its exact pixel dimensions and nine UV points.
 *   3. Append a KoiLane that points at the new source index.
 * Everything else in this file is safe to tune; the sliders read the values.
 */

export const BONE_COUNT = 20;
export const MESH_GRID = 96;
export const MAX_WAVE_IMPULSES = 6;

export type KoiSource = {
  /** Layer name in the Figma frame. */
  figma: string;
  /** Clean transparent WebP exported from the Figma layer. */
  src: string;
  /** Source image dimensions, used to keep the UV mapping isotropic. */
  width: number;
  height: number;
  aspect: number;
  /** Snout (index 0) to tail-fork centre (index 8), in normalised UV. */
  controls: ReadonlyArray<readonly [number, number]>;
  /** koi2's right caudal tip is frozen in a hook; rotate it back into line. */
  caudalCorrection?: {
    pivotU: number;
    pivotV: number;
    angle: number;
    /** smoothstep edges: uStart, uEnd, vStart, vEnd. */
    falloff: readonly [number, number, number, number];
  };
};

export const KOI_SOURCES: readonly KoiSource[] = [
  {
    figma: "koi1 1",
    src: "/aquarium/koi-1-rig.webp",
    width: 779,
    height: 842,
    aspect: 779 / 842,
    controls: [
      [0.9, 0.77],
      [0.8, 0.73],
      [0.66, 0.69],
      [0.49, 0.64],
      [0.33, 0.56],
      [0.22, 0.44],
      [0.17, 0.31],
      [0.22, 0.22],
      [0.33, 0.15],
    ],
  },
  {
    figma: "koi2 1",
    src: "/aquarium/koi-2-rig.webp",
    width: 796,
    height: 971,
    aspect: 796 / 971,
    controls: [
      [0.8, 0.09],
      [0.7, 0.15],
      [0.55, 0.21],
      [0.4, 0.3],
      [0.28, 0.43],
      [0.26, 0.58],
      [0.35, 0.73],
      [0.5, 0.81],
      [0.66, 0.87],
    ],
    caudalCorrection: {
      pivotU: 0.6,
      pivotV: 0.86,
      angle: 0.44,
      falloff: [0.56, 0.68, 0.74, 0.84],
    },
  },
  {
    figma: "koi5 1",
    src: "/aquarium/koi-5-rig.webp",
    width: 1339,
    height: 533,
    aspect: 1339 / 533,
    controls: [
      [0.025, 0.35],
      [0.1, 0.48],
      [0.22, 0.58],
      [0.36, 0.64],
      [0.5, 0.69],
      [0.64, 0.74],
      [0.77, 0.78],
      [0.89, 0.75],
      [0.95, 0.63],
    ],
  },
];

export type KoiLane = {
  /** Index into KOI_SOURCES. */
  source: number;
  /** Spine length as a fraction of the pond's short side. */
  length: number;
  /** Cruise speed as a fraction of the pond's short side per second. */
  cruise: number;
  /** 0 far — 1 near. Used for tinting, shadows and draw order. */
  depth: number;
  /** The body centre's home, in fractions of the stage. */
  home: readonly [number, number];
  /** Initial direction of travel (radians). */
  heading: number;
  /** Which edge the fish enters from. */
  side: -1 | 1;
};

/**
 * Three lanes taken from the Figma frame: the red-and-white pair near the
 * upper corners, the long gold koi low and central.
 */
export const KOI_LANES: readonly KoiLane[] = [
  {
    source: 0,
    length: 0.33,
    cruise: 0.105,
    depth: 0.55,
    home: [0.19, 0.28],
    heading: 0.42,
    side: -1,
  },
  {
    source: 1,
    length: 0.31,
    cruise: 0.095,
    depth: 0.78,
    home: [0.78, 0.27],
    heading: -1.18,
    side: 1,
  },
  {
    source: 2,
    length: 0.44,
    cruise: 0.085,
    depth: 0.42,
    home: [0.46, 0.63],
    heading: 2.2,
    side: 1,
  },
];

export type PondSettings = {
  tailFrequency: number;
  tailAmplitude: number;
  swimSpeed: number;
  /** 0 — 1. Mapped to a physical damping rate by the wave solver. */
  waterDamping: number;
  /** 0 — 2. 1 is the tuned default. */
  refraction: number;
  overlay: boolean;
};

/**
 * The KYOKO lettering is composited into the pond, under the koi, at the exact
 * rectangle the accessible <h1> occupies. Keeping one shared image means the
 * typography stays crisp HTML text in the DOM and becomes part of the water in
 * the renderer, where the fish can pass in front of it and refract it.
 */
export const TITLE = {
  figma: "KYOKO",
  src: "/aquarium/title-kyoko.webp",
  width: 3033,
  height: 711,
  aspect: 3033 / 711,
} as const;

export const DEFAULT_SETTINGS: PondSettings = {
  tailFrequency: 1,
  tailAmplitude: 1.8,
  swimSpeed: 1,
  waterDamping: 0.36,
  refraction: 1,
  overlay: false,
};

export type SliderKey = Exclude<keyof PondSettings, "overlay">;

export type SliderSpec = {
  key: SliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
};

export const SLIDERS: readonly SliderSpec[] = [
  {
    key: "tailFrequency",
    label: "Tail frequency",
    min: 0.4,
    max: 2.4,
    step: 0.01,
    format: (value) => `${value.toFixed(2)}×`,
  },
  {
    key: "tailAmplitude",
    label: "Tail amplitude",
    min: 0,
    max: 1.8,
    step: 0.01,
    format: (value) => `${value.toFixed(2)}×`,
  },
  {
    key: "swimSpeed",
    label: "Swim speed",
    min: 0.4,
    max: 1.8,
    step: 0.01,
    format: (value) => `${value.toFixed(2)}×`,
  },
  {
    key: "waterDamping",
    label: "Water damping",
    min: 0,
    max: 1,
    step: 0.01,
    format: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: "refraction",
    label: "Refraction",
    min: 0,
    max: 2,
    step: 0.01,
    format: (value) => `${value.toFixed(2)}×`,
  },
];

export const POND = {
  /** Fish shrink a little in portrait, as in the original composition. */
  size: { minScale: 0.78, ratio: 1.45 },
  /** The centre of a koi never drifts below this fraction of the stage. */
  fishFloor: 0.66,
  entry: { duration: 1.25, stagger: 0.16 },
  motion: {
    cruiseVariance: 0.16,
    wanderX: 0.14,
    wanderY: 0.07,
    retargetMin: 3.6,
    retargetMax: 8.2,
    verticalBias: 0.55,
    /** maxTurnRate = speed / max(turnRadiusMin, bodyLength × turnRadiusBody). */
    turnRadiusMin: 85,
    turnRadiusBody: 0.44,
    angularResponse: 4.4,
    desiredTurnGain: 2.6,
    speedResponse: 2.2,
    startleSpeed: 1.7,
    separation: 0.58,
    /**
     * Early wall steering probes where the body would be half a second ahead.
     * The pad is measured to the body edge at the top and sides, and to the
     * centre at the composition floor, so a fish can never reach the glass
     * before the steering has already begun to curve it away.
     */
    wallLookahead: 0.5,
    wallPad: 38,
    wallForce: 7.2,
    /** Extra turn rate at full wall risk; stays below pivotTurnRate. */
    wallTurnRate: 2.4,
    /**
     * Corner awareness distance in body lengths. Within this range of a
     * perpendicular wall, a wall tangent stops following the heading and
     * points away from the corner instead.
     */
    wallCornerRange: 1,
  },
  /**
   * Swim-state machinery adapted from Nagomi's koi pond. Each fish drifts
   * between five intentions instead of seeking waypoints: a long glide, a
   * coast with almost no tail effort, a near-stop hover, a short burst, and a
   * slow pivot that swings the body around. The numbers below are the per
   * state speed, turning and tail-effort targets.
   */
  swim: {
    glideSpeed: 1,
    coastSpeed: 0.28,
    hoverSpeed: 0.07,
    burstSpeed: 1.08,
    pivotSpeed: 0.2,
    /**
     * Normal turns are capped by the speed-coupled radius in POND.motion.
     * A pivot is the exception: a slower, tighter swing under pivotTurnRate.
     */
    pivotTurnBoost: 2.2,
    pivotTurnRate: 3.0,
    pivotAngleMin: 0.9,
    pivotAngleMax: 2.35,
    /** How quickly forward speed eases toward each state's intention. */
    easeGlide: 1.65,
    easeCoast: 1.05,
    easeHover: 3.6,
    easeBurst: 6.4,
    easePivot: 4.2,
    tailGlide: 0.72,
    tailCoast: 0.22,
    tailHover: 0.1,
    tailBurst: 1.18,
    tailPivot: 0.98,
    tailResponse: 4.5,
    /** Coasting and hovering are allowed to bleed almost all forward speed. */
    reducedSpeed: 0.32,
  },
  states: {
    glide: { min: 1.7, max: 4.8 },
    coast: { min: 0.8, max: 2.0 },
    hover: { min: 0.7, max: 2.9 },
    burst: { min: 0.35, max: 0.9 },
    pivot: { min: 0.35, max: 0.8 },
  },
  /**
   * A tap drops food: fish answer after a distance- and temperament-based
   * delay, rise, then circle the spot instead of piling onto one point.
   */
  call: {
    duration: 4.6,
    chaseBoost: 1.5,
    chaseSpeed: 1.6,
    chaseExtra: 0.5,
    chaseForce: 3.2,
    approachForce: 2.35,
    orbitForce: 2.25,
    minDelay: 0.08,
    maxDistanceDelay: 1.05,
    distanceAtMax: 0.75,
    distanceExponent: 1.15,
    jitter: 0.32,
    temperamentDelay: 0.55,
    riseDepth: 0.14,
    riseSeconds: 1.15,
    /** The circling radius, as a fraction of the koi's own body length. */
    gatherRadius: 0.55,
    /** A gulp only happens in calm water this close to the surface. */
    gulpDepth: 0.38,
    gulpIntervalMin: 7,
    gulpIntervalMax: 15,
  },
  /** Fish slowly change how deep they sit in the water column. */
  depth: {
    range: 0.16,
    min: 0.16,
    max: 0.86,
    stateMin: 6.5,
    stateMax: 13,
    transitionMin: 1.6,
    transitionMax: 3.4,
  },
  pointer: {
    radius: 128,
    force: 2.6,
    reducedForce: 0.7,
  },
  disturb: {
    nearRadius: 130,
    farRadius: 520,
    nearBoost: 1.75,
    investigateMin: 1.9,
    investigateMax: 3.1,
    fleeDecay: 1.5,
    startleDecay: 1.4,
    /**
     * A scatter never snaps a heading. It pushes a strong away-vector into
     * steering for this many seconds, so the koi swerve through a real arc.
     */
    fleeSeconds: 1.25,
    fleeForce: 4.4,
  },
  attract: {
    radius: 0.3,
    force: 1.55,
    duration: 2.6,
    drop: 76,
  },
  skin: {
    headBend: 0.045,
    midBend: 0.115,
    tailBend: 0.155,
    advectGain: 1.65,
    advectBase: 1.1,
    headFollow: 10,
  },
  tail: {
    waveCycles: 5,
    harmonic: 3,
    harmonicAmount: 0.1,
    baseBeat: 2.4,
    speedBeat: 7.6,
    startleBeat: 5.8,
    cruiseAmp: 0.3,
    speedAmp: 0.26,
    startleAmp: 0.36,
  },
  wave: {
    /** Safety ceiling for the heightfield, in cells on the long edge. */
    maxGrid: 512,
    /**
     * Target cell size in CSS pixels. The grid is sized from the stage, not
     * the other way around, so a ripple is the same width on a phone and on a
     * wide desktop.
     */
    texelPx: 3.1,
    /** CFL-safe wave speed for the 9-point Laplacian. */
    speed: 0.6,
    /** Damping is applied to the wave's velocity, so it never adds energy. */
    dampingMin: 0.975,
    dampingMax: 0.997,
    heightRange: 8,
    /** A click is a compact push, not a broad swell: sharp sources ring out. */
    clickRadius: 34,
    clickStrength: 0.55,
    dragRadius: 26,
    dragStrength: 0.4,
    tailRadiusBody: 0.14,
    /**
     * A travelling koi leaves a wake, but only an occasional one. Tail wakes
     * are sharp and faint; broad ones just accumulate into a regional swell
     * that pushes the whole heightfield toward its clamp.
     */
    tailStrength: 0.16,
    tailInterval: 0.55,
  },
  render: {
    shadowX: 13,
    shadowY: 22,
    shadowSpread: 0.26,
    refractionPx: 22,
    /** Amplifies the raw heightfield slope into a readable optical offset. */
    refractionGain: 9,
    /** Premultiplied title strength; 1 is the Figma value. */
    titleOpacity: 1.32,
    /** Downward screen travel of the bed per pixel of page scroll. */
    parallaxBed: 0.55,
    /** Fish lag less than the bed; near fish lag least of all. */
    parallaxFar: 0.42,
    parallaxNear: 0.18,
    maxDpr: 1.6,
    maxPixels: 4_500_000,
    overlayPoint: 3.2,
    overlayHead: 5.6,
    overlayLine: 1,
  },
} as const;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function sizeScale(width: number, height: number) {
  return clamp(width / (height * POND.size.ratio), POND.size.minScale, 1);
}
