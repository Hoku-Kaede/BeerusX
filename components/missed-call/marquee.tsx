"use client";

const SERVICES = [
  "Plumbers",
  "HVAC",
  "Roofers",
  "Detailers",
  "Cleaners",
];

export function Marquee() {
  return (
    <div className="marquee border-y border-white/[0.06] py-6">
      <div className="marquee__track">
        {[0, 1].map((group) => (
          <div key={group} className="flex shrink-0 items-center" aria-hidden={group === 1}>
            {SERVICES.map((service) => (
              <span key={`${group}-${service}`} className="flex items-center">
                <span className="whitespace-nowrap px-8 font-display text-2xl font-bold uppercase tracking-[0.02em] text-white/80 md:text-3xl">
                  {service}
                </span>
                <span className="size-2 rounded-full bg-ember-500/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
