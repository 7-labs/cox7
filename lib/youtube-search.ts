import { type LeagueSlug, type PreviewType, type PreviewVideo } from "@/lib/c7-data";
import { getVideos } from "@/lib/inventory";
import { buildSearchQuery, filterSeedVideos, type SearchResponse } from "@/lib/search";
import {
  consumeRateLimit,
  getCachedSearchResponse,
  getRateLimitSnapshot,
  getSearchCacheTtlSeconds,
  makeSearchCacheKey,
  setCachedSearchResponse,
  type RateLimitState
} from "@/lib/search-runtime";
import { dedupeSearchCandidates, toPreviewVideo, type YouTubeSearchItem, type YouTubeVideoItem } from "@/lib/verify";

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

type SearchRequest = {
  query: string;
  league: LeagueSlug | "all";
  type: PreviewType | "all";
  apiKey?: string;
  clientKey: string;
};

export type SearchExecutionResult = {
  status: number;
  body: SearchResponse;
  headers: Record<string, string>;
};

type FallbackReason = NonNullable<SearchResponse["provenance"]["fallbackReason"]>;

export function isValidYouTubeVideoId(videoId: string) {
  return /^[a-zA-Z0-9_-]{6,20}$/.test(videoId);
}

function createHeaders(rateLimit: RateLimitState, cacheStatus: "hit" | "miss", source: SearchResponse["source"], status: number) {
  const headers: Record<string, string> = {
    "X-C7-Cache": cacheStatus,
    "X-C7-Source": source,
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": rateLimit.resetAt
  };

  if (status === 429) {
    headers["Retry-After"] = String(rateLimit.retryAfterSeconds);
  }

  return headers;
}

function withRuntimeState(response: SearchResponse, rateLimit: RateLimitState, cacheStatus: "hit" | "miss") {
  return {
    ...response,
    source: cacheStatus === "hit" && response.source === "youtube-api" ? "youtube-cache" : response.source,
    provenance: {
      ...response.provenance,
      cache: {
        ...response.provenance.cache,
        status: cacheStatus
      },
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      }
    }
  };
}

function seedResult(video: PreviewVideo, lastChecked: string): PreviewVideo {
  return {
    ...video,
    description: video.description || video.summary,
    source: "curated-seed",
    filterSummary: video.filterSummary || "trusted example video",
    status: video.status || "active",
    firstSeenAt: video.firstSeenAt || video.publishedAt,
    lastCheckedAt: lastChecked,
    lastVerifiedAt: video.lastVerifiedAt || video.lastCheckedAt || lastChecked,
    updatedAt: video.updatedAt || lastChecked
  };
}

function createFallbackResponse(params: {
  query: string;
  apiQuery: string;
  league: LeagueSlug | "all";
  type: PreviewType | "all";
  note: string;
  source?: SearchResponse["source"];
  fallbackReason: FallbackReason;
  lastChecked: string;
  rateLimit: RateLimitState;
  verifiedWith: Array<"postgrest" | "search.list" | "videos.list">;
  cacheStatus: "hit" | "miss";
  candidateCounts?: SearchResponse["provenance"]["candidateCounts"];
}) {
  return {
    source: params.source || "seed-fallback",
    query: params.query,
    note: params.note,
    results: filterSeedVideos({
      query: params.query,
      league: params.league,
      type: params.type
    }).map((video) => seedResult(video, params.lastChecked)),
    lastChecked: params.lastChecked,
    provenance: {
      provider: "curated-seed" as const,
      selectionSource: "curated-seed" as const,
      verifiedWith: params.verifiedWith,
      requestedQuery: params.query,
      apiQuery: params.apiQuery,
      filters: [
        "trusted_channel",
        "preview_intent",
        "blocked_terms",
        "public",
        "embeddable",
        "extreme_longform_guard",
        "seed_fallback_available"
      ],
      cache: {
        status: params.cacheStatus,
        ttlSeconds: getSearchCacheTtlSeconds()
      },
      rateLimit: {
        limit: params.rateLimit.limit,
        remaining: params.rateLimit.remaining,
        resetAt: params.rateLimit.resetAt
      },
      fallbackReason: params.fallbackReason,
      candidateCounts: params.candidateCounts
    }
  } satisfies SearchResponse;
}

