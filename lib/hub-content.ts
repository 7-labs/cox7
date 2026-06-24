import { type LeagueSlug } from "@/lib/c7-data";

export type HubFaq = { q: string; a: string };
export type HubContent = { answer: string; faqs: HubFaq[] };

// Answer-first copy + FAQs per hub. Used by components/LeagueLanding.tsx to give
// each league/draft/upcoming page a unique, citable (GEO/AEO) answer block and
// FAQPage schema instead of a single templated sentence.
export const hubContent: Partial<Record<LeagueSlug, HubContent>> = {
  nfl: {
    answer:
      "This page collects official and trusted NFL preview videos — matchup previews, playoff and conference-championship breakdowns, and Super Bowl previews — from league and major network YouTube channels. It is built for fans who want a pregame preview before kickoff without scrolling past full-game replays, betting promos, or reaction clips. C7 embeds each video from YouTube and links to the canonical source; it never hosts or mirrors footage.",
    faqs: [
      { q: "What NFL videos show up here?", a: "Preview, pregame, playoff, and matchup videos from official NFL and trusted network channels that are public and embeddable." },
      { q: "Does C7 show full NFL game replays?", a: "No. Full-game copies, leaked broadcasts, and betting-only clips are filtered out by design." },
      { q: "How fresh are the previews?", a: "A daily updater refreshes the verified inventory; the most recent run date is shown near the finder." }
    ]
  },
  nba: {
    answer:
      "This page surfaces official and trusted NBA preview videos — game previews, Finals previews, and league or network pregame analysis. Draft-specific previews live on the dedicated Sports Draft Previews page, which this hub links to. Every result is an embeddable YouTube video from a whitelisted source, shown with clear attribution.",
    faqs: [
      { q: "What NBA videos appear here?", a: "Game previews, Finals previews, and pregame analysis from official NBA and trusted network channels." },
      { q: "Where are NBA Draft previews?", a: "On the dedicated Sports Draft Previews page, so draft and game intent stay cleanly separated." }
    ]
  },
  mlb: {
    answer:
      "This page gathers official and trusted MLB preview videos — season previews and predictions, matchup previews, and postseason previews — from league and network YouTube channels. It is aimed at fans researching a series or the season ahead, not full-game replays. Each video is embedded from YouTube and attributed to its source channel.",
    faqs: [
      { q: "What MLB videos are listed?", a: "Season previews, predictions, game previews, and postseason previews from official MLB and trusted network channels." },
      { q: "Does C7 include full baseball games?", a: "No — only preview-intent, public, embeddable videos; full games and piracy-intent results are excluded." }
    ]
  },
  nhl: {
    answer:
      "This page collects official and trusted NHL preview videos — playoff previews, Stanley Cup previews, official trailers, and game previews — from league and network channels. It helps hockey fans find pregame and playoff hype quickly without sifting through replays. C7 embeds and links each video; it does not download or mirror media.",
    faqs: [
      { q: "What NHL videos show up here?", a: "Playoff, Stanley Cup, official-trailer, and game-preview videos from official NHL and trusted channels." },
      { q: "Are these live game streams?", a: "No. C7 lists preview-intent YouTube videos, not live or replayed game broadcasts." }
    ]
  },
  soccer: {
    answer:
      "This page finds official and trusted soccer match previews — Premier League matchweek previews, Champions League and World Cup previews, and pre-match analysis — from league and network YouTube channels. It is built for fans looking for a preview before kickoff, not full-match replays or unauthorized streams. Each result is embedded from YouTube with source attribution.",
    faqs: [
      { q: "Which competitions are covered?", a: "Premier League, Champions League, World Cup, and other fixtures covered by trusted league and network channels." },
      { q: "Does C7 stream matches?", a: "No. C7 only links to and embeds official or trusted preview videos; full matches and free-stream results are excluded." }
    ]
  },
  draft: {
    answer:
      "This page is dedicated to sports draft preview videos across the NBA, NFL, and MLB drafts — prospect breakdowns, mock-draft analysis, and team-fit previews — from official and trusted channels. It keeps draft intent separate from regular game previews so each page answers one clear question. Every video is embedded from YouTube and attributed to its source.",
    faqs: [
      { q: "Which drafts are covered?", a: "NBA, NFL, and MLB draft previews, including prospect and team-fit videos from trusted sources." },
      { q: "Why a separate draft page?", a: "Draft search intent differs from game-preview intent, so a dedicated page serves it better and avoids overlap with the league hubs." }
    ]
  },
  upcoming: {
    answer:
      "This page focuses on upcoming sports videos — pregame shows, watch-party previews, and official broadcast previews scheduled on YouTube. It separates upcoming, forward-looking discovery from completed previews and full-game replays. C7 only lists trusted, public, embeddable videos and never streams or mirrors live game footage.",
    faqs: [
      { q: "What does upcoming mean here?", a: "Pregame, preview, and official-trailer videos for events that are upcoming or live, not completed-game replays." },
      { q: "Does C7 provide live streams?", a: "No. C7 links to official or trusted YouTube videos only and excludes unauthorized streams." }
    ]
  }
};
