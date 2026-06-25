import {
  getVideoById as getSeedVideoById,
  getVideoBySlug as getSeedVideoBySlug,
  seedVideos,
  type LeagueSlug,
  type PreviewType,
  type PreviewVideo
} from "@/lib/c7-data";
import { rowToPreviewVideo, type UpdateRunRow, type VideoRow } from "@/lib/inventory-types";
import { isSupabaseConfigured, pgrstCount, pgrstGet } from "@/lib/supabase-rest";
import { filterSeedVideos, normalizeText, type SearchFilters } from "@/lib/search";

type InventorySource = "supabase" | "seed";

type InventoryGetOptions = {
  limit?: number;
  revalidate?: number;
};

export type InventoryStats = {
  total: number;
  perLeague: Record<string, number>;
  latestPublishedAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  source: InventorySource;
};

function shouldUseSeedInventory() {
  return process.env.INVENTORY_SOURCE === "seed" || !isSupabaseConfigured();
}

function toSeedVideo(video: PreviewVideo): PreviewVideo {
  return {
    ...video,
    description: video.description || video.summary,
    source: "curated-seed",
    filterSummary: video.filterSummary || "trusted example video",
    status: video.status || "active",
    firstSeenAt: video.firstSeenAt || video.publishedAt,
    lastCheckedAt: video.lastCheckedAt || video.publishedAt,
    lastVerifiedAt: video.lastVerifiedAt || video.lastCheckedAt || video.publishedAt,
    updatedAt: video.updatedAt || video.lastCheckedAt || video.publishedAt
  };
}

function seedFallback(filters: SearchFilters) {
  return {
    videos: filterSeedVideos(filters).map(toSeedVideo),
    source: "seed" as const
  };
}

function buildLeagueFilter(league: LeagueSlug | "all" | undefined) {
  if (!league || league === "all") {
    return null;
  }

  if (league === "upcoming") {
    return { key: "type", value: "eq.upcoming-live" };
  }

  if (league === "draft") {
    return { key: "or", value: "(league.eq.draft,type.eq.draft-preview)" };
  }

  if (league === "nba") {
    return { key: "or", value: "(league.eq.nba,league.eq.draft)" };
  }

  return { key: "league", value: `eq.${league}` };
}

function getSearchTerms(query: string | undefined) {
  return normalizeText(query || "")
    .split(" ")
    .map((term) => term.replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean);
}

function buildVideoQuery(filters: SearchFilters, limit: number) {
  const params = new URLSearchParams({
    select: "*",
    status: "eq.active",
    order: "published_at.desc",
    limit: String(limit)
  });

  const leagueFilter = buildLeagueFilter(filters.league);
  if (leagueFilter) {
    params.set(leagueFilter.key, leagueFilter.value);
  }

  if (filters.type && filters.type !== "all") {
    params.set("type", `eq.${filters.type}`);
  }

  for (const term of getSearchTerms(filters.query)) {
    params.append("search_text", `ilike.*${term}*`);
  }

  return params.toString();
}

async function hasActiveInventory() {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const total = await pgrstCount("videos?select=video_id&status=eq.active&limit=1", { revalidate: 60 });
  return total > 0;
}

async function fetchVideoRows(filters: SearchFilters, options: InventoryGetOptions) {
  return pgrstGet<VideoRow[]>(`videos?${buildVideoQuery(filters, options.limit || 48)}`, {
    revalidate: options.revalidate ?? 300
  });
}

export async function getVideos(filters: SearchFilters = {}, options: InventoryGetOptions = {}) {
  if (shouldUseSeedInventory()) {
    return seedFallback(filters);
  }

  try {
    const rows = await fetchVideoRows(filters, options);
    if (rows.length > 0) {
      return {
        videos: rows.map(rowToPreviewVideo),
        source: "supabase" as const
      };
    }

    if (!(await hasActiveInventory())) {
      return seedFallback(filters);
    }

    return {
      videos: [],
      source: "supabase" as const
    };
  } catch {
    return seedFallback(filters);
  }
}

export async function getVideoBySlug(slug: string) {
  if (shouldUseSeedInventory()) {
    const seedVideo = getSeedVideoBySlug(slug);
    return seedVideo ? toSeedVideo(seedVideo) : null;
  }

  try {
    const params = new URLSearchParams({
      select: "*",
      status: "eq.active",
      slug: `eq.${slug}`,
      limit: "1"
    });
    const rows = await pgrstGet<VideoRow[]>(`videos?${params.toString()}`, {
      revalidate: 300
    });

    if (rows[0]) {
      return rowToPreviewVideo(rows[0]);
    }

    if (!(await hasActiveInventory())) {
      const seedVideo = getSeedVideoBySlug(slug);
      return seedVideo ? toSeedVideo(seedVideo) : null;
    }

    return null;
  } catch {
    const seedVideo = getSeedVideoBySlug(slug);
    return seedVideo ? toSeedVideo(seedVideo) : null;
  }
}

