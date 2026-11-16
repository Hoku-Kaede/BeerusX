import { BAZAAR_NAME } from "@/lib/bazaar";

export function BazaarLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={BAZAAR_NAME}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="9" fill="#e4572e" />
        <rect x="1" y="1" width="30" height="30" rx="9" stroke="#281c12" strokeOpacity="0.12" strokeWidth="1" />
        <path
          d="M9 22.5 16 8l7 14.5"
          stroke="#f6f1e6"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M12.4 17.6h7.2" stroke="#f6f1e6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-xl font-bold tracking-[-0.02em] text-foreground">
        {BAZAAR_NAME}
      </span>
    </span>
  );
}

export function BazaarWordmark({ className }: { className?: string }) {
  return <span className={className}>Bazaarly</span>;
}
