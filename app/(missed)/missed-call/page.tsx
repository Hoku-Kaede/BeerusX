import type { Metadata } from "next";
import { Hero } from "@/components/missed-call/hero";
import { Marquee } from "@/components/missed-call/marquee";
import { Stats } from "@/components/missed-call/stats";
import { HowItWorks } from "@/components/missed-call/how-it-works";
import { Simulator } from "@/components/missed-call/simulator";
import { Calculator } from "@/components/missed-call/calculator";
import { Pricing } from "@/components/missed-call/pricing";
import { FinalCta } from "@/components/missed-call/final-cta";
import { MissedCallFooter } from "@/components/missed-call/footer";

export const metadata: Metadata = {
  title: "MissedWorth — Missed-call text-back & instant booking",
  description:
    "MissedWorth texts back missed callers within seconds and turns missed calls into booked jobs for solo plumbers, HVAC, roofers, detailers and cleaners.",
};

export default function MissedCallPage() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-mist-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(90% 55% at 50% -12%, rgba(255,106,44,0.13), transparent 60%), radial-gradient(45% 38% at 88% 108%, rgba(44,184,125,0.07), transparent 70%)",
        }}
      />

      <Hero />
      <Marquee />
      <Stats />
      <HowItWorks />
      <Simulator />
      <Calculator />
      <Pricing />
      <FinalCta />
      <MissedCallFooter />
    </div>
  );
}
