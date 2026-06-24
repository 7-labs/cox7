import { type ContentStatus, type PreviewVideo, type TrustedChannel } from "@/lib/c7-data";

export type VideoRow = {
  video_id: string;
  slug: string;
  title: string;
  description?: string | null;
  summary?: string | null;
  channel_id: string;
  channel_title: string;
  league: PreviewVideo["league"];
  type: PreviewVideo["type"];
  source_level: PreviewVideo["sourceLevel"];
  published_at: string;
  duration_seconds?: number | null;
  view_count?: number | null;
  privacy_status?: string | null;
  embeddable?: boolean | null;
  live_broadcast_content?: string | null;
  thumbnail_url?: string | null;
  tags: string[];
  filter_summary?: string | null;
  search_text?: string | null;
  status: "active" | "hidden" | "removed";
  first_seen_at: string;
  last_checked_at: string;
  last_verified_at?: string | null;
  updated_at: string;
  // Phase 2: sports-event binding columns (nullable; added in Stage A migration).
  event_id?: string | null;
  event_league?: string | null;
  event_start_time?: string | null;
  event_status?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  event_match?: string | null;
};

export type VideoRowInsert = Omit<VideoRow, "search_text">;

export type ChannelRow = {
  channel_id: string;
  slug: TrustedChannel["slug"];
  name: string;
  youtube_url: string;
  source_level: TrustedChannel["sourceLevel"];
  leagues: Array<PreviewVideo["league"]>;
  uploads_playlist_id: string;
  notes?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UpdateRunRow = {
  id: number;
  started_at: string;
  finished_at?: string | null;
  status: "running" | "success" | "partial" | "failed";
  channels_total?: number | null;
  channels_ok?: number | null;
  videos_seen?: number | null;
  videos_upserted?: number | null;
  videos_removed?: number | null;
  quota_units_estimated?: number | null;
  error?: string | null;
};

function inferRowSource(row: VideoRow): PreviewVideo["source"] {
  return row.filter_summary?.toLowerCase().includes("curated") ? "curated-seed" : "youtube-api";
}

export function rowToPreviewVideo(row: VideoRow): PreviewVideo {
  return {
    id: row.video_id,
    slug: row.slug,
    title: row.title,
    description: row.description || undefined,
    channelTitle: row.channel_title,
    channelId: row.channel_id,
    league: row.league,
    type: row.type,
    sourceLevel: row.source_level,
    publishedAt: row.published_at,
    summary: row.summary || row.description || row.title,
    tags: row.tags || [],
    thumbnailUrl: row.thumbnail_url || undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    viewCount: row.view_count ?? undefined,
    privacyStatus: row.privacy_status || undefined,
    embeddable: row.embeddable ?? undefined,
    liveBroadcastContent: row.live_broadcast_content || undefined,
    source: inferRowSource(row),
    filterSummary: row.filter_summary || undefined,
    status: row.status,
    firstSeenAt: row.first_seen_at,
    lastCheckedAt: row.last_checked_at,
    lastVerifiedAt: row.last_verified_at || undefined,
    updatedAt: row.updated_at,
    eventId: row.event_id || undefined,
    eventLeague: row.event_league || undefined,
    eventStartTime: row.event_start_time || undefined,
    eventStatus: (row.event_status as ContentStatus) || undefined,
    homeTeam: row.home_team || undefined,
    awayTeam: row.away_team || undefined,
    eventMatch: (row.event_match as PreviewVideo["eventMatch"]) || undefined
  };
}

export function previewVideoToRow(video: PreviewVideo): VideoRowInsert {
  const now = video.lastCheckedAt || video.lastVerifiedAt || video.updatedAt || video.publishedAt;

  return {
    video_id: video.id,
    slug: video.slug,
    title: video.title,
    description: video.description ?? video.summary,
    summary: video.summary,
    channel_id: video.channelId,
    channel_title: video.channelTitle,
    league: video.league,
    type: video.type,
    source_level: video.sourceLevel,
    published_at: video.publishedAt,
    duration_seconds: video.durationSeconds ?? null,
    view_count: video.viewCount ?? null,
    privacy_status: video.privacyStatus ?? null,
    embeddable: video.embeddable ?? null,
    live_broadcast_content: video.liveBroadcastContent ?? null,
    thumbnail_url: video.thumbnailUrl ?? null,
    tags: video.tags,
    filter_summary: video.filterSummary ?? null,
    status: video.status || "active",
    first_seen_at: video.firstSeenAt || video.publishedAt,
    last_checked_at: video.lastCheckedAt || now,
    last_verified_at: video.lastVerifiedAt || video.lastCheckedAt || now,
    updated_at: video.updatedAt || now,
    event_id: video.eventId ?? null,
    event_league: video.eventLeague ?? null,
    event_start_time: video.eventStartTime ?? null,
    event_status: video.eventStatus ?? null,
    home_team: video.homeTeam ?? null,
    away_team: video.awayTeam ?? null,
    event_match: video.eventMatch ?? null
  };
}

export function uploadsPlaylistId(channelId: string) {
  return `UU${channelId.slice(2)}`;
}

function assertVideoRoundTrip() {
  const sampleRow: VideoRow = {
    video_id: "sample-video-id",
    slug: "sample-video-id",
    title: "Sample video",
    description: "Sample description",
    summary: "Sample summary",
    channel_id: "UCsample",
    channel_title: "Sample Channel",
    league: "nfl",
    type: "game-preview",
    source_level: "league-official",
    published_at: "2026-06-23T00:00:00Z",
    duration_seconds: 120,
    view_count: 42,
    privacy_status: "public",
    embeddable: true,
    live_broadcast_content: "none",
    thumbnail_url: "https://example.com/thumb.jpg",
    tags: ["NFL", "preview"],
    filter_summary: "curated seed bootstrap",
    search_text: "sample video sample description",
    status: "active",
    first_seen_at: "2026-06-23T00:00:00Z",
    last_checked_at: "2026-06-23T00:00:00Z",
    last_verified_at: "2026-06-23T00:00:00Z",
    updated_at: "2026-06-23T00:00:00Z",
    event_id: "401815868",
    event_league: "baseball/mlb",
    event_start_time: "2026-06-23T20:07:00Z",
    event_status: "completed",
    home_team: "Houston Astros",
    away_team: "Toronto Blue Jays",
    event_match: "strong"
  };

  const roundTrip = previewVideoToRow(rowToPreviewVideo(sampleRow));
  const keys: Array<keyof VideoRowInsert> = [
    "video_id",
    "slug",
    "title",
    "description",
    "summary",
    "channel_id",
    "channel_title",
    "league",
    "type",
    "source_level",
    "published_at",
    "duration_seconds",
    "view_count",
    "privacy_status",
    "embeddable",
    "live_broadcast_content",
    "thumbnail_url",
    "tags",
    "filter_summary",
    "status",
    "first_seen_at",
    "last_checked_at",
    "last_verified_at",
    "updated_at",
    "event_id",
    "event_league",
    "event_start_time",
    "event_status",
    "home_team",
    "away_team",
    "event_match"
  ];

  for (const key of keys) {
    if (JSON.stringify(sampleRow[key]) !== JSON.stringify(roundTrip[key])) {
      throw new Error(`Video row round-trip failed for ${key}`);
    }
  }
}

if (process.env.NODE_ENV !== "production") {
  assertVideoRoundTrip();
}
