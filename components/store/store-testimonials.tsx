import { QuoteIcon } from "@/components/icons";
import { testimonials } from "@/lib/store";

export function StoreTestimonials() {
  return (
    <section aria-label="Field reviews" className="w-full">
      <div className="mx-auto w-full max-w-[1680px px-5 py-24 md:px-9 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember-400">
              Field reviews
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.035em] text-mist-50">
              Riders talk.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mist-400">
              Real people, real trips, real gear. Unedited opinions from the people who
              actually carry it.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col gap-6 rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7 md:p-8"
              >
                <QuoteIcon className="size-6 text-ember-400" />
                <blockquote className="font-display text-[19px] font-medium leading-[1.35] tracking-tight text-mist-50">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-auto text-[12px] text-mist-500">
                  <span className="block font-semibold text-mist-300">{t.name}</span>
                  {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