function createInventoryResponse(params: {
  query: string;
  apiQuery: string;
  league: LeagueSlug | "all";
  type: PreviewType | "all";
  results: PreviewVideo[];
  lastChecked: string;
  rateLimit: RateLimitState;
}) {
  return {
    source: "supabase" as const,
    query: params.query,
    results: params.results,
    note: "Results are served from the verified C7 inventory with seed fallback when the inventory is unavailable.",
    lastChecked: params.lastChecked,
    provenance: {
      provider: "supabase-inventory" as const,
      selectionSource: "supabase-rest" as const,
      verifiedWith: ["postgrest"] as Array<"postgrest">,
      requestedQuery: params.query,
      apiQuery: params.apiQuery,
      filters: [
        "trusted_channel",
        "preview_intent",
        "blocked_terms",
        "public",
        "embeddable",
        "extreme_longform_guard",
        "inventory_status_active"
      ],
      cache: {
        status: "miss" as const,
        ttlSeconds: getSearchCacheTtlSeconds()
      },
      rateLimit: {
        limit: params.rateLimit.limit,
        remaining: params.rateLimit.remaining,
        resetAt: params.rateLimit.resetAt
      },
      candidateCounts: {
        search: params.results.length,
        verified: params.results.length,
        final: params.results.length
      }
    }
  } satisfies SearchResponse;
}

async function fetchJson<T>(url: URL) {
  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status
    };
  }

  return {
    ok: true as const,
    status: response.status,
    payload: (await response.json()) as T
  };
}

function shouldUseLiveFallback() {
  return process.env.YOUTUBE_LIVE_FALLBACK === "on";
}

