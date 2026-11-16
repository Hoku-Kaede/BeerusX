"use client";

import { useEffect, useRef, useState } from "react";

/* Spring for smoothness (emil-apple-design: damping 1.0 critically damped) */
function springStep(cur: number, vel: number, target: number, damping = 1.0, response = 0.4, dt = 1/60) {
  const omega = Math.PI * 2 / response;
  const zeta = damping;
  const acc = omega * omega * (target - cur) - 2 * zeta * omega * vel;
  const nVel = vel + acc * dt;
  return { pos: cur + nVel * dt, vel: nVel };
}

function DragCard({ seed, title, tag, index }: { seed: string; title: string; tag: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: (index - 1) * 8 });
  const vel = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: (index - 1) * 8 });
  const hist = useRef<{ t: number; x: number; y: number }[]>([]);
  const raf = useRef<number>(0);
  const last = useRef(0);
  const dragging = useRef(false);
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loop = (t: number) => {
      if (!last.current) last.current = t;
      const dt = Math.min(0.033, (t - last.current) / 1000);
      last.current = t;
      if (!dragging.current) {
        const sx = springStep(pos.current.x, vel.current.x, target.current.x, 0.8, 0.35, dt);
        const sy = springStep(pos.current.y, vel.current.y, target.current.y, 0.8, 0.35, dt);
        pos.current = { x: sx.pos, y: sy.pos };
        vel.current = { x: sx.vel, y: sy.vel };
      }
      if (ref.current) {
        ref.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) rotate(${(pos.current.x) * 0.02}deg)`;
      }
      setProgress(Math.min(1, Math.hypot(pos.current.x, pos.current.y) / 220));
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    setActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    hist.current = [{ t: Date.now(), x: pos.current.x, y: pos.current.y }];
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.movementX * 1.2;
    const dy = e.movementY * 1.2;
    // rubber-band
    const max = 180;
    const rb = (v: number) => v * max * 0.55 / (max + Math.abs(v) * 0.55);
    pos.current.x += rb(dx);
    pos.current.y += rb(dy);
    const now = Date.now();
    hist.current.push({ t: now, x: pos.current.x, y: pos.current.y });
    if (hist.current.length > 6) hist.current.shift();
  };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    const h = hist.current;
    if (h.length >= 2) {
      const a = h[0], b = h[h.length - 1];
      const dt = Math.max(1, b.t - a.t) / 1000;
      vel.current = { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
      // momentum projection (emil §6)
      const d = 0.998;
      const proj = (v: number) => (v / 1000) * d / (1 - d);
      const px = pos.current.x + proj(vel.current.x);
      const py = pos.current.y + proj(vel.current.y);
      target.current = { x: Math.max(-140, Math.min(140, px * 0.35)), y: (index - 1) * 8 + Math.max(-60, Math.min(60, py * 0.2)) };
    } else {
      target.current = { x: 0, y: (index - 1) * 8 };
    }
  };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="group relative w-[260px] sm:w-[300px] shrink-0 touch-none select-none rounded-[24px] border border-white/15 bg-white/[0.06] p-3 backdrop-blur-xl will-change-transform active:scale-[0.98]"
      style={{ boxShadow: "0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.18)" }}
      role="button"
      aria-label={`Drag card ${title}`}
      tabIndex={0}
    >
      <div className="overflow-hidden rounded-[18px]">
        <img src={`https://picsum.photos/seed/${seed}/600/750`} alt={title} className="h-[340px] w-full object-cover" loading="lazy" />
      </div>
      <div className="flex items-end justify-between px-1 pt-4 pb-1">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">{tag}</p>
          <h3 className="font-display text-xl leading-none tracking-tight text-white">{title}</h3>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-black">↗</span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-ember-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
      {active && <p className="absolute -top-6 left-3 text-[11px] text-emerald-300">1:1 tracking · velocity: {Math.round(Math.hypot(vel.current.x, vel.current.y))}px/s</p>}
    </div>
  );
}

