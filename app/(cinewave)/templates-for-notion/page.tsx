"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, Bookmark, Check, Clock, CreditCard,
  Crown, ExternalLink, Eye, Heart, Layers, Lock, Mail, MousePointerClick,
  Quote, ShieldCheck, Sparkles, Star, TrendingUp, Zap, Camera, Video, Music2, AtSign
} from "lucide-react";

/* subtle spring reveal (emil-apple-design: damping 1.0, response 0.4) */
function useReveal<T extends HTMLElement>(deps: any[] = []) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { ref, visible };
}

const BUNDLES = [
  { id: "Personal", count: 9, tone: "bg-emerald-50 text-emerald-900 border-emerald-200", items: ["Life HQ (habits + goals)", "Second Brain", "Travel Planner", "Home Dashboard", "Fitness Tracker", "Budget OS", "Journal System", "Reading Tracker", "Weekly Review"] },
  { id: "Freelance", count: 9, tone: "bg-violet-50 text-violet-900 border-violet-200", items: ["Client CRM", "Project OS", "Invoice + Contract Kit", "Content Pipeline", "Lead Tracker", "Time Billing", "Proposal Library", "Collab Hub", "Retainer OS"] },
  { id: "Startup", count: 8, tone: "bg-orange-50 text-orange-900 border-orange-200", items: ["Startup OS", "Investor CRM", "Hiring Pipeline", "Roadmap Board", "OKR System", "Launch Checklist", "Founder Dashboard", "Pitch Library"] },
];

const ASSETS = [
  "26 Notion templates (14 premium, 12 free lead magnets)",
  "3 domains + fully localized website (English + French)",
  "Email list — 41k total · 14,223 active",
  "Social accounts — TikTok · YouTube · Instagram · Pinterest",
  "Sponsorship relationships + affiliate partnerships",
  "All automations, product mockups, marketing assets, video content",
  "Full IP rights — brand, website, and products",
  "Domain, source code, all related data, email account, design work",
];