async function runLiveYouTubeSearch(params: {
  apiKey: string;
  apiQuery: string;
  query: string;
  league: LeagueSlug | "all";
  type: PreviewType | "all";
  lastChecked: string;
  rateLimit: RateLimitState;
  cacheKey: string;
}): Promise<SearchExecutionResult> {
  const searchUrl = new URL(YOUTUBE_SEARCH_URL);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("safeSearch", "moderate");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", "18");
  searchUrl.searchParams.set("q", params.apiQuery);
  searchUrl.searchParams.set("key", params.apiKey);
  searchUrl.searchParams.set("fields", "items(id/videoId,snippet(publishedAt,channelId,title,description,channelTitle))");

  try {
    const searchResponse = await fetchJson<{ items?: YouTubeSearchItem[] }>(searchUrl);

    if (!searchResponse.ok) {
      const body = createFallbackResponse({
        query: params.query,
        apiQuery: params.apiQuery,
        league: params.league,
        type: params.type,
        note: `YouTube search returned ${searchResponse.status}; showing curated fallback results instead.`,
        fallbackReason: "upstream_http_error",
        lastChecked: params.lastChecked,
        rateLimit: params.rateLimit,
        verifiedWith: ["search.list"],
        cacheStatus: "miss"
      });

      return {
        status: 200,
        body,
        headers: createHeaders(params.rateLimit, "miss", body.source, 200)
      };
    }

    const searchCandidates = dedupeSearchCandidates(searchResponse.payload.items || []);

    if (searchCandidates.length === 0) {
      const body = createFallbackResponse({
        query: params.query,
        apiQuery: params.apiQuery,
        league: params.league,
        type: params.type,
        note: "No trusted preview candidates matched this query yet; showing curated fallback results.",
        fallbackReason: "no_search_candidates",
        lastChecked: params.lastChecked,
        rateLimit: params.rateLimit,
        verifiedWith: ["search.list"],
        cacheStatus: "miss",
        candidateCounts: {
          search: 0,
          verified: 0,
          final: 0
        }
      });

      setCachedSearchResponse(params.cacheKey, body);

      return {
        status: 200,
        body,
        headers: createHeaders(params.rateLimit, "miss", body.source, 200)
      };
    }

    const searchOrder = new Map(searchCandidates.map((item, index) => [item.id?.videoId || "", index]));
    const videoIds = searchCandidates.map((item) => item.id?.videoId).filter((value): value is string => Boolean(value));
    const videosUrl = new URL(YOUTUBE_VIDEOS_URL);
    videosUrl.searchParams.set("part", "snippet,contentDetails,statistics,status,player");
    videosUrl.searchParams.set("id", videoIds.join(","));
    videosUrl.searchParams.set("key", params.apiKey);
    videosUrl.searchParams.set(
      "fields",
      "items(id,snippet(publishedAt,channelId,title,description,channelTitle,liveBroadcastContent,thumbnails(default,medium,high,standard,maxres)),contentDetails(duration),statistics(viewCount),status(privacyStatus,embeddable),player(embedHtml))"
    );

    const videosResponse = await fetchJson<{ items?: YouTubeVideoItem[] }>(videosUrl);

    if (!videosResponse.ok) {
      const body = createFallbackResponse({
        query: params.query,
        apiQuery: params.apiQuery,
        league: params.league,
        type: params.type,
        note: `YouTube video verification returned ${videosResponse.status}; showing curated fallback results instead.`,
        fallbackReason: "upstream_http_error",
        lastChecked: params.lastChecked,
        rateLimit: params.rateLimit,
        verifiedWith: ["search.list", "videos.list"],
        cacheStatus: "miss",
        candidateCounts: {
          search: searchCandidates.length,
          verified: 0,
          final: 0
        }
      });

      return {
        status: 200,
        body,
        headers: createHeaders(params.rateLimit, "miss", body.source, 200)
      };
    }

    const verifiedCandidates = (videosResponse.payload.items || [])
      .map((item) => toPreviewVideo(item, params.league, params.type, params.lastChecked))
      .filter((video): video is PreviewVideo => Boolean(video))
      .sort((left, right) => (searchOrder.get(left.id) || 0) - (searchOrder.get(right.id) || 0));

    if (verifiedCandidates.length === 0) {
      const body = createFallbackResponse({
        query: params.query,
        apiQuery: params.apiQuery,
        league: params.league,
        type: params.type,
        note: "Trusted candidates were found, but none passed public embeddable verification; showing curated fallback results.",
        fallbackReason: "no_verified_results",
        lastChecked: params.lastChecked,
        rateLimit: params.rateLimit,
        verifiedWith: ["search.list", "videos.list"],
        cacheStatus: "miss",
        candidateCounts: {
          search: searchCandidates.length,
          verified: 0,
          final: 0
        }
      });

      setCachedSearchResponse(params.cacheKey, body);

      return {
        status: 200,
        body,
        headers: createHeaders(params.rateLimit, "miss", body.source, 200)
      };
    }

    const body = {
      source: "youtube-api" as const,
      query: params.apiQuery,
      results: verifiedCandidates,
      note: "Results are filtered through search.list discovery, videos.list verification, trusted channels, preview intent, blocked terms, and embeddable public checks.",
      lastChecked: params.lastChecked,
      provenance: {
        provider: "youtube-data-api-v3" as const,
        selectionSource: "search.list+videos.list" as const,
        verifiedWith: ["search.list", "videos.list"] as Array<"search.list" | "videos.list">,
        requestedQuery: params.query,
        apiQuery: params.apiQuery,
        filters: [
          "trusted_channel",
          "preview_intent",
          "blocked_terms",
          "public",
          "embeddable",
          "extreme_longform_guard"
        ],
        cache: {
          status: "miss" as const,
          ttlSeconds: getSearchCacheTtlSeconds()
        },
        rateLimit: {
          limit: params.rateLimit.limit,
          remaining: params.rateLimit.remaining,
          resetAt: params.rateLimit.resetAt
        },
        candidateCounts: {
          search: searchCandidates.length,
          verified: verifiedCandidates.length,
          final: verifiedCandidates.length
        }
      }
    } satisfies SearchResponse;

    setCachedSearchResponse(params.cacheKey, body);

    return {
      status: 200,
      body,
      headers: createHeaders(params.rateLimit, "miss", body.source, 200)
    };
  } catch {
    const body = createFallbackResponse({
      query: params.query,
      apiQuery: params.apiQuery,
      league: params.league,
      type: params.type,
      note: "YouTube API request failed; showing curated fallback results instead.",
      fallbackReason: "upstream_exception",
      lastChecked: params.lastChecked,
      rateLimit: params.rateLimit,
      verifiedWith: ["search.list", "videos.list"],
      cacheStatus: "miss"
    });

    return {
      status: 200,
      body,
      headers: createHeaders(params.rateLimit, "miss", body.source, 200)
    };
  }
}

