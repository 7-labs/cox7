import {
  allowedChannelIds,
  blockedTerms,
  leaguePages,
  previewIntentTerms,
  seedVideos,
  trustedChannels,
  type LeagueSlug,
  type PreviewType,
  type PreviewVideo,
  type TrustedChannel
} from "@/lib/c7-data";

export type SearchFilters = {
  query?: string;
  league?: LeagueSlug | "all";
  type?: PreviewType | "all";
};

export type SearchSource = "supabase" | "youtube-api" | "youtube-cache" | "seed-fallback" | "rate-limited";

export type SearchProvenance = {
  provider: "supabase-inventory" | "youtube-data-api-v3" | "curated-seed";
  selectionSource: "supabase-rest" | "search.list+videos.list" | "curated-seed";
  verifiedWith: Array<"postgrest" | "search.list" | "videos.list">;
  requestedQuery: string;
  apiQuery: string;
  filters: string[];
  cache: {
    status: "hit" | "miss";
    ttlSeconds: number;
  };
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
  fallbackReason?:
    | "missing_api_key"
    | "inventory_unavailable"
    | "no_inventory_results"
    | "rate_limited"
    | "upstream_http_error"
    | "upstream_exception"
    | "no_search_candidates"
    | "no_verified_results";
  candidateCounts?: {
    search: number;
    verified: number;
    final: number;
  };
};

export type SearchResponse = {
  source: SearchSource;
  query: string;
  results: PreviewVideo[];
  note?: string;
  lastChecked: string;
  provenance: SearchProvenance;
};

const DURATION_RE = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i;
const EXTREME_LONG_VIDEO_SECONDS = 3 * 60 * 60;
const LONGFORM_HINT_TERMS = [
  "full game",
  "full match",
  "full replay",
  "complete game",
  "entire game",
  "game replay",
  "broadcast replay"
];

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/&amp;/g, "&").replace(/[^a-z0-9\s|:-]/g, " ").replace(/\s+/g, " ").trim();
}

export function hasBlockedTerms(text: string) {
  const normalized = normalizeText(text);
  return blockedTerms.some((term) => normalized.includes(term));
}

export function hasPreviewIntent(text: string) {
  const normalized = normalizeText(text);
  return previewIntentTerms.some((term) => normalized.includes(term));
}

export function inferType(title: string): PreviewType {
  const normalized = normalizeText(title);

  if (normalized.includes("draft")) return "draft-preview";
  if (normalized.includes("playoff") || normalized.includes("final") || normalized.includes("championship")) return "playoff-preview";
  if (normalized.includes("season") || normalized.includes("prediction")) return "season-preview";
  if (normalized.includes("upcoming") || normalized.includes("live") || normalized.includes("watch party")) return "upcoming-live";
  if (normalized.includes("trailer")) return "official-trailer";
  return "game-preview";
}

export function inferLeague(title: string, channelTitle: string): LeagueSlug {
  const haystack = normalizeText(`${title} ${channelTitle}`);

  if (haystack.includes("draft")) return "draft";
  if (haystack.includes("nba") || haystack.includes("basketball") || haystack.includes("mavs") || haystack.includes("clippers")) return "nba";
  if (haystack.includes("mlb") || haystack.includes("baseball") || haystack.includes("world series")) return "mlb";
  if (haystack.includes("nhl") || haystack.includes("stanley") || haystack.includes("hockey")) return "nhl";
  return "nfl";
}

export function filterSeedVideos(filters: SearchFilters): PreviewVideo[] {
  const query = normalizeText(filters.query || "");

  return seedVideos.filter((video) => {
    const haystack = normalizeText(`${video.title} ${video.channelTitle} ${video.summary} ${video.tags.join(" ")}`);
    const queryMatches = !query || query.split(" ").every((term) => haystack.includes(term));
    const leagueMatches = !filters.league || matchesLeague(video.league, filters.league);
    const typeMatches = !filters.type || matchesType(video.type, filters.type);

    return queryMatches && leagueMatches && typeMatches;
  });
}

export function safeQuery(input: string | null) {
  const clean = (input || "").replace(/[\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
  return clean.slice(0, 120);
}

export function buildSearchQuery(query: string, league: string | null, type: string | null) {
  const leagueTerm = league && league !== "all" ? league.toUpperCase() : "sports";
  const typeTerm = type && type !== "all" ? type.replace(/-/g, " ") : "preview";
  const base = query || `${leagueTerm} ${typeTerm}`;

  if (/preview|pregame|draft|playoff|season|trailer|upcoming|live/i.test(base)) {
    return base;
  }

  return `${base} sports preview`;
}

export function makeVideoSlug(title: string, videoId: string) {
  const normalized = title
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 92);

  return `${normalized}-${videoId}`;
}

export function isLeagueSlug(value: string | null): value is LeagueSlug {
  return Boolean(value && leaguePages.some((league) => league.slug === value));
}

export function isPreviewType(value: string | null): value is PreviewType {
  return Boolean(
    value &&
      ["game-preview", "season-preview", "playoff-preview", "draft-preview", "upcoming-live", "official-trailer"].includes(value)
  );
}

export function isTrustedSearchResult(channelId: string, title: string, description: string) {
  const combined = `${title} ${description}`;
  return allowedChannelIds.has(channelId) && hasPreviewIntent(combined) && !hasBlockedTerms(combined);
}

export function getTrustedChannelById(channelId: string): TrustedChannel | undefined {
  return trustedChannels.find((channel) => channel.channelId === channelId);
}

export function matchesLeague(videoLeague: LeagueSlug, requestedLeague: LeagueSlug | "all") {
  return requestedLeague === "all" || requestedLeague === "upcoming" || videoLeague === requestedLeague || (requestedLeague === "nba" && videoLeague === "draft");
}

export function matchesType(videoType: PreviewType, requestedType: PreviewType | "all") {
  return requestedType === "all" || videoType === requestedType;
}

export function parseDurationSeconds(durationIso8601: string | null | undefined) {
  if (!durationIso8601) return 0;

  const match = durationIso8601.match(DURATION_RE);
  if (!match) return 0;

  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

export function isExtremeLongVideo(title: string, description: string, durationSeconds: number) {
  if (durationSeconds <= 0) return false;

  const combined = normalizeText(`${title} ${description}`);
  const hasLongformHint = LONGFORM_HINT_TERMS.some((term) => combined.includes(term));

  if (durationSeconds >= EXTREME_LONG_VIDEO_SECONDS) {
    return true;
  }

  return hasLongformHint && durationSeconds >= 2 * 60 * 60;
}
