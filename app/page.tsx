import Link from "next/link";
import PreviewFinder from "@/components/PreviewFinder";
import VideoCard from "@/components/VideoCard";
import { leaguePages, site, trustedChannels, type LeagueSlug, type PreviewType } from "@/lib/c7-data";
import { getInventoryStats, getVideos } from "@/lib/inventory";
import { isLeagueSlug, isPreviewType, safeQuery } from "@/lib/search";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  description: site.description,
  potentialAction: {
    "@type": "SearchAction",
    target: `${site.url}/search/?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
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
  const [{ videos: initialVideos, source }, { videos: latestVideos }, stats] = await Promise.all([
    getVideos({ query, league, type }, { limit: 6 }),
    getVideos({}, { limit: 4 }),
    getInventoryStats()
  ]);
  const finderStatus =
    source === "supabase"
      ? `Showing ${initialVideos.length} verified inventory result${initialVideos.length === 1 ? "" : "s"}.`
      : "Showing curated example results while inventory fallback is active.";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Official Sports Preview Finder</p>
            <h1>Find the next sports preview video without the noise.</h1>
            <p className="lead">
              C7 Sports Previews finds official and trusted YouTube videos for game previews, season previews, draft previews,
              playoff previews, and upcoming sports broadcasts. Search a team, league, event, or matchup and jump straight to an
              embedded source page.
            </p>
            {stats.lastRunAt ? <p className="finder-status">Last inventory update: {new Date(stats.lastRunAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p> : null}
            <div className="hero-actions">
              <a className="btn" href="#finder">Use the finder</a>
              <Link className="secondary-btn" href="/sports-previews/">
                Browse latest previews
              </Link>
              <Link className="secondary-btn" href="/search/">
                Open search page
              </Link>
            </div>
          </div>
          <div id="finder">
            <PreviewFinder
              defaultQuery={query}
              defaultLeague={league}
              defaultType={type}
              initialVideos={initialVideos}
              initialStatus={finderStatus}
            />
          </div>
        </div>
        <div className="stats-grid" aria-label="C7 project principles">
          <div className="info-card">
            <strong>Official-first</strong>
            <p>Whitelist league and trusted sports channels before expanding discovery.</p>
          </div>
          <div className="info-card">
            <strong>Embed, not copy</strong>
            <p>No video downloads, no mirrored files, and clear YouTube source attribution.</p>
          </div>
          <div className="info-card">
            <strong>SEO pages</strong>
            <p>League, draft, upcoming, channel, archive, and video detail pages create long-tail entry points.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Browse by intent</p>
        <h2>Built around how sports fans search.</h2>
        <div className="league-grid">
          {leaguePages.map((league) => (
            <Link className="info-card" href={league.path} key={league.slug}>
              <strong>{league.title}</strong>
              <p>{league.primaryIntent}</p>
              <span className="text-link">Open {league.name} previews →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Latest inventory</p>
        <h2>Preview pages are already wired.</h2>
        <div className="results-list">
          {latestVideos.length > 0 ? (
            latestVideos.slice(0, 4).map((video, index) => <VideoCard video={video} priority={index === 0} key={video.id} />)
          ) : (
            <div className="info-card notice">
              <strong>No inventory video yet</strong>
              <p>The site will keep serving the seed fallback until the first verified inventory sync completes.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Source policy</p>
        <h2>Not a replay scraper.</h2>
        <div className="feature-grid">
          <div className="info-card">
            <strong>Allowed</strong>
            <p>Embeddable YouTube previews from official or trusted sports channels.</p>
          </div>
          <div className="info-card">
            <strong>Filtered out</strong>
            <p>Full-game copies, betting-only clips, leaked video, and piracy-intent searches.</p>
          </div>
          <div className="info-card">
            <strong>Independent value</strong>
            <p>Tags, league pages, channel context, archive routing, and preview-type filters.</p>
          </div>
          <div className="info-card">
            <strong>Ready to automate</strong>
            <p>The updater writes verified inventory daily so the request path stays independent from YouTube.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Trusted channel starter list</p>
        <h2>Small whitelist first, then expand safely.</h2>
        <div className="channel-grid">
          {trustedChannels.slice(0, 4).map((channel) => (
            <div className="info-card" key={channel.channelId}>
              <strong>{channel.name}</strong>
              <p>{channel.notes}</p>
              <a className="text-link" href={channel.youtubeUrl} target="_blank" rel="noreferrer">
                Open channel on YouTube →
              </a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
