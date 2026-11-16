import type { PlacedDecor, Plaque } from "./types";

export type DecorDrawOptions = {
  width: number;
  height: number;
  nightFactor: number;
  elapsed: number;
  decor: readonly PlacedDecor[];
  plaque: Plaque | null;
};

const DECOR_ART_SCALE = 1.45;

export function sanitizePlaque(text: string) {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function drawShadow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#050000";
  ctx.beginPath();
  ctx.ellipse(0, 8 * scale, 46 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawDecor(ctx: CanvasRenderingContext2D, options: DecorDrawOptions) {
  const { width, height, decor, plaque, nightFactor, elapsed } = options;
  ctx.clearRect(0, 0, width, height);

  for (const item of decor) {
    ctx.save();
    ctx.translate(item.nx * width, item.ny * height);
    ctx.rotate(item.rotation);
    // The canvas is authored in CSS pixels for a ~1,400px stage; this keeps a
    // placed piece the same apparent size as a koi rather than a pebble.
    const art = item.scale * DECOR_ART_SCALE;
    ctx.scale(art, art);
    switch (item.kind) {
      case "rocks":
        drawRocks(ctx, width, height, item.scale, nightFactor);
        break;
      case "driftwood":
        drawDriftwood(ctx, width, height, item.scale);
        break;
      case "stone_lantern":
        drawStoneLantern(ctx, width, height, item.scale, elapsed);
        break;
      case "bridge":
        drawBridge(ctx, width, height, item.scale);
        break;
      case "statue":
        drawStatue(ctx, width, height, item.scale);
        break;
      case "torii":
        drawTorii(ctx, width, height, item.scale);
        break;
    }
    ctx.restore();
  }

  if (plaque) drawPlaque(ctx, width, height, plaque, nightFactor);
}

function drawRocks(
  ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number,
  scale: number,
  nightFactor: number,
) {
  drawShadow(ctx, _width, _height, scale);
  // Procedural river stone: layered gradients, cracks, moss. No PNG.
  const stone = ctx.createRadialGradient(-14, -18, 4, 0, 0, 52);
  stone.addColorStop(0, "rgba(150, 120, 92, 0.95)");
  stone.addColorStop(0.45, "rgba(96, 74, 54, 0.95)");
  stone.addColorStop(0.85, "rgba(44, 30, 22, 0.9)");
  stone.addColorStop(1, "rgba(18, 10, 8, 0)");
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.ellipse(0, -4, 46, 28, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // Cracks
  ctx.strokeStyle = "rgba(20, 10, 8, 0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-12, -18);
  ctx.quadraticCurveTo(-4, -6, 8, 4);
  ctx.moveTo(6, -22);
  ctx.quadraticCurveTo(14, -10, 18, 6);
  ctx.stroke();

  // Moss patches
  ctx.fillStyle = "rgba(72, 108, 52, 0.55)";
  ctx.beginPath();
  ctx.ellipse(-18, -14, 16, 9, -0.4, 0, Math.PI * 2);
  ctx.ellipse(12, -8, 12, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();

  if (nightFactor > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = `rgba(6, 2, 10, ${0.5 * nightFactor})`;
    ctx.fillRect(-60, -40, 120, 80);
    ctx.restore();
  }
}

function drawDriftwood(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
) {
  drawShadow(ctx, width, height, scale);
  ctx.lineCap = "round";
  const branches: [number, number, number, number, number, number, number][] = [
    [-32, 2, -6, -16, 22, -8, 7],
    [-4, -6, 14, -26, 40, -16, 5.5],
    [-8, 4, 8, 10, 32, 8, 4.5],
  ];
  for (const [x0, y0, cx, cy, x1, y1, lineWidth] of branches) {
    ctx.strokeStyle = "#4a2c1c";
    ctx.lineWidth = lineWidth * 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(168, 122, 82, 0.55)";
    ctx.lineWidth = lineWidth * 0.45;
    ctx.beginPath();
    ctx.moveTo(x0 + 1, y0 - 1);
    ctx.quadraticCurveTo(cx, cy - 1.5, x1, y1 - 1);
    ctx.stroke();
  }
}

function drawStoneLantern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  elapsed: number,
) {
  drawShadow(ctx, width, height, scale);
  const flicker = 0.9 + 0.1 * Math.sin(elapsed * 5.2);
  const glow = ctx.createRadialGradient(0, -20, 2, 0, -20, 46);
  glow.addColorStop(0, `rgba(255, 186, 96, ${0.5 * flicker})`);
  glow.addColorStop(1, "rgba(255, 160, 60, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-52, -70, 104, 104);

  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  ctx.ellipse(0, 14, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#474139";
  ctx.fillRect(-9, -2, 18, 16);

  ctx.fillStyle = "#4c463d";
  ctx.beginPath();
  ctx.moveTo(-16, -14);
  ctx.lineTo(16, -14);
  ctx.lineTo(19, -6);
  ctx.lineTo(-19, -6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(255, 176, 84, ${0.75 * flicker})`;
  ctx.fillRect(-8, -27, 16, 13);
  ctx.fillStyle = "#433d35";
  for (const side of [-1, 1]) {
    ctx.fillRect(side * 13 - 2, -27, 4, 13);
  }

  ctx.fillStyle = "#514a40";
  ctx.beginPath();
  ctx.moveTo(-24, -29);
  ctx.lineTo(24, -29);
  ctx.lineTo(16, -37);
  ctx.lineTo(0, -40);
  ctx.lineTo(-16, -37);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#332e28";
  ctx.beginPath();
  ctx.arc(0, -41, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawBridge(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
) {
  drawShadow(ctx, width, height, scale);
  const deck = ctx.createLinearGradient(0, -18, 0, 12);
  deck.addColorStop(0, "#7a5233");
  deck.addColorStop(1, "#3c2516");
  ctx.fillStyle = deck;
  ctx.beginPath();
  ctx.moveTo(-62, -6);
  ctx.quadraticCurveTo(0, -24, 62, -6);
  ctx.lineTo(62, 6);
  ctx.quadraticCurveTo(0, -12, -62, 6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(28, 14, 8, 0.55)";
  ctx.lineWidth = 1;
  for (let x = -56; x <= 56; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, -6 + Math.abs(x) * 0.03);
    ctx.lineTo(x, 8 - Math.abs(x) * 0.03);
    ctx.stroke();
  }

  for (const side of [-1, 1]) {
    ctx.strokeStyle = "#8f2218";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-62, -12);
    ctx.quadraticCurveTo(0, -32, 62, -12);
    ctx.stroke();
    ctx.strokeStyle = "#c9a05a";
    ctx.lineWidth = 2;
    for (let x = -56; x <= 56; x += 18) {
      const y = -12 - (1 - Math.abs(x) / 62) * 20;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "#c9a05a";
      ctx.fill();
    }
  }
}

function drawStatue(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
) {
  drawShadow(ctx, width, height, scale);
  ctx.fillStyle = "#3d3a36";
  ctx.beginPath();
  ctx.roundRect(-28, -4, 56, 20, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(201, 160, 90, 0.75)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.strokeStyle = "rgba(201, 160, 90, 0.45)";
  ctx.beginPath();
  ctx.arc(0, -20, 15, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#8a6a34";
  ctx.beginPath();
  ctx.arc(0, -20, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9a05a";
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(5, -22);
  ctx.lineTo(0, -16);
  ctx.lineTo(-5, -22);
  ctx.closePath();
  ctx.fill();
}

function drawTorii(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#050000";
  ctx.beginPath();
  ctx.ellipse(0, 30, 58, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#2a0f0b";
  ctx.fillRect(-34, -20, 9, 48);
  ctx.fillRect(25, -20, 9, 48);
  ctx.fillStyle = "#a52a1c";
  ctx.fillRect(-36, -24, 9, 48);
  ctx.fillRect(27, -24, 9, 48);

  ctx.fillStyle = "#a52a1c";
  ctx.fillRect(-46, -34, 92, 8);
  ctx.fillStyle = "#2a0f0b";
  ctx.fillRect(-46, -26, 92, 3);

  ctx.strokeStyle = "#b4301f";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-58, -48);
  ctx.quadraticCurveTo(0, -62, 58, -48);
  ctx.stroke();
  ctx.strokeStyle = "#230c09";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-58, -52);
  ctx.quadraticCurveTo(0, -66, 58, -52);
  ctx.stroke();

  ctx.fillStyle = "#d6b06a";
  ctx.fillRect(-9, -30, 18, 10);
  ctx.fillStyle = "#5a2c12";
  ctx.fillRect(-6, -28, 12, 2);
}

function drawPlaque(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  plaque: Plaque,
  nightFactor: number,
) {
  const text = sanitizePlaque(plaque.text);
  if (!text) return;
  const font =
    plaque.font === "display"
      ? '600 26px "Bricolage Grotesque", Georgia, serif'
      : plaque.font === "mono"
        ? '500 22px "IBM Plex Mono", ui-monospace, monospace'
        : '500 24px Inter, system-ui, sans-serif';
  ctx.save();
  ctx.font = font;
  const measured = Math.min(width * 0.72, ctx.measureText(text).width + 76);
  const w = Math.max(180, measured);
  const h = 58;
  // Portrait stages put the plaque above the title, clear of the HUD.
  const portrait = height > width * 1.1;
  const cx = width * 0.5;
  const cy = height * (portrait ? 0.27 : 0.17);

  ctx.translate(cx, cy);
  ctx.fillStyle = "rgba(6, 0, 0, 0.34)";
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 4, -h / 2 + 7, w, h, 12);
  ctx.fill();

  ctx.fillStyle = `rgba(18, 2, 2, ${0.62 + nightFactor * 0.18})`;
  ctx.strokeStyle = "rgba(201, 160, 90, 0.72)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(201, 160, 90, 0.8)";
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * (w / 2 - 10), sy * (h / 2 - 10), 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = plaque.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 1);
  ctx.restore();
}
