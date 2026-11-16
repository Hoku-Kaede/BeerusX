import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const strokeDefaults = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8.2 4.9a1 1 0 0 1 1.53-.85l10.1 6.55a1 1 0 0 1 0 1.7L9.73 19l-.02.01a1 1 0 0 1-1.51-.86V4.9Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="6" y="4" width="4.4" height="16" rx="1.2" />
      <rect x="13.6" y="4" width="4.4" height="16" rx="1.2" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="m20 6.5-10.6 11L4 12" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.6 4.6" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M4 7h9M17 7h3M4 17h4M12 17h8" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="10" cy="17" r="2.2" />
    </svg>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M11 5.5 6.5 9H3v6h3.5L11 18.5V5.5Z" />
      <path d="M15 9.2a4 4 0 0 1 0 5.6" />
      <path d="M18 6.5a8 8 0 0 1 0 11" />
    </svg>
  );
}

export function MuteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M11 5.5 6.5 9H3v6h3.5L11 18.5V5.5Z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </svg>
  );
}

export function FullscreenIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="m12 3.6 2.47 5.2 5.53.75-4.06 3.95.99 5.6L12 16.4l-4.93 2.7.99-5.6L4 9.55l5.53-.75L12 3.6Z" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M12 4v11" />
      <path d="m7.5 11 4.5 4.5 4.5-4.5" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

export function BroadcastIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 15.8a5.4 5.4 0 0 0 0-7.6" />
      <path d="M5.3 5.3a9.4 9.4 0 0 0 0 13.4M18.7 18.7a9.4 9.4 0 0 0 0-13.4" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <path d="M4 4h2.2l2.4 11.4a1.4 1.4 0 0 0 1.4 1.2h7.8a1.4 1.4 0 0 0 1.4-1.2L20 8H6" />
      <circle cx="10.5" cy="19.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="19.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.6 7.2c-2.6 0-4.6 1.8-4.6 4.4v.4h-2.4v3.2h2.4V20h3.4v-6.4h2.7l-3.4-3.2h-3v6.4H9.6Zm12.6 0c-2.6 0-4.6 1.8-4.6 4.4v.4h-2.4v3.2h2.4V20h3.4v-6.4h2.7l-3.4-3.2h-3v6.4h3.8v-9.6h-3Z" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} aria-hidden="true" {...props}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
    </svg>
  );
}

export function LogoMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="9" fill="url(#cw-logo-grad)" />
      <path
        d="M13.2 10.1a1 1 0 0 1 1.5-.87l8 5.05a1 1 0 0 1 0 1.72l-8 4.9a1 1 0 0 1-1.52-.86V10.1Z"
        fill="#0a0c11"
      />
      <defs>
        <linearGradient id="cw-logo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#ffb08a" />
          <stop offset="0.55" stopColor="#ff6a2c" />
          <stop offset="1" stopColor="#c23c05" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HeartIcon({ size, ...props }: IconProps & { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} width={size} height={size} aria-hidden="true" {...props}>
      <path d="M12 20.2s-7.2-4.2-9.1-8.4C1.5 8.6 3 5.8 6.2 5.5c1.9-.2 3.5.8 4.4 2 .9-1.2 2.5-2.2 4.4-2 3.2.3 4.7 3.1 3.3 6.3-1.9 4.2-9.1 8.4-9.1 8.4Z" />
    </svg>
  );
}

export function MapPinIcon({ size, ...props }: IconProps & { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} width={size} height={size} aria-hidden="true" {...props}>
      <path d="M12 21s6-5.1 6-10.2A6 6 0 1 0 6 10.8C6 15.9 12 21 12 21Z" />
      <circle cx="12" cy="10.8" r="2.2" />
    </svg>
  );
}

export function ShoppingBagIcon({ size, ...props }: IconProps & { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" {...strokeDefaults} width={size} height={size} aria-hidden="true" {...props}>
      <path d="M6.5 8.5h11l-1 11h-9l-1-11Z" />
      <path d="M9 8.5a3 3 0 0 1 6 0" />
    </svg>
  );
}
