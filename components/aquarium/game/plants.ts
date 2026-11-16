import type { PlantKind, PlacedPlant } from "./types";

export const PLANT_VERTEX_FLOATS = 8;

export type PlantSpecies = PlantKind;

export type AquariumPlant = {
  id: number;
  instanceId: string;
  kind: PlantKind;
  species: PlantSpecies;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  seed: number;
  age: number;
  growth: number;
  bendX: number;
  bendY: number;
  bendVx: number;
  bendVy: number;
};

export type PlantKoi = {
  heading: number;
  speed: number;
  animBones: Array<{ x: number; y: number }>;
};

export type PlantPointer = { x: number; y: number; active: boolean };

function seededRand(seed: number): () => number {
  let s = (Math.floor(seed * 99991) + 1) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class PlantManager {
  public plants: AquariumPlant[] = [];
  private nextId = 1;

  private floorData = new Float32Array(0);
  private surfaceData = new Float32Array(0);
  private floorCount = 0;
  private surfaceCount = 0;

  get floorVertices() {
    return this.floorCount;
  }
  get surfaceVertices() {
    return this.surfaceCount;
  }
  get floorGeometry() {
    return this.floorData;
  }
  get surfaceGeometry() {
    return this.surfaceData;
  }
  get count() {
    return this.plants.length;
  }

  sync(placed: readonly PlacedPlant[], width: number, height: number) {
    const previous = new Map(this.plants.map((plant) => [plant.instanceId, plant]));
    const next: AquariumPlant[] = [];
    for (const item of placed) {
      const existing = previous.get(item.instanceId);
      if (existing) {
        existing.x = item.nx * width;
        existing.y = item.ny * height;
        existing.scale = item.scale;
        existing.rotation = item.rotation;
        next.push(existing);
        continue;
      }
      next.push({
        id: this.nextId++,
        instanceId: item.instanceId,
        kind: item.kind,
        species: item.kind,
        x: item.nx * width,
        y: item.ny * height,
        scale: item.scale,
        rotation: item.rotation,
        seed: item.seed,
        age: 0,
        growth: 0.01,
        bendX: 0,
        bendY: 0,
        bendVx: 0,
        bendVy: 0,
      });
    }
    this.plants = next;
  }

  resize(width: number, height: number, placed: readonly PlacedPlant[]) {
    const map = new Map(placed.map((item) => [item.instanceId, item]));
    for (const plant of this.plants) {
      const item = map.get(plant.instanceId);
      if (!item) continue;
      plant.x = item.nx * width;
      plant.y = item.ny * height;
    }
  }

  update(dt: number, elapsed: number, kois: readonly PlantKoi[], pointer: PlantPointer): void {
    for (const p of this.plants) {
      p.age += dt;
      p.growth += (1 - p.growth) * Math.min(1, dt * 6.5);

      const ambientX = Math.sin(elapsed * 0.95 + p.seed * 0.7) * 8.5;
      const ambientY = Math.cos(elapsed * 0.72 + p.seed * 1.1) * 6.5;

      const reach = p.species === "lily" || p.species === "lotus" ? 78 : 92;
      for (const koi of kois) {
        const kVx = Math.cos(koi.heading) * koi.speed;
        const kVy = Math.sin(koi.heading) * koi.speed;
        for (const bi of [0, 7, 14, 19]) {
          const bone = koi.animBones[bi];
          if (!bone) continue;
          const dx = p.x - bone.x;
          const dy = p.y - bone.y;
          const dist = Math.hypot(dx, dy);
          if (dist < reach && dist > 1) {
            const weight = (1 - dist / reach) * (bi === 19 ? 1.25 : 0.85);
            p.bendVx += ((dx / dist) * 165 + kVx * 0.45) * weight * dt * 6.5;
            p.bendVy += ((dy / dist) * 165 + kVy * 0.45) * weight * dt * 6.5;
          }
        }
      }

      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 85 && dist > 1) {
          const push = (1 - dist / 85) * 90;
          p.bendVx += (dx / dist) * push * dt * 4.5;
          p.bendVy += (dy / dist) * push * dt * 4.5;
        }
      }

      const isPad = p.species === "lily" || p.species === "lotus";
      const stiffness = isPad ? 14 : 18;
      const damping = isPad ? 4.4 : 4.8;
      p.bendVx += ((ambientX - p.bendX) * stiffness - p.bendVx * damping) * dt;
      p.bendVy += ((ambientY - p.bendY) * stiffness - p.bendVy * damping) * dt;
      p.bendX += p.bendVx * dt;
      p.bendY += p.bendVy * dt;

      const maxBend = (isPad ? 18 : 34) * p.scale;
      const mag = Math.hypot(p.bendX, p.bendY);
      if (mag > maxBend) {
        p.bendX = (p.bendX / mag) * maxBend;
        p.bendY = (p.bendY / mag) * maxBend;
      }
    }
  }

  buildGeometry(layer: "floor" | "surface", elapsed: number) {
    const out: number[] = [];
    const pushVert = (x: number, y: number, u: number, v: number, r: number, g: number, b: number, t: number) =>
      out.push(x, y, u, v, r, g, b, t);

    const pushQuad = (
      x0: number, y0: number, u0: number, v0: number,
      x1: number, y1: number, u1: number, v1: number,
      x2: number, y2: number, u2: number, v2: number,
      x3: number, y3: number, u3: number, v3: number,
      r: number, g: number, b: number, t: number,
    ) => {
      pushVert(x0, y0, u0, v0, r, g, b, t);
      pushVert(x1, y1, u1, v1, r, g, b, t);
      pushVert(x2, y2, u2, v2, r, g, b, t);
      pushVert(x0, y0, u0, v0, r, g, b, t);
      pushVert(x2, y2, u2, v2, r, g, b, t);
      pushVert(x3, y3, u3, v3, r, g, b, t);
    };

    for (const plant of this.plants) {
      const isSurface = plant.species === "lily" || plant.species === "lotus";
      if ((layer === "surface") !== isSurface) continue;

      const s = plant.scale * Math.min(1, plant.growth);
      if (s < 0.03) continue;
      const rand = seededRand(plant.seed);
      const baseRot = plant.rotation || 0;

      if (plant.species === "ribbon" || plant.species === "seaweed") {
        const isSeaweed = plant.species === "seaweed";
        const bladeCount = isSeaweed ? 13 : 11;
        for (let i = 0; i < bladeCount; i++) {
          const baseAng = baseRot + (i / bladeCount) * Math.PI * 2 + (rand() - 0.5) * 0.45;
          const length = (isSeaweed ? 54 + rand() * 46 : 48 + rand() * 44) * s;
          const width = (isSeaweed ? 7.2 + rand() * 4.2 : 6.5 + rand() * 3.8) * s;
          const swayPhase = elapsed * (1.35 + rand() * 0.55) + plant.seed + i * 0.7;
          const tint = rand();
          const r = isSeaweed ? 0.14 + tint * 0.16 : 0.08 + tint * 0.09;
          const g = isSeaweed ? 0.28 + tint * 0.13 : 0.30 + tint * 0.14;
          const b = isSeaweed ? 0.14 + tint * 0.05 : 0.16 + tint * 0.05;

          const segments = 6;
          for (let pass = 0; pass < 2; pass++) {
            const isShadow = pass === 0;
            const sxOff = isShadow ? 14 : 0;
            const syOff = isShadow ? 18 : 0;
            const typeFlag = isShadow ? -1 : 0;
            let prevLx = 0;
            let prevLy = 0;
            let prevRx = 0;
            let prevRy = 0;

            for (let seg = 0; seg <= segments; seg++) {
              const t = seg / segments;
              const taper = Math.sin(Math.min(1, t * 0.92 + 0.08) * Math.PI * 0.92);
              const w = width * (0.45 + 0.55 * taper) * (1 - t * 0.72);
              const sway = Math.sin(swayPhase - t * 2.2) * (9 * t * t * s);
              const perpX = -Math.sin(baseAng);
              const perpY = Math.cos(baseAng);

              const cx = plant.x + sxOff + Math.cos(baseAng) * length * t + plant.bendX * (t * t) + perpX * sway;
              const cy = plant.y + syOff + Math.sin(baseAng) * length * t + plant.bendY * (t * t) + perpY * sway;
              const lx = cx - perpX * w;
              const ly = cy - perpY * w;
              const rx = cx + perpX * w;
              const ry = cy + perpY * w;

              if (seg > 0) {
                const prevT = (seg - 1) / segments;
                pushQuad(
                  prevLx, prevLy, -1, prevT,
                  prevRx, prevRy, 1, prevT,
                  rx, ry, 1, t,
                  lx, ly, -1, t,
                  r, g, b, typeFlag,
                );
              }
              prevLx = lx;
              prevLy = ly;
              prevRx = rx;
              prevRy = ry;
            }
          }
        }
      } else if (plant.species === "fern" || plant.species === "kelp") {
        const isKelp = plant.species === "kelp";
        const frondCount = isKelp ? 10 : 9;
        for (let i = 0; i < frondCount; i++) {
          const baseAng = baseRot + (i / frondCount) * Math.PI * 2 + (rand() - 0.5) * 0.38;
          const length = (isKelp ? 52 + rand() * 34 : 36 + rand() * 28) * s;
          const width = (isKelp ? 11 + rand() * 4.5 : 13 + rand() * 5) * s;
          const swayPhase = elapsed * (1.05 + rand() * 0.4) + plant.seed + i * 0.9;
          const tint = rand();
          const r = isKelp ? 0.1 + tint * 0.11 : 0.07 + tint * 0.08;
          const g = isKelp ? 0.36 + tint * 0.15 : 0.34 + tint * 0.13;
          const b = isKelp ? 0.15 + tint * 0.05 : 0.19 + tint * 0.05;
          const perpX = -Math.sin(baseAng);
          const perpY = Math.cos(baseAng);
          const tipFlutter = Math.sin(swayPhase) * 4.5 * s;

          for (let pass = 0; pass < 2; pass++) {
            const isShadow = pass === 0;
            const sxOff = isShadow ? 13 : 0;
            const syOff = isShadow ? 16 : 0;
            const typeFlag = isShadow ? -1 : 1;
            const segments = 5;
            let prevLx = 0;
            let prevLy = 0;
            let prevRx = 0;
            let prevRy = 0;

            for (let seg = 0; seg <= segments; seg++) {
              const t = seg / segments;
              const w = width * (0.18 + 0.82 * Math.pow(Math.sin(t * Math.PI), 0.65));
              const cx = plant.x + sxOff + Math.cos(baseAng) * length * t + plant.bendX * (t * 0.72) + perpX * tipFlutter * (t * t);
              const cy = plant.y + syOff + Math.sin(baseAng) * length * t + plant.bendY * (t * 0.72) + perpY * tipFlutter * (t * t);
              const lx = cx - perpX * w;
              const ly = cy - perpY * w;
              const rx = cx + perpX * w;
              const ry = cy + perpY * w;

              if (seg > 0) {
                const prevT = (seg - 1) / segments;
                pushQuad(
                  prevLx, prevLy, -1, prevT,
                  prevRx, prevRy, 1, prevT,
                  rx, ry, 1, t,
                  lx, ly, -1, t,
                  r, g, b, typeFlag,
                );
              }
              prevLx = lx;
              prevLy = ly;
              prevRx = rx;
              prevRy = ry;
            }
          }
        }
      } else {
        const isLotus = plant.species === "lotus";
        const padSpecs = [
          { ox: 0, oy: 0, rad: (isLotus ? 35 : 30) * s, rot: baseRot + rand() * Math.PI * 2, hasFlower: isLotus },
          { ox: -28 * s, oy: 19 * s, rad: 22 * s, rot: baseRot + rand() * Math.PI * 2, hasFlower: false },
          { ox: 26 * s, oy: -16 * s, rad: 19 * s, rot: baseRot + rand() * Math.PI * 2, hasFlower: false },
        ];

        for (let pIdx = 0; pIdx < padSpecs.length; pIdx++) {
          const spec = padSpecs[pIdx];
          const bobX = Math.sin(elapsed * 0.9 + plant.seed + pIdx) * 1.6;
          const bobY = Math.cos(elapsed * 0.75 + plant.seed + pIdx * 1.4) * 1.6;
          const cx = plant.x + spec.ox + plant.bendX * 0.65 + bobX;
          const cy = plant.y + spec.oy + plant.bendY * 0.65 + bobY;
          const rad = spec.rad;
          const rot = spec.rot + Math.sin(elapsed * 0.45 + plant.seed + pIdx) * 0.04;
          const r = 0.12 + pIdx * 0.025;
          const g = 0.42 + pIdx * 0.03;
          const b = 0.21 + pIdx * 0.015;

          const wedges = 24;
          const notchSpan = 0.46;
          for (let pass = 0; pass < 2; pass++) {
            const isShadow = pass === 0;
            const px = cx + (isShadow ? 22 : 0);
            const py = cy + (isShadow ? 26 : 0);
            const typeFlag = isShadow ? -1 : 2;
            for (let w = 0; w < wedges; w++) {
              const a0 = rot + notchSpan * 0.5 + (w / wedges) * (Math.PI * 2 - notchSpan);
              const a1 = rot + notchSpan * 0.5 + ((w + 1) / wedges) * (Math.PI * 2 - notchSpan);
              pushVert(px, py, 0, 0, r, g, b, typeFlag);
              pushVert(px + Math.cos(a0) * rad, py + Math.sin(a0) * rad, Math.cos(a0 - rot), Math.sin(a0 - rot), r, g, b, typeFlag);
              pushVert(px + Math.cos(a1) * rad, py + Math.sin(a1) * rad, Math.cos(a1 - rot), Math.sin(a1 - rot), r, g, b, typeFlag);
            }
          }

          if (spec.hasFlower) {
            const petals = 10;
            const flowerRad = 13.5 * s;
            for (let k = 0; k < petals; k++) {
              const pAng = rot + (k / petals) * Math.PI * 2;
              const isInner = k % 2 === 1;
              const pLen = flowerRad * (isInner ? 0.72 : 1.0);
              const pWidth = flowerRad * (isInner ? 0.26 : 0.34);
              const perpX = -Math.sin(pAng);
              const perpY = Math.cos(pAng);
              const tipX = cx + Math.cos(pAng) * pLen;
              const tipY = cy + Math.sin(pAng) * pLen;
              const midX = cx + Math.cos(pAng) * pLen * 0.45;
              const midY = cy + Math.sin(pAng) * pLen * 0.45;
              const pr = isInner ? 0.99 : 0.96;
              const pg = isInner ? 0.89 : 0.82;
              const pb = isInner ? 0.66 : 0.68;

              pushVert(cx, cy, 0, 0, pr, pg, pb, 3);
              pushVert(midX - perpX * pWidth, midY - perpY * pWidth, -1, 0.5, pr, pg, pb, 3);
              pushVert(tipX, tipY, 0, 1, pr, pg, pb, 3);

              pushVert(cx, cy, 0, 0, pr, pg, pb, 3);
              pushVert(tipX, tipY, 0, 1, pr, pg, pb, 3);
              pushVert(midX + perpX * pWidth, midY + perpY * pWidth, 1, 0.5, pr, pg, pb, 3);
            }
          }
        }
      }
    }

    const arr = new Float32Array(out);
    if (layer === "floor") {
      this.floorData = arr;
      this.floorCount = arr.length / PLANT_VERTEX_FLOATS;
    } else {
      this.surfaceData = arr;
      this.surfaceCount = arr.length / PLANT_VERTEX_FLOATS;
    }
    return arr;
  }
}
