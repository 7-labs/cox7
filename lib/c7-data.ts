export type LeagueSlug = "nfl" | "nba" | "mlb" | "nhl" | "soccer" | "draft" | "upcoming";

export const leagueIcons: Record<LeagueSlug, string> = {
  nfl: "🏈",
  nba: "🏀",
  mlb: "⚾",
  nhl: "🏒",
  soccer: "⚽",
  draft: "📋",
  upcoming: "📅"
};

export type PreviewType =
  | "game-preview"
  | "season-preview"
  | "playoff-preview"
  | "draft-preview"
  | "upcoming-live"
  | "official-trailer";

export type SourceLevel = "league-official" | "network-official" | "trusted-sports-channel";

export type PreviewVideo = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  channelTitle: string;
  channelId: string;
  league: LeagueSlug;
  type: PreviewType;
  sourceLevel: SourceLevel;
  publishedAt: string;
  summary: string;
  tags: string[];
  thumbnailUrl?: string;
  durationSeconds?: number;
  viewCount?: number;
  privacyStatus?: string;
  embeddable?: boolean;
  liveBroadcastContent?: string;
  source?: "curated-seed" | "youtube-api";
  filterSummary?: string;
  status?: "active" | "hidden" | "removed";
  firstSeenAt?: string;
  lastCheckedAt?: string;
  lastVerifiedAt?: string;
  updatedAt?: string;
};

export type LeaguePage = {
  slug: LeagueSlug;
  path: string;
  name: string;
  title: string;
  description: string;
  keywords: string[];
  primaryIntent: string;
};

export type TrustedChannel = {
  slug: string;
  name: string;
  channelId: string;
  youtubeUrl: string;
  sourceLevel: SourceLevel;
  leagues: LeagueSlug[];
  notes: string;
};

export const site = {
  name: "C7 Sports Previews",
  shortName: "C7 Previews",
  domain: "cox7.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cox7.com",
  description:
    "Find official and trusted sports preview videos from YouTube: game previews, season previews, draft previews, playoff previews, and upcoming sports broadcasts."
};

export const leaguePages: LeaguePage[] = [
  {
    slug: "nfl",
    path: "/nfl-previews/",
    name: "NFL",
    title: "NFL Game Previews",
    description:
      "Track official and trusted NFL game previews, playoff previews, conference championship previews, and weekly matchup videos.",
    keywords: ["nfl preview", "nfl game preview", "super bowl preview", "nfl playoff preview"],
    primaryIntent: "Find the newest official NFL matchup preview before a game."
  },
  {
    slug: "nba",
    path: "/nba-previews/",
    name: "NBA",
    title: "NBA Game and Draft Previews",
    description:
      "Find NBA game previews, NBA Finals previews, draft preview videos, and official league or network pregame analysis.",
    keywords: ["nba preview", "nba draft preview", "nba finals preview", "nba game preview"],
    primaryIntent: "Find recent NBA preview videos without searching across noisy clips."
  },
  {
    slug: "mlb",
    path: "/mlb-previews/",
    name: "MLB",
    title: "MLB Season and Game Previews",
    description:
      "Discover MLB season previews, game previews, postseason previews, and trusted baseball analysis videos.",
    keywords: ["mlb preview", "mlb season preview", "world series preview", "mlb game preview"],
    primaryIntent: "Find MLB season or matchup preview videos from official and trusted sources."
  },
  {
    slug: "nhl",
    path: "/nhl-previews/",
    name: "NHL",
    title: "NHL Playoff and Game Previews",
    description:
      "Follow NHL playoff previews, Stanley Cup preview videos, official trailers, and trusted hockey preview clips.",
    keywords: ["nhl preview", "stanley cup preview", "nhl playoff preview", "nhl game preview"],
    primaryIntent: "Find official NHL playoff and game preview videos quickly."
  },
  {
    slug: "soccer",
    path: "/soccer-previews/",
    name: "Soccer",
    title: "Soccer Match Previews",
    description:
      "Find soccer match previews, World Cup previews, Champions League previews, Premier League matchweek previews, and trusted football preview videos.",
    keywords: ["soccer preview", "match preview", "champions league preview", "world cup preview", "premier league preview"],
    primaryIntent: "Find the newest trusted soccer match preview before kickoff."
  },
  {
    slug: "draft",
    path: "/draft-previews/",
    name: "Drafts",
    title: "Sports Draft Preview Videos",
    description:
      "A dedicated page for NBA Draft, NFL Draft, MLB Draft, and other sports draft preview videos.",
    keywords: ["draft preview", "nba draft preview", "nfl draft preview", "mlb draft preview"],
    primaryIntent: "Find sports draft preview videos by league and source."
  },
  {
    slug: "upcoming",
    path: "/upcoming-live-sports/",
    name: "Upcoming",
    title: "Upcoming Sports Videos",
    description:
      "Find upcoming live sports broadcasts, watch-party previews, pregame shows, and official YouTube sports streams when available.",
    keywords: ["upcoming sports videos", "upcoming live sports", "sports preview video", "pregame show"],
    primaryIntent: "Find upcoming sports video pages that are safe to open on YouTube."
  }
];

