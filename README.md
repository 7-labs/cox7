# C7 Sports Previews

C7 Sports Previews is the `cox7.com` codebase: an official-first sports preview finder built around verified YouTube inventory, canonical detail pages, and a DB-first request path.

## Architecture

The system is split into three responsibilities:

1. `updater/` is the only intended YouTube API caller.
   It sweeps trusted channels through their uploads playlists, verifies videos with shared preview rules, and writes `cox7.channels`, `cox7.videos`, and `cox7.update_runs` through PostgREST.
2. Supabase/PostgREST is the inventory source of truth.
   The frontend reads with the anon key and RLS. The updater writes with the service key.
3. Next.js on Cloudflare Pages reads inventory or falls back to curated seed content.
   The normal request path does not depend on YouTube.

That separation is the core stability decision: updater failures can stale the inventory, but they should not break page reads.

## Main routes

```text
/
/search/
/sports-previews/
/nfl-previews/
/nba-previews/
/mlb-previews/
/nhl-previews/
/soccer-previews/
/draft-previews/
/upcoming-live-sports/
/channels/
/archive/
/archive/local-video/
/archive/stem-journals/
/video/{slug}/
/watch/{videoId}/
/api/live
/api/search
/api/health
/api/status
/sitemap.xml
/sitemap-videos.xml
/robots.txt
```

Canonical video URLs are `/video/{slug}/`. `/watch/{videoId}/` exists as a compatibility route and 308 redirect target for stored inventory rows.

## Environment

Copy `.env.example` to `.env.local` for the frontend:

```bash
NEXT_PUBLIC_SITE_URL=https://cox7.com
SUPABASE_REST_URL=https://<public-postgrest-host>/rest/v1
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SCHEMA=cox7
INVENTORY_SOURCE=supabase
YOUTUBE_LIVE_FALLBACK=off
YOUTUBE_API_KEY=<optional-live-fallback-key>
```

Important flags:

- `INVENTORY_SOURCE=seed` is the kill-switch for immediate curated fallback.
- `YOUTUBE_LIVE_FALLBACK=on` re-enables request-time YouTube fallback for misses.
- `YOUTUBE_API_KEY` remains server-side only.

The updater uses its own uncommitted `updater/.env`:

```bash
YOUTUBE_API_KEY=<required>
SUPABASE_REST_URL=http://supabase-kong:8000/rest/v1
SUPABASE_SERVICE_KEY=<required>
SUPABASE_SCHEMA=cox7
CF_DEPLOY_HOOK_URL=<required>
KUMA_PUSH_URL=<required>
UPDATER_MAX_QUOTA_UNITS=2000
UPDATER_LOOKBACK_DAYS=120
UPDATER_PER_CHANNEL_MAX=25
```

## Runtime boundaries

- `lib/inventory.ts` is the only frontend/app read boundary.
- `lib/verify.ts` is the shared verification boundary for updater and live fallback.
- `app/api/search` is `cache -> inventory -> optional live YouTube fallback -> curated seed fallback`.
- `app/api/health` returns `503` when inventory is stale or Supabase is unreachable, unless the seed kill-switch is active.
- `app/sitemap.ts` and `app/sitemap-videos.xml/route.ts` read the inventory, not just seed rows.

## Commands

Frontend:

```bash
npm install
npm run typecheck
npm run build
npm run build:worker
```

Updater:

```bash
cd updater
npm install
npm run dry-run
npm run typecheck
```

Container/runtime lane:

```bash
make seed
make update-dry
make update
make logs
```

Cloudflare/OpenNext lane:

```bash
npm run build:worker
npm run preview:worker
npm run deploy:worker
npm run cf-typegen
```

Run installs, builds, previews, Docker, and browser QA on OpenClaw, not on the local control-plane Mac.

## Cloudflare deploy surface

The repo now includes the Phase 7 deployment wiring for Cloudflare:

- `open-next.config.ts`: OpenNext adapter entrypoint
- `wrangler.jsonc`: Cloudflare Worker config for the adapted build
- `public/_headers`: long-cache policy for static assets
- `.github/workflows/deploy.yml`: CI/CD that builds and deploys the Worker on push to `main`

OpenNext is the intended deploy adapter for Cloudflare Workers. Per current adapter guidance, source files should not rely on `export const runtime = "edge"` when building through OpenNext.

Deployment is automated: pushing to `main` runs the GitHub Actions workflow, which builds with OpenNext and deploys to Cloudflare Workers using the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. No secret values live in the repository.

## Redirects

Configured in `next.config.mjs`:

```text
/sports/                 -> /sports-previews/
/video/                  -> /sports-previews/
/videos/                 -> /sports-previews/
/schedule/               -> /upcoming-live-sports/
/shows/                  -> /channels/
/events/                 -> /upcoming-live-sports/
/video/cox7-advertiser/* -> /archive/local-video/
/stem-journals/*         -> /archive/stem-journals/
```

## Important files

- `lib/c7-data.ts`: trusted channels, leagues, seed content, URL helpers
- `lib/search.ts`: pure filtering/inference helpers and seed filtering
- `lib/verify.ts`: shared YouTube verification/mapping helpers
- `lib/supabase-rest.ts`: zero-dependency PostgREST client
- `lib/inventory.ts`: DB-first inventory repository with seed fallback
- `lib/youtube-search.ts`: request-time search orchestration with inventory-first flow
- `updater/src/`: daily writer, notifications, and Supabase store helpers
