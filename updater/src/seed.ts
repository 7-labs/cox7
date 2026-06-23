import { seedVideos, trustedChannels } from "../../lib/c7-data.js";
import { uploadsPlaylistId } from "../../lib/inventory-types.js";
import { loadConfig } from "./config.js";
import { log } from "./log.js";
import { upsertChannels, upsertVideos } from "./store.js";

export async function seedInventory(config = loadConfig({ requireNotifications: false, requireYouTube: false })) {
  await upsertChannels(
    config,
    trustedChannels.map((channel) => ({
      channel_id: channel.channelId,
      slug: channel.slug,
      name: channel.name,
      youtube_url: channel.youtubeUrl,
      source_level: channel.sourceLevel,
      leagues: channel.leagues,
      uploads_playlist_id: uploadsPlaylistId(channel.channelId),
      notes: channel.notes,
      active: true
    }))
  );

  await upsertVideos(
    config,
    seedVideos.map((video) => ({
      ...video,
      description: video.description || video.summary,
      source: "curated-seed",
      filterSummary: video.filterSummary || "curated seed bootstrap",
      status: "active",
      firstSeenAt: video.firstSeenAt || video.publishedAt,
      lastCheckedAt: video.lastCheckedAt || video.publishedAt,
      lastVerifiedAt: video.lastVerifiedAt || video.publishedAt,
      updatedAt: video.updatedAt || video.publishedAt
    }))
  );

  log({
    level: "info",
    msg: "Seed inventory upsert complete",
    counts: {
      channels: trustedChannels.length,
      videos: seedVideos.length
    }
  });
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seedInventory().catch((error) => {
    log({
      level: "error",
      msg: "Seed inventory failed",
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  });
}
