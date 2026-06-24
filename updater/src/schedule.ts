import { log } from "./log.js";
import type { ContentStatus, LeagueSlug } from "../../lib/c7-data.js";

// Phase 2 schedule provider. Fetches real game schedules so videos can be bound
// to a concrete event (Stage C) and shown with an accurate match state.
//
// Source: ESPN public scoreboard. `status.type.state` is "pre" | "in" | "post"
// which maps cleanly onto C7's upcoming / live / completed lifecycle. The
// provider is intentionally swappable (see ScheduleProvider) and always fails
// soft: on any error it returns [] so the updater never breaks on a bad source.

// cox7 league -> ESPN {sport}/{league} path. Leagues without a single-game
// schedule (draft, upcoming) and soccer (deferred to Stage E, large club space)
// are intentionally unmapped.
const ESPN_LEAGUE_PATH: Partial<Record<LeagueSlug, string>> = {
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  nhl: "hockey/nhl"
};

export function isScheduledLeague(league: LeagueSlug): boolean {
  return league in ESPN_LEAGUE_PATH;
}

export type ScheduleTeam = {
  id: string;
  displayName: string;
  location: string;
  name: string;
  abbreviation: string;
  shortDisplayName: string;
  /** Normalized, de-duplicated alias tokens used to match a team in a title. */
  aliases: string[];
};

export type ScheduleEvent = {
  id: string;
  league: LeagueSlug;
  leagueKey: string;
  /** UTC ISO start time of the game. */
  startTime: string;
  /** Snapshot status at fetch time; the read path recomputes from startTime. */
  status: ContentStatus;
  home: ScheduleTeam;
  away: ScheduleTeam;
};

export interface ScheduleProvider {
  readonly name: string;
  supports(league: LeagueSlug): boolean;
  fetchWindow(league: LeagueSlug, fromIso: string, toIso: string): Promise<ScheduleEvent[]>;
}

// --- ESPN response shapes (only the fields we read) -----------------------
type EspnTeam = {
  id?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  name?: string;
  location?: string;
};

type EspnCompetitor = {
  homeAway?: string;
  team?: EspnTeam;
};

type EspnEvent = {
  id?: string;
  date?: string;
  status?: { type?: { state?: string; completed?: boolean } };
  competitions?: Array<{ competitors?: EspnCompetitor[] }>;
};

type EspnScoreboard = {
  events?: EspnEvent[];
};

// --- helpers --------------------------------------------------------------
export function normalizeAlias(value: string): string {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapState(state?: string, completed?: boolean): ContentStatus {
  if (state === "in") return "live";
  if (state === "post" || completed) return "completed";
  return "upcoming";
}

function toEspnDate(iso: string): string {
  // YYYY-MM-DD... -> YYYYMMDD (UTC). ESPN `dates` accepts a single day or a
  // `YYYYMMDD-YYYYMMDD` range.
  return iso.slice(0, 10).replace(/-/g, "");
}

function buildTeam(team: EspnTeam | undefined): ScheduleTeam | null {
  if (!team) return null;

  const displayName = team.displayName || "";
  const location = team.location || "";
  const name = team.name || "";
  const abbreviation = team.abbreviation || "";
  const shortDisplayName = team.shortDisplayName || "";

  const aliasSet = new Set(
    [displayName, shortDisplayName, name, location, abbreviation, `${location} ${name}`.trim()]
      .map(normalizeAlias)
      .filter((alias) => alias.length >= 2)
  );

  if (aliasSet.size === 0) return null;

  return {
    id: team.id || "",
    displayName,
    location,
    name,
    abbreviation,
    shortDisplayName,
    aliases: [...aliasSet]
  };
}

function parseEvent(event: EspnEvent, league: LeagueSlug, leagueKey: string): ScheduleEvent | null {
  const id = event.id;
  const startTime = event.date;
  if (!id || !startTime) return null;

  const competitors = event.competitions?.[0]?.competitors || [];
  const homeRaw = competitors.find((c) => c.homeAway === "home");
  const awayRaw = competitors.find((c) => c.homeAway === "away");

  const home = buildTeam(homeRaw?.team);
  const away = buildTeam(awayRaw?.team);
  if (!home || !away) return null;

  return {
    id,
    league,
    leagueKey,
    startTime: new Date(startTime).toISOString(),
    status: mapState(event.status?.type?.state, event.status?.type?.completed),
    home,
    away
  };
}

const RETRY_BACKOFFS_MS = [400, 1500];
const REQUEST_TIMEOUT_MS = 10_000;

async function fetchScoreboard(url: string): Promise<EspnScoreboard | null> {
  for (let attempt = 0; attempt <= RETRY_BACKOFFS_MS.length; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      if (response.ok) {
        return (await response.json()) as EspnScoreboard;
      }
      if (attempt === RETRY_BACKOFFS_MS.length || (response.status < 500 && response.status !== 429)) {
        return null;
      }
    } catch {
      if (attempt === RETRY_BACKOFFS_MS.length) return null;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFFS_MS[attempt]));
  }
  return null;
}

// In-run cache: one ESPN call per (league, dates) per updater run.
const runCache = new Map<string, ScheduleEvent[]>();

async function fetchByDates(league: LeagueSlug, dates: string): Promise<ScheduleEvent[]> {
  const leagueKey = ESPN_LEAGUE_PATH[league];
  if (!leagueKey) return [];

  const cacheKey = `${leagueKey}|${dates}`;
  const cached = runCache.get(cacheKey);
  if (cached) return cached;

  const url = `https://site.api.espn.com/apis/site/v2/sports/${leagueKey}/scoreboard?dates=${dates}&limit=200`;
  const board = await fetchScoreboard(url);
  if (!board) {
    log({ level: "warn", msg: "Schedule fetch failed", channel: leagueKey });
    runCache.set(cacheKey, []);
    return [];
  }

  const events = (board.events || [])
    .map((event) => parseEvent(event, league, leagueKey))
    .filter((event): event is ScheduleEvent => event !== null);

  runCache.set(cacheKey, events);
  return events;
}

export const espnProvider: ScheduleProvider = {
  name: "espn-scoreboard",
  supports: isScheduledLeague,
  async fetchWindow(league, fromIso, toIso) {
    if (!isScheduledLeague(league)) return [];
    const from = toEspnDate(fromIso);
    const to = toEspnDate(toIso);
    const dates = from === to ? from : `${from}-${to}`;
    return fetchByDates(league, dates);
  }
};

/** Test/diagnostics hook: clear the per-run schedule cache. */
export function resetScheduleCache(): void {
  runCache.clear();
}
