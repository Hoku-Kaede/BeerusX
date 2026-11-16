import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  align?: "center" | "left";
};

export function SectionHeading({ eyebrow, title, sub, align = "center" }: SectionHeadingProps) {
  return (
    <Reveal className={`mx-auto max-w-2xl ${align === "center" ? "text-center" : "text-left"}`}>
      <p className="in-soft text-[11px] font-semibold uppercase tracking-[0.22em] text-ember-300">
        {eyebrow}
      </p>
      <h2
        className="mt-5 font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-bold leading-[0.98] tracking-[-0.035em] text-white"
        style={{ animationDelay: "0.15s" }}
      >
        <span className="mask-line" style={{ "--d": "0.15s" } as CSSProperties}>
          <span>{title}</span>
        </span>
      </h2>
      {sub ? (
        <p className="in-soft mt-6 text-[15px] leading-relaxed text-mist-400" style={{ "--d": "0.45s" } as CSSProperties}>
          {sub}
        </p>
      ) : null}
    </Reveal>
  );
}
