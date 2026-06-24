import { espnProvider, isScheduledLeague, normalizeAlias, type ScheduleEvent, type ScheduleProvider, type ScheduleTeam } from "./schedule.js";
import { log } from "./log.js";
import type { LeagueSlug, PreviewVideo } from "../../lib/c7-data.js";

// Stage C: bind a preview video to a concrete scheduled game.
//
// Strategy: parse team names from the video title, look at the games for that
// league in a window around the publish date, and bind only when BOTH teams of
// a single game appear in the title ("strong"). A one-team hit ("weak") is
// recorded for visibility but NOT bound, to keep precision high (city-only
// aliases like "new york" are ambiguous across teams). Unbound videos keep the
// Phase 1 liveBroadcastContent-derived status.

const WINDOW_BEHIND_DAYS = 2;
const WINDOW_AHEAD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
// Penalty (ms) applied to games that started before the preview was published,
// so we prefer the soonest upcoming game when a team has several in the window.
const PAST_GAME_PENALTY_MS = 60 * DAY_MS;

export type MatchReport = {
  total: number;
  eligible: number;
  matchedStrong: number;
  matchedWeak: number;
  byLeague: Record<string, { eligible: number; strong: number; weak: number }>;
};

// A team is "in the title" when one of its non-trivial aliases appears as a
// whole token-run. Drop very short aliases (abbreviations) unless multi-word —
// they cause false positives against ordinary title words.
function matchableAliases(team: ScheduleTeam): string[] {
  return team.aliases.filter((alias) => alias.length >= 4 || alias.includes(" "));
}

function teamInTitle(team: ScheduleTeam, paddedTitle: string): boolean {
  return matchableAliases(team).some((alias) => paddedTitle.includes(` ${alias} `));
}

type Candidate = {
  event: ScheduleEvent;
  confidence: "strong" | "weak";
};

function scoreEvents(events: ScheduleEvent[], paddedTitle: string): Candidate[] {
  const candidates: Candidate[] = [];
  for (const event of events) {
    const home = teamInTitle(event.home, paddedTitle);
    const away = teamInTitle(event.away, paddedTitle);
    if (home && away) {
      candidates.push({ event, confidence: "strong" });
    } else if (home || away) {
      candidates.push({ event, confidence: "weak" });
    }
  }
  return candidates;
}

function pickBest(candidates: Candidate[], publishedMs: number): Candidate | null {
  const strong = candidates.filter((candidate) => candidate.confidence === "strong");
  const pool = strong.length > 0 ? strong : [];
  if (pool.length === 0) return null;

  // Prefer the soonest game at/after publish; otherwise the closest past game.
  let best: Candidate | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of pool) {
    const startMs = new Date(candidate.event.startTime).getTime();
    const distance = startMs >= publishedMs ? startMs - publishedMs : publishedMs - startMs + PAST_GAME_PENALTY_MS;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

function bindEvent(video: PreviewVideo, event: ScheduleEvent): PreviewVideo {
  return {
    ...video,
    eventId: event.id,
    eventLeague: event.leagueKey,
    eventStartTime: event.startTime,
    eventStatus: event.status,
    homeTeam: event.home.displayName,
    awayTeam: event.away.displayName,
    eventMatch: "strong"
  };
}

function emptyReport(total: number): MatchReport {
  return { total, eligible: 0, matchedStrong: 0, matchedWeak: 0, byLeague: {} };
}

function bumpLeague(report: MatchReport, league: LeagueSlug) {
  report.byLeague[league] ??= { eligible: 0, strong: 0, weak: 0 };
  return report.byLeague[league];
}

export async function matchVideosToEvents(
  videos: PreviewVideo[],
  provider: ScheduleProvider = espnProvider
): Promise<{ videos: PreviewVideo[]; report: MatchReport }> {
  const report = emptyReport(videos.length);
  const out: PreviewVideo[] = [];

  for (const video of videos) {
    if (!isScheduledLeague(video.league)) {
      out.push(video);
      continue;
    }

    report.eligible += 1;
    const leagueStats = bumpLeague(report, video.league);
    leagueStats.eligible += 1;

    try {
      const publishedMs = new Date(video.publishedAt).getTime();
      const fromIso = new Date(publishedMs - WINDOW_BEHIND_DAYS * DAY_MS).toISOString();
      const toIso = new Date(publishedMs + WINDOW_AHEAD_DAYS * DAY_MS).toISOString();

      const events = await provider.fetchWindow(video.league, fromIso, toIso);
      const paddedTitle = ` ${normalizeAlias(video.title)} `;
      const candidates = scoreEvents(events, paddedTitle);
      const best = pickBest(candidates, publishedMs);

      if (best) {
        report.matchedStrong += 1;
        leagueStats.strong += 1;
        out.push(bindEvent(video, best.event));
      } else {
        if (candidates.some((candidate) => candidate.confidence === "weak")) {
          report.matchedWeak += 1;
          leagueStats.weak += 1;
        }
        out.push(video);
      }
    } catch (error) {
      // Fail soft: a matching error must never drop the video from inventory.
      log({
        level: "warn",
        msg: "Event match failed",
        channel: video.league,
        error: error instanceof Error ? error.message : String(error)
      });
      out.push(video);
    }
  }

  return { videos: out, report };
}
