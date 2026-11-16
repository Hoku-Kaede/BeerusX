import { storeMarqueeItems } from "@/lib/store";

export function StoreMarquee() {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {storeMarqueeItems.map((item) => (
        <span
          key={`${key}-${item}`}
          className="flex items-center gap-10 pr-10 font-display text-[15px] font-semibold uppercase tracking-[0.22em] text-mist-500"
        >
          {item}
          <span aria-hidden="true" className="size-[5px] rounded-full bg-ember-500" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="marquee bg-ink-900 border-y border-white/[0.06]"
      aria-label="Store highlights"
    >
      <div className="marquee__track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
