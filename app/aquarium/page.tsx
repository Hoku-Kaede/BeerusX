import type { Metadata, Viewport } from "next";
import { AquariumExperience } from "@/components/aquarium/aquarium-experience";
import "./aquarium.css";

const description =
  "KYOKO — an interactive crimson water garden. Three koi from an original Figma composition, set in motion as a living school of twenty-bone rigs. Move to part the water; tap to scatter.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    absolute: "KYOKO — a living koi pond",
  },
  description,
  applicationName: "KYOKO",
  keywords: ["koi", "interactive aquarium", "generative art", "WebGL", "Figma", "water"],
  openGraph: {
    title: "KYOKO — a living koi pond",
    description,
    type: "website",
    siteName: "KYOKO",
    locale: "en_US",
    images: [
      {
        url: "/aquarium/og.jpg",
        width: 1200,
        height: 630,
        alt: "The KYOKO lettering drifting through a crimson interactive pond with three koi.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KYOKO — a living koi pond",
    description,
    images: ["/aquarium/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#180000",
};

export default function AquariumPage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/aquarium/title-kyoko.webp"
        fetchPriority="high"
      />
      <AquariumExperience />
    </>
  );
}
