import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import VideoCard from "@/components/VideoCard";
import { contentStatusMeta, leagueIcons, leaguePages, site, type ContentStatus } from "@/lib/c7-data";
import { getInventoryStats, getVideos } from "@/lib/inventory";
import { filterByStatus, isContentStatus, sortByStatus } from "@/lib/search";

export const metadata: Metadata = {
  title: "Sports Preview Videos",
  description:
    "Browse official and trusted YouTube sports preview videos across NFL, NBA, MLB, NHL, draft, playoff, season, and upcoming sports topics.",
  alternates: {
    canonical: "/sports-previews/"
  }
};

const STATUS_TABS: Array<{ value: ContentStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "upcoming", label: contentStatusMeta.upcoming.label },
  { value: "live", label: contentStatusMeta.live.label },
  { value: "completed", label: contentStatusMeta.completed.label }
];

type SportsPreviewsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SportsPreviewsPage({ searchParams }: SportsPreviewsPageProps) {
  const params = (await searchParams) || {};
  const statusParam = typeof params.status === "string" ? params.status : null;
  const activeStatus: ContentStatus | "all" = isContentStatus(statusParam) ? statusParam : "all";

  const [{ videos: allVideos }, stats] = await Promise.all([getVideos({}, { limit: 24 }), getInventoryStats()]);
  const videos = sortByStatus(filterByStatus(allVideos, activeStatus));
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "C7 Sports Preview Videos",
    itemListElement: videos.map((video, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${site.url}/video/${video.slug}/`,
      name: video.title
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <section className="page-header">
        <p className="eyebrow">All sports previews</p>
        <h1>Official sports preview videos, organized for search.</h1>
        <p className="lead">
          Use this hub to browse verified C7 inventory, league pages, channel directories, and the preview finder. The project is
          designed to become an auto-updating YouTube discovery layer, not a replay or live-stream mirror.
        </p>
        {stats.lastRunAt ? <p className="finder-status">Last inventory update: {new Date(stats.lastRunAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p> : null}
        <div className="hero-actions">
          <Link className="btn" href="/#finder">
            Search the finder
          </Link>
          <Link className="secondary-btn" href="/channels/">
            View trusted channels
          </Link>
        </div>
      </section>

      <section className="section section--tight">
        <p className="eyebrow"><Icon name="play" size={14} /> Current inventory pages</p>
        <h2>Embeddable preview pages.</h2>
        <div className="status-tabs" role="tablist" aria-label="Filter previews by status">
          {STATUS_TABS.map((tab) => {
            const href = tab.value === "all" ? "/sports-previews/" : `/sports-previews/?status=${tab.value}`;
            const isActive = tab.value === activeStatus;
            return (
              <Link
                className={`status-tab${isActive ? " status-tab--active" : ""}`}
                href={href}
                key={tab.value}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="results-grid">
          {videos.length > 0 ? (
            videos.map((video, index) => <VideoCard video={video} priority={index === 0} key={video.id} />)
          ) : (
            <div className="info-card notice">
              <strong>No {activeStatus === "all" ? "" : `${contentStatusMeta[activeStatus].label.toLowerCase()} `}previews yet</strong>
              <p>
                {activeStatus === "all"
                  ? "The seed fallback remains available until the daily updater writes the first verified rows."
                  : "Nothing matches this status right now. Live and upcoming previews appear here once the inventory captures live broadcasts."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow"><Icon name="grid" size={14} /> League hubs</p>
        <h2>Start from the fan intent.</h2>
        <div className="league-grid">
          {leaguePages.map((league) => (
            <Link className="info-card league-card" href={league.path} key={league.slug}>
              <span className="league-icon" aria-hidden="true">{leagueIcons[league.slug]}</span>
              <strong>{league.title}</strong>
              <p>{league.description}</p>
              <span className="text-link">Open hub <Icon name="arrow" size={15} /></span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
