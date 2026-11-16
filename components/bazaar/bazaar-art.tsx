import type { BazaarArt } from "@/lib/bazaar";

type BazaarArtProps = {
  art: BazaarArt;
  className?: string;
  priority?: boolean;
};

/** Generated marketplace artwork: gradient field + accent glow + glyph monogram. Pure SVG, no assets. */
export function BazaarArt({ art, className }: BazaarArtProps) {
  const gid = `bazaar-art-${art.glyph}-${art.from.replace("#", "")}`;
  return (
    <svg
      className={className}
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={art.from} />
          <stop offset="100%" stopColor={art.to} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="0.5" cy="0.38" r="0.75">
          <stop offset="0%" stopColor={art.accent} stopOpacity="0.42" />
          <stop offset="55%" stopColor={art.accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={art.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${gid})`} />
      <rect width="400" height="500" fill={`url(#${gid}-glow)`} />
      <circle cx="330" cy="90" r="150" fill={art.accent} opacity="0.07" />
      <circle cx="40" cy="420" r="120" fill={art.accent} opacity="0.06" />
      <rect x="0" y="0" width="400" height="500" fill="none" stroke="rgba(255,255,255,0.14)" strokeOpacity="0.12" strokeWidth="1" />
      {/* orbit ring */}
      <ellipse cx="200" cy="250" rx="150" ry="96" fill="none" stroke={art.accent} strokeOpacity="0.35" strokeWidth="1.4" strokeDasharray="3 10" />
      <ellipse cx="200" cy="250" rx="118" ry="72" fill="none" stroke={art.accent} strokeOpacity="0.2" strokeWidth="1" strokeDasharray="1.5 8" />
      <text
        x="200"
        y="258"
        textAnchor="middle"
        fontFamily="Bricolage Grotesque Variable, Inter Variable, sans-serif"
        fontWeight="700"
        fontSize="168"
        fill="#fdfaf2"
        fillOpacity="0.92"
      >
        {art.glyph}
      </text>
    </svg>
  );
}
