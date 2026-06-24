import { trustedChannels } from "../../lib/c7-data.js";
import { type PreviewVideo } from "../../lib/c7-data.js";
import { toPreviewVideo, type YouTubeVideoItem } from "../../lib/verify.js";
import { loadConfig, publicConfig } from "./config.js";
import { log } from "./log.js";
import { matchVideosToEvents, type MatchReport } from "./match.js";
import { pingKuma, triggerDeployHook } from "./notify.js";
import { seedInventory } from "./seed.js";
import { createUpdateRun, finishUpdateRun, markRemovedVideos, trustedChannelToRow, upsertChannels, upsertVideos } from "./store.js";
import { getVideoDetails, listRecentUploads, type QuotaTracker } from "./youtube.js";

type RunSummary = {
  channelsTotal: number;
  channelsOk: number;
  videosSeen: number;
  videosUpserted: number;
  videosRemoved: number;
  quotaUnitsEstimated: number;
  status: "success" | "partial" | "failed";
  error?: string;
  eventMatch?: MatchReport;
  channels: Array<{
    channel: string;
    uploads: number;
    verified: number;
    removed: number;
    candidateVideoIds: string[];
    error?: string;
  }>;
};

function parseFlags(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run"),
    seedOnly: argv.includes("--seed")
  };
}

function loadUpdaterEnvFile() {
  try {
    process.loadEnvFile?.(".env");
  } catch {
    // Ignore missing local env files. Docker and OpenClaw may inject vars differently.
  }
}

function explicitRemovalIds(items: YouTubeVideoItem[]) {
  const removed = new Set<string>();

  for (const item of items) {
    const itemId = item.id;
    if (!itemId) {
      continue;
    }

    const privacyStatus = item.status?.privacyStatus || "private";
    if (privacyStatus !== "public" || item.status?.embeddable !== true) {
      removed.add(itemId);
    }
  }

  return [...removed];
}

