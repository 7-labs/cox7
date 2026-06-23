import { type SearchResponse } from "@/lib/search";

const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const MAX_CACHE_ENTRIES = 200;
const MAX_RATE_LIMIT_KEYS = 500;

type SearchCacheEntry = {
  value: SearchResponse;
  expiresAt: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RuntimeStores = {
  searchCache: Map<string, SearchCacheEntry>;
  rateLimits: Map<string, RateLimitEntry>;
};

type GlobalWithC7State = typeof globalThis & {
  __c7SearchRuntime?: RuntimeStores;
};

export type RateLimitState = {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
};

function getRuntimeStores(): RuntimeStores {
  const scopedGlobal = globalThis as GlobalWithC7State;

  if (!scopedGlobal.__c7SearchRuntime) {
    scopedGlobal.__c7SearchRuntime = {
      searchCache: new Map<string, SearchCacheEntry>(),
      rateLimits: new Map<string, RateLimitEntry>()
    };
  }

  return scopedGlobal.__c7SearchRuntime;
}

function cloneResponse(value: SearchResponse) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function trimMap<T>(map: Map<string, T>, maxEntries: number) {
  while (map.size > maxEntries) {
    const firstKey = map.keys().next().value;

    if (!firstKey) {
      return;
    }

    map.delete(firstKey);
  }
}

function clearExpiredCacheEntries() {
  const { searchCache } = getRuntimeStores();
  const now = Date.now();

  for (const [key, entry] of searchCache.entries()) {
    if (entry.expiresAt <= now) {
      searchCache.delete(key);
    }
  }
}

function clearExpiredRateLimitEntries() {
  const { rateLimits } = getRuntimeStores();
  const now = Date.now();

  for (const [key, entry] of rateLimits.entries()) {
    if (entry.resetAt <= now) {
      rateLimits.delete(key);
    }
  }
}

function toRateLimitState(entry: RateLimitEntry | undefined, now: number): RateLimitState {
  if (!entry || entry.resetAt <= now) {
    const resetAt = new Date(now + RATE_LIMIT_WINDOW_MS).toISOString();
    return {
      limited: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      resetAt,
      retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    };
  }

  return {
    limited: entry.count >= RATE_LIMIT_MAX_REQUESTS,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(RATE_LIMIT_MAX_REQUESTS - entry.count, 0),
    resetAt: new Date(entry.resetAt).toISOString(),
    retryAfterSeconds: Math.max(Math.ceil((entry.resetAt - now) / 1000), 0)
  };
}

export function makeSearchCacheKey(query: string, league: string, type: string) {
  return JSON.stringify([query.trim().toLowerCase(), league, type]);
}

export function getCachedSearchResponse(key: string) {
  clearExpiredCacheEntries();

  const { searchCache } = getRuntimeStores();
  const entry = searchCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    searchCache.delete(key);
    return null;
  }

  return cloneResponse(entry.value);
}

export function setCachedSearchResponse(key: string, value: SearchResponse) {
  clearExpiredCacheEntries();

  const { searchCache } = getRuntimeStores();
  searchCache.set(key, {
    value: cloneResponse(value),
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS
  });

  trimMap(searchCache, MAX_CACHE_ENTRIES);
}

export function getRateLimitSnapshot(clientKey: string): RateLimitState {
  clearExpiredRateLimitEntries();

  const { rateLimits } = getRuntimeStores();
  return toRateLimitState(rateLimits.get(clientKey), Date.now());
}

export function consumeRateLimit(clientKey: string): RateLimitState {
  clearExpiredRateLimitEntries();

  const { rateLimits } = getRuntimeStores();
  const now = Date.now();
  const current = rateLimits.get(clientKey);

  let nextEntry: RateLimitEntry;

  if (!current || current.resetAt <= now) {
    nextEntry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    };
  } else if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    nextEntry = current;
  } else {
    nextEntry = {
      count: current.count + 1,
      resetAt: current.resetAt
    };
  }

  rateLimits.set(clientKey, nextEntry);
  trimMap(rateLimits, MAX_RATE_LIMIT_KEYS);

  return toRateLimitState(nextEntry, now);
}

export function getSearchCacheTtlSeconds() {
  return Math.floor(SEARCH_CACHE_TTL_MS / 1000);
}
