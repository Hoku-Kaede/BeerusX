import { storeStats } from "@/lib/store";

export function StoreStats() {
  return (
    <section aria-label="Store numbers" className="w-full border-y border-white/[0.06] bg-ink-900">
      <div className="mx-auto grid w-full max-w-[1680px grid-cols-2 gap-px px-5 md:grid-cols-4 md:px-9">
        {storeStats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col justify-center gap-2 px-6 py-12 md:px-10 md:py-14"
          >
            <p className="font-display text-[clamp(2.6rem,5vw,4rem)] font-semibold leading-none tracking-[-0.04em] text-mist-50">
              {stat.value}
            </p>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-mist-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
