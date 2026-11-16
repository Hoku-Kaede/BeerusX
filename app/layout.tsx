import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { LayoutChrome } from "@/components/layout-chrome";

export const metadata: Metadata = {
  title: {
    default: "Bazaarly — the marketplace for everyday objects",
    template: `%s · Bazaarly`,
  },
  description:
    "Bazaarly is a marketplace for the objects that carry your life. Gear, homeware, kitchen, fashion, beauty, sports, books and toys — thoughtfully sourced, honestly priced, delivered fast.",
  applicationName: "Bazaarly",
  keywords: [
    "Bazaarly",
    "marketplace",
    "everyday objects",
    "home goods",
    "kitchen",
    "gear",
    "outdoor",
    "fashion",
  ],
  openGraph: {
    title: "Bazaarly — the marketplace for everyday objects",
    description:
      "The marketplace for the objects that carry your life. Shop gear, homeware, kitchen, fashion, beauty, sports, books and toys.",
    type: "website",
    siteName: "Bazaarly",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bazaarly — the marketplace for everyday objects",
    description:
      "The marketplace for the objects that carry your life. Gear, homeware, kitchen, fashion, beauty, sports, books and toys.",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#171009" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-foreground font-sans antialiased select-none">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  document.addEventListener('contextmenu', function(e){ e.preventDefault(); });
                  document.addEventListener('keydown', function(e){
                    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key==='I'||e.key==='J'||e.key==='C')) || (e.ctrlKey && e.key==='U')) {
                      e.preventDefault();
                    }
                  });
                } catch(e){}
              })();
            `,
          }}
        />
        <script
          id="bazaar-theme-init"
          dangerouslySetInnerHTML={{
            __html: `
          (function () {
            try {
              var stored = window.localStorage.getItem("bazaar-theme");
              var theme = stored === "dark" || stored === "light" ? stored : "light";
              var root = document.documentElement;
              root.classList.remove("light", "dark");
              root.classList.add(theme);
              root.style.colorScheme = theme;
            } catch (e) {
              document.documentElement.classList.add("light");
            }
          })();
        `,
          }}
        />
        <LayoutChrome>{children}</LayoutChrome>
      </body>
    </html>
  );
}
