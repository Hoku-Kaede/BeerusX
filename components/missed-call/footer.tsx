import { LogoMark } from "@/components/icons";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#demo", label: "Live demo" },
  { href: "#calculator", label: "Calculator" },
  { href: "#pricing", label: "Pricing" },
];

export function MissedCallFooter() {
  return (
    <footer className="relative mt-10 border-t border-white/[0.06] bg-ink-950">
      <div className="mx-auto w-full max-w-[1680px] px-5 py-14 md:px-9">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-8" />
              <span className="font-display text-[19px] font-semibold tracking-tight text-mist-50">
                MissedWorth<span className="text-ember-500">.</span>
              </span>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-mist-500">
              Missed-call text-back and instant booking for solo plumbers, HVAC, roofers, detailers
              and cleaners.
            </p>
          </div>

          <nav aria-label="MissedWorth sections" className="flex flex-wrap gap-x-8 gap-y-3">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-[13px] text-mist-400 transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 border-t border-white/[0.06] pt-6 text-[11.5px] leading-relaxed text-mist-600">
          <p>
            Pilot build — missed-call texting live on test numbers (+91 730674947). US launch in
            progress: A2P 10DLC registration and Twilio SMS to US numbers.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} MissedWorth. Built for solo operators with one to five trucks.
          </p>
        </div>
      </div>
    </footer>
  );
}