export const trustedChannels: TrustedChannel[] = [
  {
    slug: "nfl",
    name: "NFL",
    channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg",
    youtubeUrl: "https://www.youtube.com/@NFL",
    sourceLevel: "league-official",
    leagues: ["nfl"],
    notes: "League channel; prioritize for NFL preview and playoff preview discovery."
  },
  {
    slug: "nba-on-espn",
    name: "NBA on ESPN",
    channelId: "UCVSSpcmZD2PwPBqb8yKQKBA",
    youtubeUrl: "https://www.youtube.com/@nbaonespn",
    sourceLevel: "network-official",
    leagues: ["nba", "draft"],
    notes: "Network channel; useful for NBA Today, draft, Finals, and matchup preview coverage."
  },
  {
    slug: "mlb-network",
    name: "MLB Network",
    channelId: "UCnfdlSStduhKXE9Qp9-edsA",
    youtubeUrl: "https://www.youtube.com/@MLBNetwork",
    sourceLevel: "network-official",
    leagues: ["mlb"],
    notes: "Network channel; useful for season previews, predictions, and pregame analysis."
  },
  {
    slug: "mlb",
    name: "MLB",
    channelId: "UCoLrcjPV5PbUrUyXq5mjc_A",
    youtubeUrl: "https://www.youtube.com/@MLB",
    sourceLevel: "league-official",
    leagues: ["mlb"],
    notes: "League channel; prioritize when official MLB video results match preview intent."
  },
  {
    slug: "nhl",
    name: "NHL",
    channelId: "UCqFMzb-4AUf6WAIbl132QKA",
    youtubeUrl: "https://www.youtube.com/@NHL",
    sourceLevel: "league-official",
    leagues: ["nhl"],
    notes: "League channel; useful for Stanley Cup, playoff, and official trailer videos."
  },
  {
    slug: "espn",
    name: "ESPN",
    channelId: "UCiWLfSweyRNmLpgEHekhoAg",
    youtubeUrl: "https://www.youtube.com/@espn",
    sourceLevel: "network-official",
    leagues: ["nfl", "nba", "mlb", "nhl", "draft", "upcoming"],
    notes: "Network channel; allow only when title and description match preview intent."
  },
  {
    slug: "espn-fc",
    name: "ESPN FC",
    channelId: "UC6c1z7bA__85CIWZ_jpCK-Q",
    youtubeUrl: "https://www.youtube.com/@ESPNFC",
    sourceLevel: "network-official",
    leagues: ["soccer"],
    notes: "Soccer network channel; match previews, World Cup and Champions League preview coverage."
  },
  {
    slug: "cbs-golazo",
    name: "CBS Sports Golazo",
    channelId: "UCET00YnetHT7tOpu12v8jxg",
    youtubeUrl: "https://www.youtube.com/@CBSSportsGolazo",
    sourceLevel: "network-official",
    leagues: ["soccer"],
    notes: "Soccer network channel; matchday previews and pre-match analysis."
  },
  {
    slug: "premier-league",
    name: "Premier League",
    channelId: "UCG5qGWdu8nIRZqJ_GgDwQ-w",
    youtubeUrl: "https://www.youtube.com/@premierleague",
    sourceLevel: "league-official",
    leagues: ["soccer"],
    notes: "League channel; prioritize for Premier League matchweek preview discovery."
  }
];

export const previewTypes: Array<{ value: PreviewType | "all"; label: string; description: string }> = [
  { value: "all", label: "All preview types", description: "Game, season, draft, playoff, upcoming, and official trailer videos." },
  { value: "game-preview", label: "Game preview", description: "Matchup previews and pregame analysis." },
  { value: "season-preview", label: "Season preview", description: "Season outlooks, predictions, and team previews." },
  { value: "playoff-preview", label: "Playoff preview", description: "Playoff, Finals, and championship preview videos." },
  { value: "draft-preview", label: "Draft preview", description: "Draft boards, prospect previews, and team fit videos." },
  { value: "upcoming-live", label: "Upcoming live", description: "Upcoming live broadcasts and pregame shows on YouTube." },
  { value: "official-trailer", label: "Official trailer", description: "Official promotional trailers from league or network channels." }
];

