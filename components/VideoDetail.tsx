import Link from "next/link";
import VideoCard from "@/components/VideoCard";
import VideoEmbed from "@/components/VideoEmbed";
import {
  getLeaguePage,
  site,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
  type PreviewVideo
} from "@/lib/c7-data";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function labelFromType(type: PreviewVideo["type"]) {
  return type
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function relatedSearches(video: PreviewVideo) {
  return Array.from(
    new Set([
      ...video.tags.slice(0, 4),
      `${video.league.toUpperCase()} preview`,
      labelFromType(video.type),
      `${video.channelTitle} preview`
    ])
  ).slice(0, 6);
}

function toIsoDuration(durationSeconds?: number) {
  if (!durationSeconds || durationSeconds <= 0) {
    return undefined;
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds || (!hours && !minutes) ? `${seconds}S` : ""}`;
}

export function videoJsonLd(video: PreviewVideo) {
  const canonicalUrl = `${site.url}/video/${video.slug}/`;
  const leaguePath = getLeaguePage(video.league === "draft" ? "draft" : video.league)?.path || "/sports-previews/";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoObject",
        name: video.title,
        description: video.summary,
        uploadDate: video.publishedAt,
        thumbnailUrl: [video.thumbnailUrl || youtubeThumbnailUrl(video.id)],
        embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
        url: canonicalUrl,
        duration: toIsoDuration(video.durationSeconds),
        publisher: {
          "@type": "Organization",
          name: video.channelTitle
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: site.url
          },
          {
            "@type": "ListItem",
            position: 2,
            name: (getLeaguePage(video.league === "draft" ? "draft" : video.league)?.name || video.league).toUpperCase(),
            item: `${site.url}${leaguePath}`
          },
          {
            "@type": "ListItem",
            position: 3,
            name: video.title,
            item: canonicalUrl
          }
        ]
      }
    ]
  };
}

export default function VideoDetail({
  video,
  relatedVideos = [],
  inventoryUpdatedAt
}: {
  video: PreviewVideo;
  relatedVideos?: PreviewVideo[];
  inventoryUpdatedAt?: string | null;
}) {
  const league = getLeaguePage(video.league === "draft" ? "draft" : video.league);
  const whyListed =
    video.source === "youtube-api"
      ? "This video matched C7's preview-intent filter, came from a trusted sports source, and was verified with YouTube videos.list as public and embeddable."
      : video.source === "curated-seed"
        ? "This curated example comes from C7's trusted seed list and demonstrates the source policy used before live inventory is cached."
        : "This video is part of the verified C7 inventory, refreshed by the daily updater and served without request-time YouTube calls.";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd(video)) }} />
      <section className="page-header">
        <p className="eyebrow">{video.channelTitle} preview video</p>
        <h1>{video.title}</h1>
        <p className="lead">{video.summary}</p>
        <div className="hero-actions">
          <a className="btn" href={youtubeWatchUrl(video.id)} target="_blank" rel="noreferrer">
            Open on YouTube
          </a>
          {league ? (
            <Link className="secondary-btn" href={league.path}>
              More {league.name} previews
            </Link>
          ) : null}
        </div>
      </section>

      <section className="section video-detail">
        <div>
          <VideoEmbed title={video.title} videoId={video.id} thumbnailUrl={video.thumbnailUrl || youtubeThumbnailUrl(video.id)} />
          <p className="finder-status">
            Embedded from YouTube. C7 does not download, mirror, cache, or hide the source video. Use "Open on YouTube" for the
            canonical watch page.
          </p>
        </div>

        <aside className="info-card detail-source">
          <p className="kicker">
            <span className="pill">{video.league.toUpperCase()}</span>
            <span className="pill">{labelFromType(video.type)}</span>
          </p>
          <h2>Video source</h2>
          <p>Channel: {video.channelTitle}</p>
          <p>Published: {formatDate(video.publishedAt)}</p>
          <p>Source level: {video.sourceLevel.replace(/-/g, " ")}</p>
          {video.lastCheckedAt ? <p>Last checked: {formatDate(video.lastCheckedAt)}</p> : null}
          {inventoryUpdatedAt ? <p>Inventory updated: {formatDate(inventoryUpdatedAt)}</p> : null}
          <a className="text-link" href={youtubeWatchUrl(video.id)} target="_blank" rel="noreferrer">
            View canonical YouTube page
          </a>
        </aside>
      </section>

      <section className="section detail-grid">
        <article className="info-card">
          <strong>Why this video is listed</strong>
          <p>{whyListed}</p>
        </article>
        <article className="info-card">
          <strong>Preview type</strong>
          <p>{labelFromType(video.type)}. C7 uses this tag to group game, season, draft, playoff, upcoming, and official trailer intent.</p>
        </article>
        <article className="info-card">
          <strong>Source policy</strong>
          <p>C7 embeds the YouTube player, links to the canonical watch page, and excludes full-game, leaked, betting-only, or piracy-intent results.</p>
        </article>
        <article className="info-card">
          <strong>Related search intents</strong>
          <div className="intent-list">
            {relatedSearches(video).map((item) => (
              <span className="pill" key={item}>
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>

      {relatedVideos.length > 0 ? (
        <section className="section">
          <p className="eyebrow">Related previews</p>
          <h2>Keep browsing the same intent.</h2>
          <div className="results-list">
            {relatedVideos.map((item) => (
              <VideoCard video={item} compact key={item.id} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