export default function TemplatesForNotionPage() {
  const [bundle, setBundle] = useState(BUNDLES[0]);
  const [faqOpen, setFaqOpen] = useState(0);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState("");
  const hero = useReveal<HTMLDivElement>();
  const nums = useReveal<HTMLDivElement>();
  const assets = useReveal<HTMLDivElement>();

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#14213D]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-black focus:px-4 focus:py-2 focus:text-white">Skip to content</a>

      {/* Nav — translucent material (emil §12) */}
      <header className="sticky top-3 z-50 mx-auto max-w-6xl px-3">
        <div className="flex items-center justify-between rounded-full border border-black/10 bg-white/70 px-4 py-2 shadow-lg backdrop-blur-2xl backdrop-saturate-150">
          <a href="/templates-for-notion" className="flex items-center gap-2 font-display font-bold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-black text-white"><Layers className="h-4 w-4" /></span>
            Templates For Notion
            <span className="hidden rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white sm:inline">🎉 Sold</span>
          </a>
          <nav className="hidden items-center gap-1 text-sm font-medium text-black/70 md:flex" aria-label="Page">
            <a href="#story" className="rounded-full px-3 py-2 hover:bg-black/5">Story</a>
            <a href="#templates" className="rounded-full px-3 py-2 hover:bg-black/5">Templates</a>
            <a href="#numbers" className="rounded-full px-3 py-2 hover:bg-black/5">Numbers</a>
            <a href="#assets" className="rounded-full px-3 py-2 hover:bg-black/5">Assets</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast("Visit live site (mock) — templates4notion.com")} className="hidden min-h-[40px] items-center gap-1.5 rounded-full px-3 text-sm font-semibold hover:bg-black/5 sm:inline-flex">
              Live site <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => showToast("Make an offer — $60,000 (mock)")} className="min-h-[40px] rounded-full bg-black px-4 text-sm font-bold text-white active:scale-95 transition">Make Offer · $60k</button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* HERO */}
        <section ref={hero.ref} className={`pt-14 pb-10 sm:pt-20 transition-all duration-700 ${hero.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-black/50">
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-white">€28k / year</span>
            <span>85% profit margin</span>·<span>1,000+ paying customers</span>·<span>Posted Oct 5, 2025</span>
          </p>
          <h1 className="font-display text-[clamp(3rem,9vw,6.5rem)] font-bold leading-[0.9] tracking-[-0.04em] [text-wrap:balance]" style={{ fontOpticalSizing: "auto" }}>
            26 templates.<br />41,000 subscribers.<br /><span className="text-orange-600 italic font-light">€27k at 85% margin.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-black/70">
            Premium Notion templates + newsletter for <strong>startups, freelancers and students</strong>. Built by a Notion Certified Consultant, sold via Gumroad, grown with SEO + free templates — CAC under <strong>€1</strong>.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-xl">
              <img src="https://cdn.sideprojectors.com/production/194886/66687/screenshot-2025-09-30-at-154415-1759239900.jpg" alt="Templates For Notion homepage" className="h-72 w-full object-cover sm:h-96" loading="eager" />
              <div className="flex flex-wrap items-center gap-3 border-t border-black/10 bg-white px-5 py-4 text-sm">
                <a href="https://templates4notion.com" target="_blank" rel="noreferrer" className="flex min-h-[44px] items-center gap-1.5 font-bold text-blue-700 hover:underline"><ExternalLink className="h-4 w-4" /> templates4notion.com</a>
                <span className="text-black/50">Webflow + Gumroad + Beehiiv</span>
                <span className="ml-auto flex items-center gap-1.5 text-black/60"><Eye className="h-4 w-4" /> 21k pageviews/mo</span>
              </div>
            </div>

            {/* Price card — sticky */}
            <aside className="h-fit rounded-[28px] border border-black/10 bg-white p-6 shadow-xl" aria-label="Sale details">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white">🎉 Sold!</span>
                <span className="flex items-center gap-1.5 text-sm text-black/60"><Clock className="h-4 w-4" /> {`<`} 2h / week</span>
              </div>
              <p className="mt-5 font-display text-5xl font-bold tracking-tight">$60,000</p>
              <p className="mt-1 text-sm text-black/60">Advertised price · Negotiable · Revenue $1k–$5k/mo</p>
              <div className="mt-5 space-y-2.5 text-sm">
                <p className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-blue-600" /> 1,000 paid · 50,000+ free users</p>
                <p className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> CAC &lt; €1 · 50.5% open rate</p>
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> ROI &lt; 4 yrs, 12–18 mo optimized</p>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => showToast("Offer sent — $60,000 (mock)")} className="min-h-[48px] flex-1 rounded-full bg-black font-bold text-white active:scale-95 transition">Make Offer</button>
                <button onClick={() => setLiked(!liked)} aria-pressed={liked} aria-label="Like this project" className={`grid h-12 w-12 place-items-center rounded-full border active:scale-90 transition ${liked ? "bg-rose-500 text-white border-rose-500" : "border-black/15"}`}>
                  <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                </button>
                <button onClick={() => showToast("Saved to collection (mock)")} aria-label="Save to collection" className="grid h-12 w-12 place-items-center rounded-full border border-black/15 active:scale-90 transition"><Bookmark className="h-5 w-5" /></button>
              </div>
              <p className="mt-4 text-center text-xs text-black/50">Buyer next: <strong>Social Media · Ads</strong> — untapped</p>
            </aside>
          </div>

          {/* Social proof bar */}
          <dl className="mt-8 grid grid-cols-2 gap-3 rounded-[24px] border border-black/10 bg-white/60 p-4 backdrop-blur sm:grid-cols-4">
            {[
              ["€27,208", "2024 revenue"],
              ["~85–94%", "profit margin"],
              ["41,000", "email subscribers"],
              ["3.3% CTR", "50.5% open rate"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-black/[0.03] p-4 text-center">
                <dt className="order-2 mt-1 block text-xs text-black/55">{l}</dt>
                <dd className="font-display text-2xl font-bold tracking-tight">{n}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* STORY */}
        <section id="story" className="py-12">
          <h2 className="font-display text-3xl font-bold tracking-tight">Startup description</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5 rounded-[28px] border border-black/10 bg-white p-6 leading-relaxed text-black/75 sm:p-8">
              <p>This business sells <strong>premium Notion templates</strong> for productivity, organization, and business workflows. Over the past <strong>2+ years</strong>, I've created and sold <strong>26 templates (14 paid, 12 free)</strong>, organized into thematic bundles like <em>Personal, Freelance, and Startup.</em></p>
              <p>It started as a side project during my work as a <strong>Notion Certified Consultant</strong>. After helping clients build custom workspaces, I realized there was a scalable opportunity in turning these systems into standalone products that could help more people.</p>
              <p>Templates are hosted on <strong>Webflow</strong>, transactions are handled through <strong>Gumroad</strong>, and are supported by automations and a growing newsletter. The business also monetizes via <strong>newsletter/blog sponsorships and affiliate revenue</strong>.</p>
              <blockquote className="border-l-4 border-orange-500 pl-4 italic text-black/80">
                <Quote className="mb-1 h-4 w-4 text-orange-600" />
                “Not tied to me. A buyer can run this solo in under 2 hours a week — every process is documented.”
                <footer className="mt-1 text-sm not-italic text-black/55">— James ✌️, Notion Certified Consultant</footer>
              </blockquote>
              <h3 className="pt-2 font-display text-xl font-bold text-black">Team — solo founder</h3>
              <p>I handle product creation, customer support, newsletter writing, automation setup, and website maintenance. All processes are documented, and automations keep the required workload <strong>under 2 hours per week</strong>.</p>
            </div>
            <aside className="space-y-4">
              <div className="rounded-[28px] border border-black/10 bg-white p-6">
                <h3 className="font-display font-bold">Project owner</h3>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 font-display text-lg font-bold text-white">J</span>
                  <div>
                    <p className="flex items-center gap-1.5 font-bold">James ✌️ <BadgeCheck className="h-4 w-4 text-blue-600" /></p>
                    <p className="text-sm text-black/55">Notion Certified Consultant · Joined Nov 2026</p>
                  </div>
                </div>
                <a href="https://templates4notion.com" target="_blank" rel="noreferrer" className="mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-black/15 font-semibold active:scale-95 transition">Visit live site <ArrowUpRight className="h-4 w-4" /></a>
                <div className="mt-3 flex gap-2">
                  {["Instagram", "YouTube", "TikTok"].map(s => (
                    <a key={s} href="#" onClick={e => { e.preventDefault(); showToast(`${s} (mock)`); }} className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full bg-black/5 text-sm font-semibold hover:bg-black/10">
                      {s === "Instagram" ? <Camera className="h-4 w-4" /> : s === "YouTube" ? <Video className="h-4 w-4" /> : <Music2 className="h-4 w-4" />} {s}
                    </a>
                  ))}
                </div>
              </div>
              <div className="rounded-[28px] bg-black p-6 text-white">
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/60"><Sparkles className="h-4 w-4" /> Why sell</p>
                <p className="mt-2 font-display text-2xl font-bold leading-tight">“I’m busy with other things and no longer have time to maintain this project.”</p>
                <p className="mt-2 text-sm text-white/60">Branding isn't tied to the founder — handover is smooth and low-risk.</p>
              </div>
            </aside>
          </div>
        </section>

        {/* TEMPLATES */}
        <section id="templates" className="py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold tracking-tight">26 templates · 3 bundles</h2>
            <p className="text-sm text-black/60">14 premium · 12 free lead magnets</p>
          </div>
          <div className="mt-5 flex gap-2" role="tablist" aria-label="Template bundles">
            {BUNDLES.map(b => (
              <button key={b.id} role="tab" aria-selected={bundle.id === b.id} onClick={() => setBundle(b)}
                className={`min-h-[44px] rounded-full px-5 font-bold transition active:scale-95 ${bundle.id === b.id ? "bg-black text-white" : "border border-black/15 hover:bg-black/5"}`}>
                {b.id} <span className="opacity-60">· {b.count}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-[28px] border border-black/10 bg-white p-6">
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bundle.items.map((t, i) => (
                <li key={t} className={`rounded-2xl border p-4 ${bundle.tone}`}>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">{bundle.id} · #{String(i + 1).padStart(2, "0")}</p>
                  <p className="mt-1 font-display text-lg font-bold leading-tight">{t}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 text-sm text-black/60"><MousePointerClick className="h-4 w-4" /> Free templates act as lead magnets → email → repeat sales. No paid ads run yet.</p>
          </div>
        </section>

        {/* NUMBERS */}
        <section id="numbers" ref={nums.ref} className="py-10">
          <h2 className="font-display text-3xl font-bold tracking-tight">Revenue & profit</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-black/10 bg-white p-6">
              <h3 className="font-display font-bold">2024 vs 2025 (Jan–Sep)</h3>
              <div className="mt-5 space-y-5">
                {[
                  { label: "2024 Full year", value: 27208, pct: 100, note: "€25,500 profit · ~94% margin" },
                  { label: "2025 Jan–Sep", value: 15937, pct: 59, note: "Ahead of last year's pace · ~80% margin" },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold">{r.label}</span>
                      <strong>€{r.value.toLocaleString()}</strong>
                    </div>
                    <div className="mt-2 h-4 overflow-hidden rounded-full bg-black/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-orange-500 transition-all duration-1000" style={{ width: nums.visible ? `${r.pct}%` : "0%" }} />
                    </div>
                    <p className="mt-1 text-xs text-black/55">{r.note}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-1.5 text-sm text-black/70">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Sponsorships ~€6,300 last 12 months (newsletter ~€3,150)</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Affiliate revenue growing steadily</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> CAC &lt; €1 — SEO + free templates, zero ads</li>
              </ul>
            </div>
            <div className="space-y-6">
              <div className="rounded-[28px] border border-black/10 bg-white p-6">
                <h3 className="flex items-center gap-2 font-display font-bold"><Mail className="h-4 w-4 text-blue-600" /> Email engine</h3>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[["41k", "Total subs"], ["14,223", "Active"], ["50.5%", "Open rate"]].map(([n, l]) => (
                    <div key={l} className="rounded-2xl bg-black/[0.04] p-4"><p className="font-display text-2xl font-bold">{n}</p><p className="text-xs text-black/55">{l}</p></div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-black/65">21,000 monthly pageviews · 48% bounce · 37s engagement. Strong repeat-sale channel.</p>
              </div>
              <div className="rounded-[28px] border border-black/10 bg-white p-6">
                <h3 className="font-display font-bold">How a buyer takes it further</h3>
                <ul className="mt-3 space-y-2.5 text-sm text-black/70">
                  <li className="flex gap-2"><Zap className="h-4 w-4 shrink-0 text-orange-600" /> <span><strong>Social Media</strong> — TikTok / YouTube / Instagram lightly used, clear upside</span></li>
                  <li className="flex gap-2"><Zap className="h-4 w-4 shrink-0 text-orange-600" /> <span><strong>Ads</strong> — none run to date; email list gives cheap retargeting</span></li>
                  <li className="flex gap-2"><Zap className="h-4 w-4 shrink-0 text-orange-600" /> <span><strong>Bundling / memberships / mini-courses</strong> — recurring revenue from one-time base</span></li>
                </ul>
                <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">ROI: <strong>&lt; 4 years</strong> as-is · <strong>12–18 months</strong> with modest optimization.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TECH + ASSETS */}
        <section id="assets" ref={assets.ref} className={`py-10 transition-all duration-700 ${assets.visible ? "opacity-100" : "opacity-0 translate-y-6"}`}>
          <h2 className="font-display text-3xl font-bold tracking-tight">Tech stack & assets included</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-black/10 bg-white p-6">
              <h3 className="font-display font-bold">How it was built</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-black/5 pb-2"><dt className="text-black/55">Frameworks</dt><dd className="font-semibold">Webflow</dd></div>
                <div className="flex justify-between border-b border-black/5 pb-2"><dt className="text-black/55">Third-party / SaaS</dt><dd className="font-semibold">Notion · Make · Gumroad</dd></div>
                <div className="flex justify-between border-b border-black/5 pb-2"><dt className="text-black/55">Plus</dt><dd className="font-semibold text-right">Beehiiv · Google Workspace<br />Senja · Namecheap</dd></div>
                <div className="flex justify-between"><dt className="text-black/55">Traffic</dt><dd className="font-semibold">5k–10k uniques/mo</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Webflow", "Notion", "Make.com", "Beehiiv", "Gumroad", "Senja", "Namecheap"].map(t => (
                  <span key={t} className="rounded-full border border-black/15 px-3 py-1.5 text-sm font-semibold">{t}</span>
                ))}
              </div>
              <img src="https://cdn.sideprojectors.com/production/194886/66687/screenshot-2025-09-30-at-154737-1759240066.png" alt="Template detail screenshot" className="mt-5 h-52 w-full rounded-2xl border object-cover" loading="lazy" />
            </div>
            <div className="rounded-[28px] border border-black/10 bg-white p-6">
              <h3 className="flex items-center gap-2 font-display font-bold"><Crown className="h-4 w-4 text-orange-600" /> One-time handover, full IP</h3>
              <ul className="mt-4 space-y-2.5">
                {ASSETS.map(a => (
                  <li key={a} className="flex gap-2.5 text-sm text-black/75">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3" /></span>
                    {a}
                  </li>
                ))}
              </ul>
              <a href="https://www.sideprojectors.com/project/66687/templates-for-notion" target="_blank" rel="noreferrer" className="mt-4 flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">More info: ramesquinerie.notion.site/templates4notion-sale <ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
          </div>
        </section>

        {/* RISKS */}
        <section className="py-10">
          <h2 className="font-display text-3xl font-bold tracking-tight">Risks & mitigation</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Platform risk", "Dependent on Notion’s popularity.", "Notion is still growing globally. Templates live on Webflow/Gumroad — portable if needed."],
              ["Revenue type", "One-time sales only.", "Add bundling, memberships, or mini-courses → recurring revenue. Audience is already warm."],
              ["Founder risk", "Solo founder, personal brand.", "Branding isn't tied to James. Automations + docs = smooth handover in days, not months."],
            ].map(([t, risk, fix]) => (
              <article key={t} className="rounded-[24px] border border-black/10 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">{t}</p>
                <p className="mt-2 font-display text-xl font-bold leading-tight">{risk}</p>
                <p className="mt-2 text-sm leading-relaxed text-black/65">{fix}</p>
              </article>
            ))}
          </div>

          {/* FAQ — labels that say what happens (better-writing) */}
          <div className="mt-8 rounded-[28px] border border-black/10 bg-white p-6">
            <h3 className="font-display font-bold">Instant answers</h3>
            <div className="mt-4 divide-y divide-black/8">
              {[
                ["What exactly do I get for $60k?", "26 templates + 3 domains + EN/FR site + 41k email list + socials + sponsorship/affiliate relationships + all automations, mockups, marketing assets, video content + full IP."],
                ["How much work per week?", "Under 2 hours — solo founder, documented processes, Make automations, outsourced support pattern."],
                ["How does it make money?", "Gumroad template sales + Beehiiv sponsorships (~€3,150/yr) + affiliates. Large sponsorship line is shared as €6,300 over 12 months including blog."],
                ["Why is CAC under €1?", "SEO long-tail + 12 free templates as lead magnets. No paid ads have been run — that's the buyer's upside."],
              ].map(([q, a], i) => (
                <div key={q}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} aria-expanded={faqOpen === i} className="flex min-h-[52px] w-full items-center justify-between gap-4 text-left font-semibold">
                    {q} <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5">{faqOpen === i ? "−" : "+"}</span>
                  </button>
                  {faqOpen === i && <p className="pb-4 text-sm leading-relaxed text-black/65">{a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-black/50">Low-workload · High-margin · Digital</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">€28k a year. 85% margin.<br />1,000 paying customers.</h2>
          <p className="mx-auto mt-4 max-w-xl text-black/65">Sold at $60,000 on SideProjectors. This page is a demo rebuild from the real listing description — all numbers, assets, and risks as published.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button onClick={() => showToast("Offer sent (mock) — templates4notion.com")} className="min-h-[52px] rounded-full bg-black px-8 font-bold text-white active:scale-95 transition">Make an Offer · $60k</button>
            <a href="https://templates4notion.com" target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-black/20 px-8 font-bold active:scale-95 transition">Visit live site <ArrowUpRight className="h-4 w-4" /></a>
          </div>
          <p className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-black/50">
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 1,000+ paid customers</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Full IP transfer</span>
            <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Gumroad + Beehiiv billing</span>
          </p>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-black/55 sm:px-6">
          <p className="font-display font-bold text-black">Templates For Notion <span className="text-orange-600">·</span> Demo rebuild</p>
          <p>Source: sideprojectors.com/project/66687 · Live: templates4notion.com</p>
          <p className="flex items-center gap-1.5"><AtSign className="h-4 w-4" /> @templates4notion</p>
        </div>
      </footer>

      <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
        {toast && <div className="animate-fade-up rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-2xl">{toast}</div>}
      </div>
    </div>
  );
}
