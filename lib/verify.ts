import { getTrustedChannelById, youtubeThumbnailUrl, type LeagueSlug, type PreviewType, type PreviewVideo } from "@/lib/c7-data";
import {
  hasBlockedTerms,
  hasPreviewIntent,
  inferLeague,
  inferType,
  isExtremeLongVideo,
  isSoccerText,
  makeVideoSlug,
  matchesLeague,
  matchesType,
  normalizeText,
  parseDurationSeconds
} from "@/lib/search";

export type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    channelTitle?: string;
  };
};

export type YouTubeVideoItem = {
  id?: string;
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    title?: string;
    description?: string;
    channelTitle?: string;
    liveBroadcastContent?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
      standard?: { url?: string };
      maxres?: { url?: string };
    };
  };
  contentDetails?: {
    duration?: string;
  };
  statistics?: {
    viewCount?: string;
  };
  status?: {
    privacyStatus?: string;
    embeddable?: boolean;
  };
};

export function pickSourceLevel(channelId: string): PreviewVideo["sourceLevel"] {
  return getTrustedChannelById(channelId)?.sourceLevel || "trusted-sports-channel";
}

export function resolveLeague(
  title: string,
  description: string,
  channelTitle: string,
  channelId: string,
  requestedLeague: LeagueSlug | "all"
): LeagueSlug {
  const haystack = normalizeText(`${title} ${description} ${channelTitle}`);

  // Soccer first: a Champions League "finals" or "football" video must not fall
  // into the NBA/NFL keyword checks below.
  if (isSoccerText(haystack)) return "soccer";
  if (haystack.includes("draft")) return "draft";
  if (haystack.includes("nba") || haystack.includes("basketball") || haystack.includes("finals")) return "nba";
  if (haystack.includes("mlb") || haystack.includes("baseball") || haystack.includes("world series")) return "mlb";
  if (haystack.includes("nhl") || haystack.includes("hockey") || haystack.includes("stanley cup")) return "nhl";
  if (haystack.includes("nfl") || haystack.includes("football") || haystack.includes("super bowl")) return "nfl";

  if (requestedLeague !== "all" && requestedLeague !== "upcoming") {
    return requestedLeague;
  }

  const trustedChannel = getTrustedChannelById(channelId);
  if (trustedChannel?.leagues.length === 1) {
    return trustedChannel.leagues[0];
  }

  return inferLeague(`${title} ${description}`, channelTitle);
}

export function makeSummary(description: string, channelTitle: string) {
  return description ? description.slice(0, 180) : `A trusted YouTube sports preview video from ${channelTitle}.`;
}

export function bestThumbnail(item: YouTubeVideoItem) {
  return (
    item.snippet?.thumbnails?.maxres?.url ||
    item.snippet?.thumbnails?.standard?.url ||
    item.snippet?.thumbnails?.high?.url ||
    item.snippet?.thumbnails?.medium?.url ||
    item.snippet?.thumbnails?.default?.url ||
    (item.id ? youtubeThumbnailUrl(item.id) : undefined)
  );
}

export function toPreviewVideo(
  item: YouTubeVideoItem,
  requestedLeague: LeagueSlug | "all",
  requestedType: PreviewType | "all",
  lastChecked: string
): PreviewVideo | null {
  const videoId = item.id || "";
  const snippet = item.snippet;
  const title = snippet?.title?.replace(/&amp;/g, "&") || "";
  const description = snippet?.description || "";
  const channelId = snippet?.channelId || "";
  const channelTitle = snippet?.channelTitle || "YouTube";
  const privacyStatus = item.status?.privacyStatus || "private";
  const embeddable = item.status?.embeddable === true;
  const durationSeconds = parseDurationSeconds(item.contentDetails?.duration);
  const combined = `${title} ${description}`;

  if (!videoId || !snippet || !getTrustedChannelById(channelId)) {
    return null;
  }

  if (privacyStatus !== "public" || !embeddable) {
    return null;
  }

  if (!hasPreviewIntent(combined) || hasBlockedTerms(combined) || isExtremeLongVideo(title, description, durationSeconds)) {
    return null;
  }

  const type = inferType(title);
  const league = resolveLeague(title, description, channelTitle, channelId, requestedLeague);

  if (!matchesType(type, requestedType) || !matchesLeague(league, requestedLeague)) {
    return null;
  }

  return {
    id: videoId,
    slug: makeVideoSlug(title, videoId),
    title,
    description,
    channelTitle,
    channelId,
    league,
    type,
    sourceLevel: pickSourceLevel(channelId),
    publishedAt: snippet.publishedAt || lastChecked,
    summary: makeSummary(description, channelTitle),
    tags: [league.toUpperCase(), type.replace(/-/g, " "), channelTitle],
    thumbnailUrl: bestThumbnail(item),
    durationSeconds,
    viewCount: item.statistics?.viewCount ? Number(item.statistics.viewCount) : undefined,
    privacyStatus,
    embeddable,
    liveBroadcastContent: snippet.liveBroadcastContent,
    source: "youtube-api",
    filterSummary: "trusted channel + public + embeddable + preview intent",
    status: "active",
    firstSeenAt: snippet.publishedAt || lastChecked,
    lastCheckedAt: lastChecked,
    lastVerifiedAt: lastChecked,
    updatedAt: lastChecked
  };
}

export function dedupeSearchCandidates(items: YouTubeSearchItem[]) {
  const unique = new Map<string, YouTubeSearchItem>();

  for (const item of items) {
    const videoId = item.id?.videoId;
    const title = item.snippet?.title || "";
    const description = item.snippet?.description || "";
    const channelId = item.snippet?.channelId || "";

    if (!videoId || !title || !channelId) {
      continue;
    }

    if (!unique.has(videoId) && getTrustedChannelById(channelId) && hasPreviewIntent(`${title} ${description}`) && !hasBlockedTerms(`${title} ${description}`)) {
      unique.set(videoId, item);
    }
  }

  return [...unique.values()];
}
