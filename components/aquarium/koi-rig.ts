import {
  BONE_COUNT,
  MESH_GRID,
  clamp,
  type KoiSource,
} from "./koi-config";

export type RestBone = {
  /** Isotropic image space: x = u × aspect, y = v. */
  x: number;
  y: number;
  /** Tangent pointing from snout toward the tail, in radians. */
  angle: number;
};

export type KoiMesh = {
  positions: Float32Array;
  uvs: Float32Array;
  boneIndices: Float32Array;
  boneWeights: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  triangleCount: number;
};

export type KoiRig = {
  aspect: number;
  restBones: RestBone[];
  restSegLengths: number[];
  /** Spine length in isotropic image units. */
  restLength: number;
  mesh: KoiMesh;
};

type Point = { x: number; y: number };
type DenseSpline = {
  points: Point[];
  cumulative: number[];
  total: number;
};

const DENSE_SAMPLES = 720;

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Standard uniform Catmull-Rom, evaluated at t ∈ [0, points.length - 1]. */
function catmullRomPoint(points: readonly Point[], t: number): Point {
  const last = points.length - 1;
  const i = clamp(Math.floor(t), 0, Math.max(0, last - 1));
  const u = clamp(t - i, 0, 1);
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(last, i + 1)];
  const p3 = points[Math.min(last, i + 2)];
  const u2 = u * u;
  const u3 = u2 * u;

  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * u +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * u +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
  };
}

/**
 * Sample the control polygon into a dense curve and measure arc length. The
 * 20 rest bones are then spaced evenly along that length, which keeps the
 * travelling tail wave at a stable spatial frequency even where the original
 * artwork bunches its control points.
 */
function buildDenseSpline(points: readonly Point[]): DenseSpline {
  const samples: Point[] = [];
  const cumulative: number[] = [];
  let total = 0;
  const last = points.length - 1;

  for (let i = 0; i <= DENSE_SAMPLES; i += 1) {
    const t = (i / DENSE_SAMPLES) * last;
    const point = catmullRomPoint(points, t);
    if (samples.length) {
      const previous = samples[samples.length - 1];
      total += Math.hypot(point.x - previous.x, point.y - previous.y);
    }
    samples.push(point);
    cumulative.push(total);
  }

  return { points: samples, cumulative, total };
}

function sampleSpine(source: KoiSource) {
  const controls: Point[] = source.controls.map(([u, v]) => ({
    x: u * source.aspect,
    y: v,
  }));
  const dense = buildDenseSpline(controls);
  const bones: RestBone[] = [];
  const lengths: number[] = [];
  let cursor = 0;

  for (let i = 0; i < BONE_COUNT; i += 1) {
    const target = (dense.total * i) / (BONE_COUNT - 1);
    while (
      cursor < dense.points.length - 2 &&
      dense.cumulative[cursor + 1] < target
    ) {
      cursor += 1;
    }
    const segmentLength = Math.max(
      1e-6,
      dense.cumulative[cursor + 1] - dense.cumulative[cursor],
    );
    const local = clamp(
      (target - dense.cumulative[cursor]) / segmentLength,
      0,
      1,
    );
    const a = dense.points[cursor];
    const b = dense.points[cursor + 1] ?? a;
    const x = a.x + (b.x - a.x) * local;
    const y = a.y + (b.y - a.y) * local;

    const tangentA = dense.points[Math.max(0, cursor - 1)];
    const tangentB = dense.points[Math.min(dense.points.length - 1, cursor + 2)];
    let angle = Math.atan2(tangentB.y - tangentA.y, tangentB.x - tangentA.x);
    if (!Number.isFinite(angle)) {
      angle = bones.length ? bones[bones.length - 1].angle : 0;
    }

    if (bones.length) {
      const previous = bones[bones.length - 1];
      lengths.push(Math.hypot(x - previous.x, y - previous.y));
    }
    bones.push({ x, y, angle });
  }

  return {
    bones,
    lengths,
    restLength: lengths.reduce((sum, value) => sum + value, 0),
  };
}

/** One more sample than the cell count, so cell corners sit exactly on samples. */
const GRID_POINTS = MESH_GRID + 1;

function sampleAlphaMask(image: CanvasImageSource): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = GRID_POINTS;
  canvas.height = GRID_POINTS;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return new Uint8ClampedArray(GRID_POINTS * GRID_POINTS);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const alpha = new Uint8ClampedArray(GRID_POINTS * GRID_POINTS);
  for (let i = 0; i < alpha.length; i += 1) {
    alpha[i] = data[i * 4 + 3];
  }
  return alpha;
}

function sampleAlpha(alpha: Uint8ClampedArray, gx: number, gy: number) {
  return alpha[gy * GRID_POINTS + gx] > 8 ? 1 : 0;
}