async function sweep(config = loadConfig(), dryRun = false): Promise<RunSummary> {
  const tracker: QuotaTracker = {
    current: 0,
    max: config.updaterMaxQuotaUnits
  };
  const startedAt = Date.now();
  let channelsOk = 0;
  let videosSeen = 0;
  const verifiedVideos: PreviewVideo[] = [];
  const removedIds = new Set<string>();
  const channelErrors: string[] = [];
  const channelSummaries: RunSummary["channels"] = [];

  if (!dryRun) {
    await upsertChannels(config, trustedChannels.map(trustedChannelToRow));
  }

  for (const channel of trustedChannels) {
    const channelStarted = Date.now();

    try {
      const uploads = await listRecentUploads(`UU${channel.channelId.slice(2)}`, config, tracker);
      const candidateVideoIds = uploads.map((candidate) => candidate.videoId);
      videosSeen += uploads.length;
      const detailItems = (await getVideoDetails(
        candidateVideoIds,
        config,
        tracker
      )) as YouTubeVideoItem[];

      const removedForChannel = explicitRemovalIds(detailItems);
      removedForChannel.forEach((id) => removedIds.add(id));

      const verified = detailItems
        .map((item) => toPreviewVideo(item, "all", "all", new Date().toISOString()))
        .filter((video): video is PreviewVideo => Boolean(video));

      verifiedVideos.push(...verified);
      channelsOk += 1;
      channelSummaries.push({
        channel: channel.slug,
        uploads: uploads.length,
        verified: verified.length,
        removed: removedForChannel.length,
        candidateVideoIds
      });

      log({
        level: "info",
        msg: "Channel sweep complete",
        channel: channel.slug,
        counts: {
          uploads: uploads.length,
          verified: verified.length
        },
        quota: tracker.current,
        durationMs: Date.now() - channelStarted
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      channelErrors.push(`${channel.slug}: ${message}`);
      channelSummaries.push({
        channel: channel.slug,
        uploads: 0,
        verified: 0,
        removed: 0,
        candidateVideoIds: [],
        error: message
      });
      log({
        level: "error",
        msg: "Channel sweep failed",
        channel: channel.slug,
        quota: tracker.current,
        durationMs: Date.now() - channelStarted,
        error: message
      });
    }
  }

  const dedupedVideos = Array.from(new Map(verifiedVideos.map((video) => [video.id, video])).values());

  // Phase 2: bind videos to real games for accurate match status. Fails soft —
  // on any error the original (unbound) videos are used so inventory is never lost.
  let videosToStore = dedupedVideos;
  let eventMatch: MatchReport | undefined;
  try {
    const matched = await matchVideosToEvents(dedupedVideos);
    videosToStore = matched.videos;
    eventMatch = matched.report;
    log({
      level: "info",
      msg: "Event matching complete",
      counts: {
        eligible: eventMatch.eligible,
        strong: eventMatch.matchedStrong,
        weak: eventMatch.matchedWeak
      }
    });
  } catch (error) {
    log({
      level: "warn",
      msg: "Event matching skipped",
      error: error instanceof Error ? error.message : String(error)
    });
  }

  if (!dryRun) {
    await upsertVideos(config, videosToStore);
    await markRemovedVideos(config, [...removedIds]);
  }

  const status: RunSummary["status"] =
    channelsOk === trustedChannels.length ? "success" : channelsOk > 0 ? "partial" : "failed";

  log({
    level: status === "failed" ? "error" : status === "partial" ? "warn" : "info",
    msg: "Updater sweep finished",
    counts: {
      channelsTotal: trustedChannels.length,
      channelsOk,
      videosSeen,
      videosUpserted: dedupedVideos.length,
      videosRemoved: removedIds.size
    },
    quota: tracker.current,
    durationMs: Date.now() - startedAt,
    error: channelErrors.length > 0 ? channelErrors.join(" | ") : undefined
  });

  return {
    channelsTotal: trustedChannels.length,
    channelsOk,
    videosSeen,
    videosUpserted: videosToStore.length,
    videosRemoved: removedIds.size,
    quotaUnitsEstimated: tracker.current,
    status,
    error: channelErrors.length > 0 ? channelErrors.join(" | ") : undefined,
    eventMatch,
    channels: channelSummaries
  };
}

async function main() {
  loadUpdaterEnvFile();
  const flags = parseFlags(process.argv.slice(2));
  const config = flags.seedOnly
    ? loadConfig({ requireNotifications: false, requireSupabase: true, requireYouTube: false })
    : loadConfig({
        requireNotifications: false,
        requireSupabase: !flags.dryRun,
        requireYouTube: !flags.dryRun
      });

  log({
    level: "info",
    msg: "Resolved updater config",
    counts: {
      updaterMaxQuotaUnits: config.updaterMaxQuotaUnits,
      updaterLookbackDays: config.updaterLookbackDays,
      updaterPerChannelMax: config.updaterPerChannelMax
    }
  });

  if (flags.seedOnly) {
    await seedInventory(config);
    return 0;
  }

  if (flags.dryRun) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "dry-run",
          config: publicConfig(config)
        },
        null,
        2
      )}\n`
    );

    if (!config.youtubeApiKey) {
      return 0;
    }

    const summary = await sweep(config, true);
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "dry-run",
          config: publicConfig(config),
          summary
        },
        null,
        2
      )}\n`
    );
    return summary.status === "success" ? 0 : summary.status === "partial" ? 1 : 2;
  }

  const run = await createUpdateRun(config);

  try {
    const summary = await sweep(config, false);
    await finishUpdateRun(config, run.id, {
      finished_at: new Date().toISOString(),
      status: summary.status,
      channels_total: summary.channelsTotal,
      channels_ok: summary.channelsOk,
      videos_seen: summary.videosSeen,
      videos_upserted: summary.videosUpserted,
      videos_removed: summary.videosRemoved,
      quota_units_estimated: summary.quotaUnitsEstimated,
      error: summary.error || null
    });

    if (summary.status === "success" || summary.status === "partial") {
      await pingKuma(config, "up", `cox7 updater ${summary.status}`);
      await triggerDeployHook(config);
    }

    return summary.status === "success" ? 0 : summary.status === "partial" ? 1 : 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await finishUpdateRun(config, run.id, {
      finished_at: new Date().toISOString(),
      status: "failed",
      error: message
    });

    log({
      level: "error",
      msg: "Updater run failed",
      error: message
    });

    return 2;
  }
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    log({
      level: "error",
      msg: "Updater bootstrap failed",
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(2);
  });