export async function executeSearchRequest(params: SearchRequest): Promise<SearchExecutionResult> {
  const apiQuery = buildSearchQuery(params.query, params.league, params.type);
  const cacheKey = makeSearchCacheKey(apiQuery, params.league, params.type);
  const cachedResponse = getCachedSearchResponse(cacheKey);

  if (cachedResponse) {
    const rateLimit = getRateLimitSnapshot(params.clientKey);
    const body = withRuntimeState(cachedResponse, rateLimit, "hit");

    return {
      status: 200,
      body,
      headers: createHeaders(rateLimit, "hit", body.source, 200)
    };
  }

  const lastChecked = new Date().toISOString();
  const inventory = await getVideos({
    query: params.query,
    league: params.league,
    type: params.type
  });
  const rateLimitSnapshot = getRateLimitSnapshot(params.clientKey);

  if (inventory.source === "supabase" && inventory.videos.length > 0) {
    const body = createInventoryResponse({
      query: params.query,
      apiQuery,
      league: params.league,
      type: params.type,
      results: inventory.videos,
      lastChecked,
      rateLimit: rateLimitSnapshot
    });

    setCachedSearchResponse(cacheKey, body);

    return {
      status: 200,
      body,
      headers: createHeaders(rateLimitSnapshot, "miss", body.source, 200)
    };
  }

  if (inventory.source === "seed") {
    const body = createFallbackResponse({
      query: params.query,
      apiQuery,
      league: params.league,
      type: params.type,
      note: "Inventory is currently serving the curated seed fallback.",
      fallbackReason: "inventory_unavailable",
      lastChecked,
      rateLimit: rateLimitSnapshot,
      verifiedWith: ["postgrest"],
      cacheStatus: "miss",
      candidateCounts: {
        search: inventory.videos.length,
        verified: inventory.videos.length,
        final: inventory.videos.length
      }
    });

    setCachedSearchResponse(cacheKey, body);

    return {
      status: 200,
      body,
      headers: createHeaders(rateLimitSnapshot, "miss", body.source, 200)
    };
  }

  if (shouldUseLiveFallback() && params.apiKey) {
    const rateLimit = consumeRateLimit(params.clientKey);

    if (rateLimit.limited) {
      const body = createFallbackResponse({
        query: params.query,
        apiQuery,
        league: params.league,
        type: params.type,
        note: "Search is temporarily rate limited; showing curated fallback results instead.",
        source: "rate-limited",
        fallbackReason: "rate_limited",
        lastChecked,
        rateLimit,
        verifiedWith: [],
        cacheStatus: "miss"
      });

      return {
        status: 429,
        body,
        headers: createHeaders(rateLimit, "miss", body.source, 429)
      };
    }

    return runLiveYouTubeSearch({
      apiKey: params.apiKey,
      apiQuery,
      query: params.query,
      league: params.league,
      type: params.type,
      lastChecked,
      rateLimit,
      cacheKey
    });
  }

  const body = createFallbackResponse({
    query: params.query,
    apiQuery,
    league: params.league,
    type: params.type,
    note: "No matching inventory rows were found yet; showing curated fallback results.",
    fallbackReason: "no_inventory_results",
    lastChecked,
    rateLimit: rateLimitSnapshot,
    verifiedWith: ["postgrest"],
    cacheStatus: "miss",
    candidateCounts: {
      search: inventory.videos.length,
      verified: inventory.videos.length,
      final: inventory.videos.length
    }
  });

  setCachedSearchResponse(cacheKey, body);

  return {
    status: 200,
    body,
    headers: createHeaders(rateLimitSnapshot, "miss", body.source, 200)
  };
}

export async function fetchVerifiedWatchVideo(videoId: string, apiKey: string) {
  if (!isValidYouTubeVideoId(videoId)) return null;

  const videosUrl = new URL(YOUTUBE_VIDEOS_URL);
  videosUrl.searchParams.set("part", "snippet,contentDetails,statistics,status,player");
  videosUrl.searchParams.set("id", videoId);
  videosUrl.searchParams.set("key", apiKey);
  videosUrl.searchParams.set(
    "fields",
    "items(id,snippet(publishedAt,channelId,title,description,channelTitle,liveBroadcastContent,thumbnails(default,medium,high,standard,maxres)),contentDetails(duration),statistics(viewCount),status(privacyStatus,embeddable),player(embedHtml))"
  );

  const response = await fetchJson<{ items?: YouTubeVideoItem[] }>(videosUrl);

  if (!response.ok) {
    throw new Error(`videos.list returned ${response.status}`);
  }

  const lastChecked = new Date().toISOString();
  const [item] = response.payload.items || [];

  return item ? toPreviewVideo(item, "all", "all", lastChecked) : null;
}
