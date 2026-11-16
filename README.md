# BeerusX

A cinematic streaming front-end for your Sonarr library — plus a handful of side experiments that live in the same Next.js app.

BeerusX reads your Sonarr library server-side (API key never reaches the browser), renders it as a poster-driven streaming UI with rails, search, series and episode pages, watchlist and a deep-link player. With no Sonarr configured it runs in demo mode against a built-in mock library. The root `/` redirects to `/browse`.

## Pages

| Route | What it is |
|---|---|
| `/` | Redirects to `/browse` |
| `/browse` | Poster grid for the whole library |
| `/search` | Search across series |
| `/my-list` | Watchlist |
| `/series/[id]` | Series page |
| `/watch/[id]/[season]/[episode]` | Player view |
| `/add`, `/settings` | Sonarr connection setup and testing |
| `/showcase` | Component and design showcase |
| `/jarvis` | Minimal assistant UI backed by any OpenAI-compatible endpoint |
| `/store`, `/sideprojectors`, `/templates-for-notion` | Storefront and marketing page experiments |
| `/missed-call` | Small standalone interaction demo |


## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm start
npm run typecheck
```

## Configuration

Everything is optional — copy `.env.example` to `.env.local`:

| Variable | Purpose |
|---|---|
| `SONARR_URL` | Base URL of your Sonarr instance, e.g. `http://localhost:8989` |
| `SONARR_API_KEY` | Sonarr API key (server-side only) |
| `NEXT_PUBLIC_MEDIA_BASE` | Optional deep link into Jellyfin/Plex for the player. `{id}` is replaced with the episode id. |
| `JARVIS_API_KEY` | Optional key for the `/jarvis` assistant |
| `JARVIS_BASE_URL` | OpenAI-compatible base URL (default `https://api.openai.com/v1`) |
| `JARVIS_MODEL` | Model name (default `gpt-4o-mini`) |

Leave `SONARR_URL` and `SONARR_API_KEY` blank to run in demo mode.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Zustand · Framer Motion · TypeScript

## Structure

```
app/
  (cinewave)/       Sonarr UI routes, wrapped in the site header/footer layout
  aquarium/         Koi pond landing page and game
  jarvis/           Assistant route
  (missed)/         Standalone demo route
  api/jarvis/chat/  Server-side chat proxy
components/         UI components (cinewave, aquarium game, store, jarvis)
lib/                Sonarr client, config, mock data, formatting, stores
public/             Static assets
```

## Notes

- Media itself is not served by Sonarr. Point `NEXT_PUBLIC_MEDIA_BASE` at Jellyfin, Plex or any player that accepts a deep link.
- The library is fetched server-side; the browser never sees your Sonarr credentials.
