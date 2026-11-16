import { storePrinciples } from "@/lib/store";

export function StoreStory() {
  return (
    <section id="story" aria-label="Our story" className="animate-fade-up relative w-full">
      <div className="mx-auto w-full max-w-[1680px px-5 py-24 md:px-9 md:py-32">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember-400">
          Our story
        </p>
        <h2 className="mt-4 max-w-3xl font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-mist-50">
          Made properly.
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-mist-400">
          Most gear is designed to be replaced. We design to be kept — then repaired,
          forever.
        </p>

        <div className="mt-14 divide-y divide-white/[0.08]">
          {storePrinciples.map((principle) => (
            <div
              key={principle.index}
              className="group grid gap-4 py-8 md:grid-cols-[72px_1fr] md:gap-8 md:py-10"
            >
              <span className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-mist-600 md:pt-2">
                {principle.index}
              </span>
              <div>
                <h3 className="font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-semibold tracking-tight text-mist-50">
                  {principle.title}
                </h3>
                <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-mist-400">
                  {principle.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
