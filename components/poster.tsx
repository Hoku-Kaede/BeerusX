"use client";

import { useState } from "react";
import { hashString } from "@/lib/media";

export function posterPalette(title: string) {
  const hash = hashString(title);
  const hue = hash % 360;
  return {
    hue,
    background: `radial-gradient(120% 92% at 16% 6%, hsl(${hue} 58% 34% / 0.95), transparent 62%),
      radial-gradient(110% 85% at 88% 104%, hsl(${(hue + 52) % 360} 72% 30% / 0.9), transparent 58%),
      linear-gradient(163deg, hsl(${hue} 36% 18%) 0%, #0a0c11 68%, #06070a 100%)`,
  };
}

export function backdropPalette(title: string) {
  const hash = hashString(title);
  const hue = hash % 360;
  return `radial-gradient(90% 120% at 78% 12%, hsl(${hue} 62% 30% / 0.75), transparent 60%),
    radial-gradient(80% 90% at 12% 88%, hsl(${(hue + 70) % 360} 66% 22% / 0.6), transparent 62%),
    linear-gradient(180deg, #0a0c11 0%, #06070a 100%)`;
}

type PosterProps = {
  title: string;
  year?: number;
  network?: string;
  src?: string;
  className?: string;
  showText?: boolean;
};

/**
 * Renders real Sonarr artwork when available, otherwise deterministic
 * generated cover art (demo mode) so the grid never shows broken images.
 */
export function Poster({
  title,
  year,
  network,
  src,
  className = "",
  showText = true,
}: PosterProps) {
  const [failed, setFailed] = useState(false);
  const palette = posterPalette(title);
  const initial = title.trim().charAt(0).toUpperCase() || "C";

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${title} poster`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background: palette.background }}
      role="img"
      aria-label={`${title} cover art`}
    >
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(118deg, transparent 0 19px, rgba(255,255,255,0.11) 19px 20px)",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute -right-3 -top-8 select-none font-display text-[7.5rem] font-extrabold leading-none text-white/[0.075]"
      >
        {initial}
      </span>
      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
      {showText && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-3.5 pb-3.5 pt-10">
          <p className="font-display text-[15px] font-semibold leading-tight tracking-tight text-white">
            {title}
          </p>
          <p className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.16em] text-white/55">
            {[network, year].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
