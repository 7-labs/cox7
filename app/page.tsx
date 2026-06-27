import Link from "next/link";
import Icon from "@/components/Icon";
import PreviewFinder from "@/components/PreviewFinder";
import VideoCard from "@/components/VideoCard";
import { leagueIcons, leaguePages, site, trustedChannels, type LeagueSlug, type PreviewType } from "@/lib/c7-data";
import { getInventoryStats, getVideos } from "@/lib/inventory";
import { filterByStatus, isLeagueSlug, isPreviewType, safeQuery } from "@/lib/search";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      description: site.description,
      potentialAction: {
        "@type": "SearchAction",
        target: `${site.url}/search/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: `${site.url}/icon.svg`,
      description: site.description
    }
  ]
};

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) || {};
  const query = safeQuery(typeof params.q === "string" ? params.q : null);
  const leagueParam = typeof params.league === "string" ? params.league : null;
  const typeParam = typeof params.type === "string" ? params.type : null;
  const league: LeagueSlug | "all" = leagueParam === "all" ? "all" : isLeagueSlug(leagueParam) ? leagueParam : "all";
  const type: PreviewType | "all" = typeParam === "all" ? "all" : isPreviewType(typeParam) ? typeParam : "all";
  const [{ videos: initialVideos, source }, { videos: latestPool }, stats] = await Promise.all([
    getVideos({ query, league, type }, { limit: 6 }),
    getVideos({}, { limit: 24 }),
    getInventoryStats()
  ]);
  // Split the homepage feed by lifecycle: live now, soonest upcoming, then
  // newest completed. Sections render only when they have content. Dedupe each
  // against the videos the finder already shows up top so no card appears twice.
  const shownIds = new Set(initialVideos.map((video) => video.id));
  const liveVideos = filterByStatus(latestPool, "live").filter((video) => !shownIds.has(video.id));
  const upcomingVideos = filterByStatus(latestPool, "upcoming")
    .filter((video) => !shownIds.has(video.id))
    .sort((a, b) => (a.eventStartTime || "").localeCompare(b.eventStartTime || ""));
  const completedVideos = filterByStatus(latestPool, "completed").filter((video) => !shownIds.has(video.id));
  const finderStatus =
    source === "supabase"
      ? `Showing ${initialVideos.length} verified inventory result${initialVideos.length === 1 ? "" : "s"}.`
      : "Showing trusted example videos while the live preview database refreshes.";
  const lastRunLabel = stats.lastRunAt
    ? new Date(stats.lastRunAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero">
        <div className="hero-head">
          <p className="eyebrow"><Icon name="sparkles" size={15} /> Official Sports Preview Finder</p>
          <h1>Find the next sports preview without the noise.</h1>
          <p className="lead">
            Search a team, league, event, or matchup — and jump straight to an official or trusted, embeddable YouTube preview.
          </p>
          <div className="hero-meta">
            {stats.lastRunAt ? (
              <span className="hero-badge">
                <Icon name="clock" size={14} />
                Inventory updated {lastRunLabel}
              </span>
            ) : null}
            {stats.total ? (
              <span className="hero-badge">
                <Icon name="grid" size={14} />
                {stats.total} verified preview{stats.total === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>

        <div id="finder" className="hero-finder">
          <PreviewFinder
            defaultQuery={query}
            defaultLeague={league}
            defaultType={type}
            initialVideos={initialVideos}
            initialStatus={finderStatus}
          />
        </div>

        <div className="hero-actions hero-actions--center">
          <Link className="btn" href="/sports-previews/">
            <Icon name="grid" size={16} />
            Browse latest previews
          </Link>
          <Link className="secondary-btn" href="/search/">
            <Icon name="search" size={16} />
            Open search page
          </Link>
        </div>

        <div className="trust-strip" aria-label="C7 verification rules">
          <span>
            <Icon name="shield" size={17} />
            <strong>Official-first</strong>
            <small>League, network, and trusted sports channels.</small>
          </span>
          <span>
            <Icon name="embed" size={17} />
            <strong>Embed only</strong>
            <small>No downloads, mirrored files, or replay scraping.</small>
          </span>
          <span>
            <Icon name="trending" size={17} />
            <strong>Indexable paths</strong>
            <small>League, channel, archive, and canonical video pages.</small>
          </span>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow"><Icon name="grid" size={14} /> Browse by intent</p>
        <h2>Built around how sports fans search.</h2>
        <div className="league-grid">
          {leaguePages.map((league) => (
            <Link className="info-card league-card" href={league.path} key={league.slug}>
              <span className="league-icon" aria-hidden="true">{leagueIcons[league.slug]}</span>
              <strong>{league.title}</strong>
              <p>{league.primaryIntent}</p>
              <span className="text-link">
                Open {league.name} previews
                <Icon name="arrow" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {liveVideos.length > 0 ? (
        <section className="section">
          <p className="eyebrow"><span className="status-dot" aria-hidden="true" /> Live now</p>
          <h2>Happening right now.</h2>
          <div className="results-grid">
            {liveVideos.slice(0, 4).map((video, index) => <VideoCard video={video} priority={index === 0} key={video.id} />)}
          </div>
        </section>
      ) : null}

      {upcomingVideos.length > 0 ? (
        <section className="section">
          <p className="eyebrow"><Icon name="clock" size={14} /> Upcoming previews</p>
          <h2>Games still to come.</h2>
          <div className="results-grid">
            {upcomingVideos.slice(0, 4).map((video, index) => <VideoCard video={video} priority={index === 0 && liveVideos.length === 0} key={video.id} />)}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow"><Icon name="play" size={14} /> {liveVideos.length + upcomingVideos.length > 0 ? "Latest completed" : "Latest inventory"}</p>
            <h2>Fresh, verified previews.</h2>
          </div>
          <Link className="secondary-btn" href="/sports-previews/">
            View all previews
            <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="results-grid">
          {completedVideos.length > 0 ? (
            completedVideos.slice(0, 4).map((video, index) => <VideoCard video={video} priority={index === 0 && liveVideos.length + upcomingVideos.length === 0} key={video.id} />)
          ) : (
            <div className="info-card notice">
              <strong>No inventory video yet</strong>
              <p>The site will keep serving trusted example videos until the first verified inventory sync completes.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow"><Icon name="shield" size={14} /> Source policy</p>
        <h2>Not a replay scraper.</h2>
        <div className="feature-grid">
          <div className="info-card feature-card">
            <span className="feature-icon feature-icon--ok"><Icon name="check" size={20} /></span>
            <strong>Allowed</strong>
            <p>Embeddable YouTube previews from official or trusted sports channels.</p>
          </div>
          <div className="info-card feature-card">
            <span className="feature-icon feature-icon--no"><Icon name="cross" size={20} /></span>
            <strong>Filtered out</strong>
            <p>Full-game copies, betting-only clips, leaked video, and piracy-intent searches.</p>
          </div>
          <div className="info-card feature-card">
            <span className="feature-icon"><Icon name="filter" size={20} /></span>
            <strong>Independent value</strong>
            <p>Tags, league pages, channel context, archive routing, and preview-type filters.</p>
          </div>
          <div className="info-card feature-card">
            <span className="feature-icon"><Icon name="zap" size={20} /></span>
            <strong>Ready to automate</strong>
            <p>The updater writes verified inventory daily so the request path stays independent from YouTube.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow"><Icon name="youtube" size={14} /> Trusted channel starter list</p>
        <h2>Small whitelist first, then expand safely.</h2>
        <div className="channel-grid">
          {trustedChannels.slice(0, 4).map((channel) => (
            <div className="info-card channel-card" key={channel.channelId}>
              <span className="channel-mark" aria-hidden="true">{leagueIcons[channel.leagues[0]] ?? "🎬"}</span>
              <div>
                <strong>{channel.name}</strong>
                <p>{channel.notes}</p>
                <a className="text-link" href={channel.youtubeUrl} target="_blank" rel="noreferrer">
                  <Icon name="youtube" size={16} />
                  Open channel on YouTube
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="hero-actions hero-actions--center">
          <Link className="secondary-btn" href="/channels/">
            <Icon name="youtube" size={16} />
            View all trusted channels
          </Link>
        </div>
      </section>
    </>
  );
}
