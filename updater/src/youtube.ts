import type { UpdaterConfig } from "./config.js";

type PlaylistItemsResponse = {
  nextPageToken?: string;
  items?: Array<{
    contentDetails?: {
      videoId?: string;
      videoPublishedAt?: string;
    };
    snippet?: {
      publishedAt?: string;
    };
  }>;
  error?: {
    errors?: Array<{
      reason?: string;
    }>;
  };
};

type VideosResponse = {
  items?: Array<Record<string, unknown>>;
  error?: {
    errors?: Array<{
      reason?: string;
    }>;
  };
};

export type UploadCandidate = {
  videoId: string;
  publishedAt: string;
};

export type QuotaTracker = {
  current: number;
  max: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertQuota(tracker: QuotaTracker, nextCost: number) {
  if (tracker.current + nextCost > tracker.max) {
    throw new Error(`Quota budget exceeded before request: ${tracker.current + nextCost} > ${tracker.max}`);
  }
  tracker.current += nextCost;
}

function shouldRetry(status: number) {
  return status === 429 || status >= 500;
}

async function fetchJson<T>(url: URL, tracker: QuotaTracker, quotaCost: number) {
  assertQuota(tracker, quotaCost);

  const backoffs = [250, 1000, 4000];

  for (let attempt = 0; attempt <= backoffs.length; attempt += 1) {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json"
      }
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    const payload = (await response.json().catch(() => null)) as { error?: { errors?: Array<{ reason?: string }> } } | null;
    const quotaExceeded = payload?.error?.errors?.some((entry) => entry.reason === "quotaExceeded");
    if (quotaExceeded) {
      throw new Error("YouTube quotaExceeded");
    }

    if (attempt === backoffs.length || !shouldRetry(response.status)) {
      throw new Error(`YouTube request failed with ${response.status}`);
    }

    const retryAfter = response.headers.get("retry-after");
    await sleep(retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : backoffs[attempt]);
  }

  throw new Error("Unreachable retry loop");
}

function isOlderThanLookback(dateString: string, lookbackDays: number) {
  const publishedAt = new Date(dateString).getTime();
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  return publishedAt < cutoff;
}

export async function listRecentUploads(
  playlistId: string,
  config: UpdaterConfig,
  tracker: QuotaTracker
): Promise<UploadCandidate[]> {
  const candidates: UploadCandidate[] = [];
  let pageToken: string | undefined;

  while (candidates.length < config.updaterPerChannelMax) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", config.youtubeApiKey);
    url.searchParams.set("fields", "nextPageToken,items(contentDetails(videoId,videoPublishedAt),snippet(publishedAt))");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const payload = await fetchJson<PlaylistItemsResponse>(url, tracker, 1);
    const pageItems = payload.items || [];

    for (const item of pageItems) {
      const videoId = item.contentDetails?.videoId;
      const publishedAt = item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt;

      if (!videoId || !publishedAt) {
        continue;
      }

      if (isOlderThanLookback(publishedAt, config.updaterLookbackDays)) {
        return candidates;
      }

      candidates.push({ videoId, publishedAt });
      if (candidates.length >= config.updaterPerChannelMax) {
        return candidates;
      }
    }

    if (!payload.nextPageToken) {
      return candidates;
    }

    pageToken = payload.nextPageToken;
  }

  return candidates;
}

export async function getVideoDetails(videoIds: string[], config: UpdaterConfig, tracker: QuotaTracker) {
  if (videoIds.length === 0) {
    return [] as VideosResponse["items"];
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails,statistics,status,player");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", config.youtubeApiKey);
  url.searchParams.set(
    "fields",
    "items(id,snippet(publishedAt,channelId,title,description,channelTitle,liveBroadcastContent,thumbnails(default,medium,high,standard,maxres)),contentDetails(duration),statistics(viewCount),status(privacyStatus,embeddable),player(embedHtml))"
  );

  const payload = await fetchJson<VideosResponse>(url, tracker, 1);
  return payload.items || [];
}