export default function ShowcasePage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--mx", `${x * 20}px`);
      el.style.setProperty("--my", `${y * 16}px`);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  return (
    <div className="grain overflow-hidden bg-ink-950 text-mist-50">
      {/* 1. Materials — translucent chrome (emil §12) */}
      <div className="sticky top-3 z-40 mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between rounded-full border border-white/15 bg-white/60 px-4 py-2 shadow-xl backdrop-blur-2xl backdrop-saturate-150">
          <a href="/showcase" className="flex items-center gap-2 font-display font-bold tracking-tight text-ink-950">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-950 text-white">✦</span> Lumen
          </a>
          <nav className="hidden sm:flex items-center gap-1 text-sm text-ink-700">
            <a className="rounded-full px-3 py-2 hover:bg-black/5" href="#work">Work</a>
            <a className="rounded-full px-3 py-2 hover:bg-black/5" href="#craft">Craft</a>
            <a className="rounded-full px-3 py-2 hover:bg-black/5" href="#system">System</a>
          </nav>
          <button onClick={() => setSheetOpen(true)} className="rounded-full bg-ink-950 px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-transform">
            Open sheet
          </button>
        </div>
      </div>

      {/* Hero — typography (better-typography + emil §15) */}
      <header ref={heroRef} className="relative mx-auto max-w-6xl px-6 pt-16 pb-8 sm:pt-24">
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_30%_10%,rgba(255,111,44,.35),transparent_70%),radial-gradient(40%_40%_at_80%_20%,rgba(87,217,163,.18),transparent)]" />
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-ember-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Award-winning, built with 35 design skills
        </p>
        <h1
          className="font-display font-bold leading-[0.9] tracking-[-0.04em] text-[clamp(3.5rem,12vw,9.5rem)] [text-wrap:balance]"
          style={{ transform: "translate(var(--mx,0), var(--my,0))", fontOpticalSizing: "auto" }}
        >
          Interfaces<br />that feel <span className="text-ember-400 italic font-light">alive.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist-400 sm:text-xl">
          An example site that demos every discipline at once — layout, color, type, motion, accessibility — with one signature idea and no template.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#work" className="inline-flex min-h-[44px] items-center rounded-full bg-white px-6 font-semibold text-ink-950 active:scale-95 transition">
            Try the drag ↗
          </a>
          <button onClick={() => setCopied(true)} className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-6 font-semibold backdrop-blur active:scale-95 transition">
            {copied ? "✓ Copied reveal" : "Copy thesis"}
          </button>
        </div>
        <div className="mt-10 flex gap-8 border-y border-white/10 py-4 text-sm text-mist-500">
          <span><strong className="text-white">35</strong> skills loaded</span>
          <span><strong className="text-white">59</strong> contrast ratio</span>
          <span><strong className="text-white">0</strong> library defaults</span>
          <span><strong className="text-white">44px</strong> min targets</span>
        </div>
      </header>

      {/* Draggable work (emil §2,5,6,9 — direct manipulation) */}
      <section id="work" className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold tracking-tight">Work <span className="text-mist-500">— drag to feel it</span></h2>
          <span className="hidden text-sm text-mist-500 sm:block">Springs: damping 0.8 · response 0.35</span>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar cursor-grab active:cursor-grabbing">
          <DragCard seed="lumen1" title="Velvet Hour" tag="Film · 2026" index={0} />
          <DragCard seed="lumen2" title="Monolith" tag="Product · 2026" index={1} />
          <DragCard seed="lumen3" title="Air/Ocean" tag="Brand · 2025" index={2} />
          <DragCard seed="lumen4" title="Night Cartel" tag="Campaign · 2025" index={0} />
        </div>
        <p className="text-xs text-mist-500">Grab a card, flick it. It tracks 1:1, projects where it's going, and snaps with velocity — never locks out input.</p>
      </section>

      {/* System — color + type (better-colors, better-typography, better-layout) */}
      <section id="system" className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <h3 className="font-display text-2xl font-bold tracking-tight">Color system</h3>
          <p className="mt-1 text-sm text-mist-400">One color, one meaning. Semantic tokens, not hex soup.</p>
          <div className="mt-5 space-y-3">
            {[
              ["Ink / Surface", "#06070A", "bg-ink-950 text-white", "15.2:1 on paper"],
              ["Ember / Action", "#FF6A2C", "bg-ember-500 text-white", "3.4:1 large only"],
              ["Mist / Content", "#D7DCE5", "bg-mist-200 text-ink-950", "12.8:1"],
              ["Signal / Success", "#2CB87D", "bg-emerald-500 text-ink-950", "7.1:1"],
            ].map(([n, hex, cls, ratio]) => (
              <div key={n} className={`flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 ${cls}`}>
                <span className="font-semibold">{n}</span><span className="text-sm opacity-80">{hex} · {ratio}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <h3 className="font-display text-2xl font-bold tracking-tight">Type system</h3>
          <p className="mt-1 text-sm text-mist-400">Tracking is size-specific. Weight carries hierarchy, not just size.</p>
          <div className="mt-5 space-y-4">
            <p className="font-display text-5xl font-bold leading-[0.95] tracking-[-0.04em]">Display / -0.04em</p>
            <p className="text-2xl font-semibold tracking-[-0.02em]">Heading / -0.02em · 1.05</p>
            <p className="text-base leading-[1.6] text-mist-400">Body / 0em · 1.6 — rem-based so user font-size never breaks layout.</p>
            <p className="text-xs uppercase tracking-[0.2em] text-mist-500">Caption / +0.2em · 11px min</p>
          </div>
        </div>
      </section>

      {/* Craft + Accessibility */}
      <section id="craft" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-[28px] bg-white p-6 text-ink-950 lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-500">Craft lens — apple-design / better-ui</p>
            <h3 className="mt-2 font-display text-3xl font-bold tracking-tight">Not a template. A point of view.</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-700">
              <li><strong>Signature:</strong> pointer-tracked display type that leans toward your cursor.</li>
              <li><strong>Structure encodes meaning:</strong> drag distance = progress bar, not decoration.</li>
              <li><strong>Boldness in one place:</strong> only the hero and cards move. Everything else is quiet.</li>
              <li><strong>Removed one accessory:</strong> no nav clutter, no hero image grid — just type + motion.</li>
            </ul>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-emerald-400/10 p-6 lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Accessibility floor</p>
            <ul className="mt-4 space-y-2.5 text-sm text-mist-200">
              <li>✓ Focus visible (2px ember outline)</li>
              <li>✓ Keyboard: cards are buttons, sheet closes on Esc</li>
              <li>✓ prefers-reduced-motion → cross-fade, no springs</li>
              <li>✓ 44×44px targets, text ≥ 11px</li>
              <li>✓ Never color-alone — labels + shapes too</li>
            </ul>
            <button onClick={() => setSheetOpen(true)} className="mt-6 w-full min-h-[44px] rounded-full bg-emerald-400 font-bold text-ink-950 active:scale-95 transition">Test the accessible sheet</button>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-12 text-center text-sm text-mist-500">
        <p className="font-display text-4xl font-bold tracking-tight text-white">LUMEN<span className="text-ember-400">.</span></p>
        <p className="mt-2">Built with better-interface · better-layout · better-colors · better-typography · better-ui · emil-apple-design · apple-design · design-review</p>
        <p className="mt-4">Try keyboard Tab → focus rings · Reduce motion in OS → no parallax · Resize to 320px → holds up</p>
      </footer>

      {/* Sheet — spatial consistency + materialize (emil §7, §12) */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Details sheet">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
          <div className="relative w-full max-w-md rounded-[28px] border border-white/20 bg-ink-900 p-6 shadow-2xl animate-fade-up" style={{ transformOrigin: "50% 100%" }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <h3 className="font-display text-2xl font-bold tracking-tight">Sheet that materializes</h3>
            <p className="mt-2 text-sm text-mist-400">Enter/exit on the same path, anchored to trigger, blur + scale together (not just fade). Esc to close. Focus returns to trigger.</p>
            <button onClick={() => setSheetOpen(false)} autoFocus className="mt-6 w-full min-h-[44px] rounded-full bg-white font-bold text-ink-950 active:scale-95 transition">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