export async function getVideoById(videoId: string) {
  if (shouldUseSeedInventory()) {
    const seedVideo = getSeedVideoById(videoId);
    return seedVideo ? toSeedVideo(seedVideo) : null;
  }

  try {
    const params = new URLSearchParams({
      select: "*",
      status: "eq.active",
      video_id: `eq.${videoId}`,
      limit: "1"
    });
    const rows = await pgrstGet<VideoRow[]>(`videos?${params.toString()}`, {
      revalidate: 300
    });

    if (rows[0]) {
      return rowToPreviewVideo(rows[0]);
    }

    if (!(await hasActiveInventory())) {
      const seedVideo = getSeedVideoById(videoId);
      return seedVideo ? toSeedVideo(seedVideo) : null;
    }

    return null;
  } catch {
    const seedVideo = getSeedVideoById(videoId);
    return seedVideo ? toSeedVideo(seedVideo) : null;
  }
}

export async function getLeagueVideos(slug: LeagueSlug, limit = 12) {
  const result = await getVideos({ league: slug }, { limit });
  return result.videos;
}

export async function getAllVideosForSitemap() {
  if (shouldUseSeedInventory()) {
    return seedVideos.map((video) => ({
      slug: video.slug,
      id: video.id,
      publishedAt: video.publishedAt,
      title: video.title,
      summary: video.summary,
      thumbnailUrl: video.thumbnailUrl
    }));
  }

  try {
    const rows = await pgrstGet<Array<Pick<VideoRow, "slug" | "video_id" | "published_at" | "title" | "summary" | "thumbnail_url">>>(
      "videos?select=slug,video_id,published_at,title,summary,thumbnail_url&status=eq.active&order=published_at.desc&limit=5000",
      { revalidate: 300 }
    );

    if (rows.length > 0) {
      return rows.map((row) => ({
        slug: row.slug,
        id: row.video_id,
        publishedAt: row.published_at,
        title: row.title,
        summary: row.summary || row.title,
        thumbnailUrl: row.thumbnail_url || undefined
      }));
    }

    if (!(await hasActiveInventory())) {
      return seedVideos.map((video) => ({
        slug: video.slug,
        id: video.id,
        publishedAt: video.publishedAt,
        title: video.title,
        summary: video.summary,
        thumbnailUrl: video.thumbnailUrl
      }));
    }

    return [];
  } catch {
    return seedVideos.map((video) => ({
      slug: video.slug,
      id: video.id,
      publishedAt: video.publishedAt,
      title: video.title,
      summary: video.summary,
      thumbnailUrl: video.thumbnailUrl
    }));
  }
}

function seedStats(): InventoryStats {
  const perLeague = seedVideos.reduce<Record<string, number>>((counts, video) => {
    counts[video.league] = (counts[video.league] || 0) + 1;
    return counts;
  }, {});

  const latestPublishedAt = [...seedVideos]
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())[0]
    ?.publishedAt || null;

  return {
    total: seedVideos.length,
    perLeague,
    latestPublishedAt,
    lastRunAt: null,
    lastRunStatus: null,
    source: "seed"
  };
}

export async function getInventoryStats(): Promise<InventoryStats> {
  if (shouldUseSeedInventory()) {
    return seedStats();
  }

  try {
    const [rows, total, runs] = await Promise.all([
      pgrstGet<Array<Pick<VideoRow, "league" | "published_at">>>(
        "videos?select=league,published_at&status=eq.active&order=published_at.desc&limit=5000",
        { revalidate: 300 }
      ),
      pgrstCount("videos?select=video_id&status=eq.active&limit=1", { revalidate: 300 }),
      pgrstGet<Array<Pick<UpdateRunRow, "finished_at" | "started_at" | "status">>>(
        "update_runs?select=finished_at,started_at,status&order=started_at.desc&limit=1",
        { revalidate: 60 }
      )
    ]);

    if (rows.length === 0 && total === 0) {
      return seedStats();
    }

    const perLeague = rows.reduce<Record<string, number>>((counts, row) => {
      counts[row.league] = (counts[row.league] || 0) + 1;
      return counts;
    }, {});
    const latestPublishedAt = rows[0]?.published_at || null;
    const lastRun = runs[0];

    return {
      total,
      perLeague,
      latestPublishedAt,
      lastRunAt: lastRun?.finished_at || lastRun?.started_at || null,
      lastRunStatus: lastRun?.status || null,
      source: "supabase"
    };
  } catch {
    return seedStats();
  }
}
