import type { UpdaterConfig } from "./config.js";
import { previewVideoToRow, type ChannelRow, type UpdateRunRow, type VideoRowInsert } from "../../lib/inventory-types.js";
import type { PreviewVideo, TrustedChannel } from "../../lib/c7-data.js";

function buildHeaders(config: UpdaterConfig, extra: HeadersInit = {}) {
  // Kong key-auth uses the opaque service key in `apikey`; PostgREST derives the
  // service_role from a signed JWT in `Authorization` (supabaseAuthToken).
  return {
    apikey: config.supabaseServiceKey,
    ...(config.supabaseAuthToken ? { Authorization: `Bearer ${config.supabaseAuthToken}` } : {}),
    "Accept-Profile": config.supabaseSchema,
    "Content-Profile": config.supabaseSchema,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra
  };
}

function endpoint(config: UpdaterConfig, pathAndQuery: string) {
  return `${config.supabaseRestUrl.replace(/\/$/, "")}/${pathAndQuery}`;
}

function inFilter(values: string[]) {
  return `in.(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(",")})`;
}

async function request<T>(config: UpdaterConfig, pathAndQuery: string, init: RequestInit = {}) {
  const response = await fetch(endpoint(config, pathAndQuery), {
    ...init,
    headers: buildHeaders(config, init.headers)
  });

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204) {
    return [] as T;
  }

  const text = await response.text();
  if (!text) {
    return [] as T;
  }

  return JSON.parse(text) as T;
}

export async function createUpdateRun(config: UpdaterConfig) {
  const rows = await request<UpdateRunRow[]>(config, "update_runs", {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      status: "running",
      started_at: new Date().toISOString()
    })
  });

  return rows[0];
}

export async function finishUpdateRun(
  config: UpdaterConfig,
  id: number,
  payload: Partial<UpdateRunRow> & { finished_at: string; status: UpdateRunRow["status"] }
) {
  await request<UpdateRunRow[]>(config, `update_runs?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload)
  });
}

export async function upsertChannels(config: UpdaterConfig, rows: ChannelRow[]) {
  if (rows.length === 0) return;

  await request(config, "channels?on_conflict=channel_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });
}

async function existingFirstSeenMap(config: UpdaterConfig, videoIds: string[]) {
  if (videoIds.length === 0) {
    return new Map<string, string>();
  }

  const params = new URLSearchParams({
    select: "video_id,first_seen_at",
    video_id: inFilter(videoIds)
  });
  const select = await request<Array<{ video_id: string; first_seen_at: string }>>(
    config,
    `videos?${params.toString()}`,
    {
      method: "GET"
    }
  );

  return new Map(select.map((row) => [row.video_id, row.first_seen_at]));
}

export async function upsertVideos(config: UpdaterConfig, videos: PreviewVideo[]) {
  if (videos.length === 0) {
    return;
  }

  const firstSeenMap = await existingFirstSeenMap(
    config,
    videos.map((video) => video.id)
  );
  const rows: VideoRowInsert[] = videos.map((video) => {
    const row = previewVideoToRow(video);
    row.first_seen_at = firstSeenMap.get(video.id) || row.first_seen_at;
    return row;
  });

  await request(config, "videos?on_conflict=video_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });
}

export async function markRemovedVideos(config: UpdaterConfig, videoIds: string[]) {
  if (videoIds.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  const params = new URLSearchParams({
    video_id: inFilter(videoIds)
  });

  await request(config, `videos?${params.toString()}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      status: "removed",
      updated_at: now,
      last_checked_at: now
    })
  });
}

export async function fetchStats(config: UpdaterConfig) {
  const rows = await request<Array<{ video_id: string }>>(config, "videos?select=video_id&limit=1", {
    method: "GET"
  });
  return {
    hasRows: rows.length > 0
  };
}

export function trustedChannelToRow(channel: TrustedChannel): ChannelRow {
  return {
    channel_id: channel.channelId,
    slug: channel.slug,
    name: channel.name,
    youtube_url: channel.youtubeUrl,
    source_level: channel.sourceLevel,
    leagues: channel.leagues,
    uploads_playlist_id: `UU${channel.channelId.slice(2)}`,
    notes: channel.notes,
    active: true
  };
}