export const seedVideos: PreviewVideo[] = [
  {
    id: "_xh2Y2-yRhE",
    slug: "los-angeles-rams-vs-seattle-seahawks-nfc-championship-game-preview-_xh2Y2-yRhE",
    title: "Los Angeles Rams vs Seattle Seahawks | NFC Championship Game Preview",
    channelTitle: "NFL",
    channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg",
    league: "nfl",
    type: "game-preview",
    sourceLevel: "league-official",
    publishedAt: "2026-01-20T20:00:29Z",
    summary:
      "Official NFL matchup preview page for a Rams-Seahawks NFC Championship game video, embedded from YouTube with source attribution.",
    tags: ["NFL", "Rams", "Seahawks", "NFC Championship", "game preview"]
  },
  {
    id: "H9UtsZaTft0",
    slug: "buffalo-bills-vs-denver-broncos-divisional-round-game-preview-H9UtsZaTft0",
    title: "Buffalo Bills vs Denver Broncos | 2025 Divisional Round Game Preview",
    channelTitle: "NFL",
    channelId: "UCDVYQ4Zhbm3S2dlz7P1GBDg",
    league: "nfl",
    type: "playoff-preview",
    sourceLevel: "league-official",
    publishedAt: "2026-01-13T21:30:03Z",
    summary:
      "Official NFL playoff preview discovery entry for Bills-Broncos divisional round coverage.",
    tags: ["NFL", "Bills", "Broncos", "playoff preview", "divisional round"]
  },
  {
    id: "RWLO4wgorkg",
    slug: "nba-draft-preview-best-options-for-clippers-mavs-thunder-RWLO4wgorkg",
    title: "NBA Draft Preview: Best options for Clippers, Mavs & Thunder | NBA Today",
    channelTitle: "NBA on ESPN",
    channelId: "UCVSSpcmZD2PwPBqb8yKQKBA",
    league: "draft",
    type: "draft-preview",
    sourceLevel: "network-official",
    publishedAt: "2026-06-17T20:23:21Z",
    summary:
      "NBA Draft preview video from NBA on ESPN focused on team options and draft-night storylines.",
    tags: ["NBA", "NBA Draft", "Clippers", "Mavericks", "Thunder", "draft preview"]
  },
  {
    id: "eTP1t_cQpoE",
    slug: "2026-mlb-season-predictions-the-leadoff-spot-eTP1t_cQpoE",
    title: "2026 MLB Season Predictions! | The Leadoff Spot",
    channelTitle: "MLB Network",
    channelId: "UCnfdlSStduhKXE9Qp9-edsA",
    league: "mlb",
    type: "season-preview",
    sourceLevel: "network-official",
    publishedAt: "2026-03-25T15:10:31Z",
    summary:
      "MLB Network season preview and prediction video for baseball fans researching the new season.",
    tags: ["MLB", "MLB Network", "season preview", "predictions", "The Leadoff Spot"]
  },
  {
    id: "LooIUUFHoD0",
    slug: "nhl-82-games-is-just-the-beginning-LooIUUFHoD0",
    title: "82 Games is Just the Beginning",
    channelTitle: "NHL",
    channelId: "UCqFMzb-4AUf6WAIbl132QKA",
    league: "nhl",
    type: "official-trailer",
    sourceLevel: "league-official",
    publishedAt: "2026-04-17T19:00:21Z",
    summary:
      "Official NHL playoff promotional video that fits fans searching for Stanley Cup playoff preview content.",
    tags: ["NHL", "Stanley Cup", "playoffs", "official trailer"]
  },
  {
    id: "G4jTiPy41EA",
    slug: "2025-nhl-stanley-cup-playoffs-begin-this-is-forever-G4jTiPy41EA",
    title: "2025 NHL Stanley Cup Playoffs Begin! This is Forever",
    channelTitle: "NHL",
    channelId: "UCqFMzb-4AUf6WAIbl132QKA",
    league: "nhl",
    type: "playoff-preview",
    sourceLevel: "league-official",
    publishedAt: "2025-04-18T14:00:34Z",
    summary:
      "Official NHL Stanley Cup Playoffs preview video for fans browsing historical playoff hype and preview pages.",
    tags: ["NHL", "Stanley Cup", "playoff preview", "official video"]
  }
];

export const allowedChannelIds = new Set(trustedChannels.map((channel) => channel.channelId));

export const previewIntentTerms = [
  "preview",
  "pregame",
  "pre-game",
  "season preview",
  "game preview",
  "match preview",
  "finals preview",
  "playoff preview",
  "draft preview",
  "official trailer",
  "upcoming",
  "watch party",
  "live preview"
];

export const blockedTerms = [
  "full game",
  "full match",
  "free stream",
  "stream free",
  "pirated",
  "leaked",
  "sportsbook",
  "betting odds",
  "odds picks",
  "prediction picks"
];

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function youtubeThumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function getVideoBySlug(slug: string) {
  return seedVideos.find((video) => video.slug === slug);
}

export function getVideoById(videoId: string) {
  return seedVideos.find((video) => video.id === videoId);
}

export function getLeaguePage(slug: LeagueSlug) {
  return leaguePages.find((league) => league.slug === slug);
}

export function getTrustedChannelById(channelId: string) {
  return trustedChannels.find((channel) => channel.channelId === channelId);
}