function nearestBone(x: number, y: number, restBones: readonly RestBone[]) {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < restBones.length; i += 1) {
    const dx = x - restBones[i].x;
    const dy = y - restBones[i].y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

const WEIGHT_CACHE = new Map<number, { index: number; weight: number }[]>();

function boneWeights(best: number) {
  const cached = WEIGHT_CACHE.get(best);
  if (cached) return cached;

  /*
   * The caudal fin hangs behind the last bone, so every one of its vertices
   * picks that bone as the nearest sample. Left to the Gaussian falloff it
   * still received 36% of bone 18 and 12% of bone 17, and because the fin
   * is wide those three rotations are about three different centres: the
   * fan sheared and curled sideways as the travelling wave moved bones
   * 17–19 apart. A caudal fin is one membrane on one stalk, so bind it to
   * the last bone outright and let it sweep as a rigid fan.
   */
  if (best >= BONE_COUNT - 1) {
    const rigid = [{ index: BONE_COUNT - 1, weight: 1 }];
    WEIGHT_CACHE.set(best, rigid);
    return rigid;
  }

  const candidates: { index: number; weight: number }[] = [];
  const low = Math.max(0, best - 2);
  const high = Math.min(BONE_COUNT - 1, best + 2);
  for (let index = low; index <= high; index += 1) {
    const delta = (index - best) / 1.15;
    candidates.push({
      index,
      weight: Math.exp(-0.5 * delta * delta),
    });
  }
  candidates.sort((a, b) => b.weight - a.weight);
  const top = candidates.slice(0, 4);
  const total = top.reduce((sum, entry) => sum + entry.weight, 0);
  const normalised = top.map((entry) => ({
    index: entry.index,
    weight: entry.weight / total,
  }));
  WEIGHT_CACHE.set(best, normalised);
  return normalised;
}

/**
 * Koi 2's right caudal tip is drawn hooked upward. Rotate only that part of
 * the mesh back into a symmetrical fan; the spine itself is untouched.
 */
function correctCaudal(
  x: number,
  y: number,
  source: KoiSource,
): [number, number] {
  const correction = source.caudalCorrection;
  if (!correction) return [x, y];

  const [u0, u1, v0, v1] = correction.falloff;
  const weight =
    smoothstep(u0, u1, x / source.aspect) * smoothstep(v0, v1, y);
  if (weight <= 0) return [x, y];

  const pivotX = correction.pivotU * source.aspect;
  const pivotY = correction.pivotV;
  const angle = correction.angle * weight;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - pivotX;
  const dy = y - pivotY;
  return [
    pivotX + dx * cos - dy * sin,
    pivotY + dx * sin + dy * cos,
  ];
}

type CellCorner = {
  x: number;
  y: number;
  u: number;
  v: number;
  bone: number;
};

function buildMesh(source: KoiSource, restBones: readonly RestBone[], image: CanvasImageSource): KoiMesh {
  const alpha = sampleAlphaMask(image);
  const positions: number[] = [];
  const uvs: number[] = [];
  const boneIndices: number[] = [];
  const boneWeightsList: number[] = [];
  const indices: number[] = [];
  const inv = 1 / (MESH_GRID + 1);

  const corner = (gx: number, gy: number): CellCorner => {
    const [x, y] = correctCaudal(
      (gx * inv) * source.aspect,
      gy * inv,
      source,
    );
    return {
      x,
      y,
      u: gx * inv,
      v: gy * inv,
      bone: nearestBone(x, y, restBones),
    };
  };

  for (let gy = 0; gy < MESH_GRID; gy += 1) {
    for (let gx = 0; gx < MESH_GRID; gx += 1) {
      const corners: CellCorner[] = [
        corner(gx, gy),
        corner(gx + 1, gy),
        corner(gx + 1, gy + 1),
        corner(gx, gy + 1),
      ];
      const painted =
        sampleAlpha(alpha, gx, gy) ||
        sampleAlpha(alpha, gx + 1, gy) ||
        sampleAlpha(alpha, gx + 1, gy + 1) ||
        sampleAlpha(alpha, gx, gy + 1);
      if (!painted) continue;

      const span = (a: number, b: number, c: number) =>
        Math.max(corners[a].bone, corners[b].bone, corners[c].bone) -
        Math.min(corners[a].bone, corners[b].bone, corners[c].bone);
      const diagonalA = Math.max(span(0, 1, 2), span(0, 2, 3));
      const diagonalB = Math.max(span(0, 1, 3), span(1, 2, 3));
      const useA = diagonalA <= diagonalB;
      const triangles = useA
        ? [
            [0, 1, 2],
            [0, 2, 3],
          ]
        : [
            [0, 1, 3],
            [1, 2, 3],
          ];

      const keep = triangles.filter(
        (triangle) => span(triangle[0], triangle[1], triangle[2]) <= 5,
      );
      if (!keep.length) continue;

      const base = positions.length / 2;
      for (const cornerEntry of corners) {
        positions.push(cornerEntry.x, cornerEntry.y);
        uvs.push(cornerEntry.u, cornerEntry.v);
        const weights = boneWeights(cornerEntry.bone);
        for (let slot = 0; slot < 4; slot += 1) {
          boneIndices.push(weights[slot]?.index ?? 0);
          boneWeightsList.push(weights[slot]?.weight ?? 0);
        }
      }
      for (const triangle of keep) {
        indices.push(base + triangle[0], base + triangle[1], base + triangle[2]);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    boneIndices: new Float32Array(boneIndices),
    boneWeights: new Float32Array(boneWeightsList),
    indices: new Uint16Array(indices),
    vertexCount: positions.length / 2,
    triangleCount: indices.length / 3,
  };
}

export function buildKoiRig(image: CanvasImageSource, source: KoiSource): KoiRig {
  const spine = sampleSpine(source);
  return {
    aspect: source.aspect,
    restBones: spine.bones,
    restSegLengths: spine.lengths,
    restLength: spine.restLength,
    mesh: buildMesh(source, spine.bones, image),
  };
}
