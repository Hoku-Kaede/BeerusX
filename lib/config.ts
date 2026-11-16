const sonarrUrl = (process.env.SONARR_URL ?? "").trim().replace(/\/+$/, "");
const apiKey = (process.env.SONARR_API_KEY ?? "").trim();

export const config = {
  sonarrUrl,
  apiKey,
  mediaBase: (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").trim(),
  demoReel: "/demo/reel.mp4",
};

export const isLive = Boolean(sonarrUrl && apiKey);

export const appName = "Cinewave";
