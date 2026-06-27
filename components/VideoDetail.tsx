import Link from "next/link";
import Icon from "@/components/Icon";
import StatusBadge from "@/components/StatusBadge";
import VideoCard from "@/components/VideoCard";
import VideoEmbed from "@/components/VideoEmbed";
import {
  contentStatusMeta,
  getLeaguePage,
  site,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
  type PreviewVideo
} from "@/lib/c7-data";
import { deriveContentStatus } from "@/lib/search";

const STATUS_COPY: Record<ReturnType<typeof deriveContentStatus>, string> = {
  live: "This preview is for a broadcast that is live now on YouTube.",
  upcoming: "This preview is for an upcoming, scheduled YouTube broadcast.",
  completed: "This is a completed preview video — the previewed event may have already taken place."
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function formatEventTime(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  const base = { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" } as const;
  try {
    return new Intl.DateTimeFormat("en", { ...base, timeZone: "America/New_York", timeZoneName: "short" }).format(date);
  } catch {
    return `${new Intl.DateTimeFormat("en", { ...base, timeZone: "UTC" }).format(date)} UTC`;
  }
}

function formatNumber(value?: number) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDuration(durationSeconds?: number) {
  if (durationSeconds === undefined || durationSeconds === null) {
    return null;
  }

  if (durationSeconds <= 0) {
    return "Live stream metadata";
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  const parts = [
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    !hours && seconds ? `${seconds}s` : null
  ].filter(Boolean);

  return parts.join(" ") || "Under 1m";
}

function formatBroadcastState(value?: string) {
  if (value === "live") return "Live on YouTube";
  if (value === "upcoming") return "Scheduled on YouTube";
  if (value === "none") return "Standard video";
  return "Not returned";
}

function labelFromType(type: PreviewVideo["type"]) {
  return type
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function sourceLevelLabel(sourceLevel: PreviewVideo["sourceLevel"]) {
  return sourceLevel
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  const trimmed = text.slice(0, maxLength).trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  return `${trimmed.slice(0, lastSpace > 160 ? lastSpace : trimmed.length).trim()}...`;
}

function isUtilityDescriptionLine(line: string) {
  const lower = line.toLowerCase();
  return (
    lower.startsWith("http") ||
    lower.includes("://") ||
    lower.startsWith("follow us") ||
    lower.startsWith("subscribe") ||
    lower.startsWith("stream every") ||
    lower.startsWith("watch all") ||
    lower.startsWith("watch the") ||
    lower.startsWith("home of") ||
    lower.startsWith("○") ||
    /^#[a-z0-9_#\-\s]+$/i.test(line)
  );
}

function descriptionParagraphs(description?: string) {
  if (!description) {
    return [];
  }

  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const rawLine of description.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || isUtilityDescriptionLine(line)) {
      if (current.length > 0) {
        paragraphs.push(current.join(" "));
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    paragraphs.push(current.join(" "));
  }

  return paragraphs
    .map((paragraph) => truncateText(paragraph.replace(/\s+/g, " "), 430))
    .filter((paragraph) => paragraph.length > 24)
    .slice(0, 2);
}

function descriptionHashtags(description?: string) {
  return Array.from(new Set(description?.match(/#[A-Za-z0-9_-]+/g) || [])).slice(0, 10);
}

function titleMatchup(title: string) {
  const afterPrefix = title.replace(/^.*?:\s*/, "");
  const match = afterPrefix.match(/([A-Za-z0-9 .'\-&]+?)\s+v(?:s\.?|ersus)\s+([A-Za-z0-9 .'\-&]+)(?:$|\s+[|:-]|\s+\b(?:reaction|preview|breakdown|live|recap)\b)/i);

  if (!match) {
    return null;
  }

  const cleanTeam = (value: string) =>
    value
      .replace(/\b(reaction|preview|breakdown|live|recap|postgame|pregame)\b.*$/i, "")
      .replace(/[|:.-]+$/g, "")
      .trim();

  const left = cleanTeam(match[1]);
  const right = cleanTeam(match[2]);

  return left && right ? `${left} vs ${right}` : null;
}

function relatedSearches(video: PreviewVideo, additionalTerms: string[] = []) {
  return Array.from(
    new Set([
      ...video.tags.slice(0, 4),
      ...additionalTerms.slice(0, 4),
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

export function videoJsonLd(video: PreviewVideo, canonicalPath = `/video/${video.slug}/`) {
  const canonicalUrl = `${site.url}${canonicalPath}`;
  const leaguePath = getLeaguePage(video.league === "draft" ? "draft" : video.league)?.path || "/sports-previews/";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoObject",
        name: video.title,
        description: video.description || video.summary,
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
  inventoryUpdatedAt,
  canonicalPath = `/video/${video.slug}/`
}: {
  video: PreviewVideo;
  relatedVideos?: PreviewVideo[];
  inventoryUpdatedAt?: string | null;
  canonicalPath?: string;
}) {
  const league = getLeaguePage(video.league === "draft" ? "draft" : video.league);
  const status = deriveContentStatus(video);
  const whyListed =
    video.source === "youtube-api"
      ? "This video matched C7's preview-intent filter, came from a trusted sports source, and was verified with YouTube videos.list as public and embeddable."
      : video.source === "curated-seed"
        ? "This trusted example comes from C7's seed list and shows the same source policy used for live inventory."
        : "This video is part of the verified C7 inventory, refreshed by the daily updater and served without request-time YouTube calls.";
  const youtubeParagraphs = descriptionParagraphs(video.description);
  const youtubeHashtags = descriptionHashtags(video.description);
  const titleTopic = titleMatchup(video.title);
  const durationLabel = formatDuration(video.durationSeconds);
  const viewCountLabel = formatNumber(video.viewCount);
  const metadataTags = Array.from(new Set([...video.tags, ...youtubeHashtags])).slice(0, 12);
  const factItems = [
    { label: "Duration", value: durationLabel || "Not returned" },
    { label: "Views", value: viewCountLabel || "Not returned" },
    { label: "YouTube state", value: formatBroadcastState(video.liveBroadcastContent) },
    { label: "Embeddable", value: video.embeddable === true ? "Yes" : video.embeddable === false ? "No" : "Not returned" }
  ];
  const metadataRows = [
    { label: "Video ID", value: video.id },
    { label: "Channel", value: video.channelTitle },
    { label: "Published", value: formatDate(video.publishedAt) },
    { label: "Source level", value: sourceLevelLabel(video.sourceLevel) },
    { label: "Privacy", value: video.privacyStatus ? video.privacyStatus[0].toUpperCase() + video.privacyStatus.slice(1) : "Not returned" },
    { label: "Last verified", value: video.lastVerifiedAt ? formatDate(video.lastVerifiedAt) : "Not returned" }
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd(video, canonicalPath)) }} />
      <section className="page-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li><Link className="text-link" href="/">Home</Link></li>
            {league ? <li><Link className="text-link" href={league.path}>{league.name}</Link></li> : null}
            <li><span aria-current="page">{video.title}</span></li>
          </ol>
        </nav>
        <p className="eyebrow">
          <StatusBadge status={status} />
          {video.channelTitle} preview video
        </p>
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
          <div className="detail-fact-strip" aria-label="YouTube metadata summary">
            {factItems.map((item) => (
              <span className="detail-fact" key={item.label}>
                <small>{item.label}</small>
                <strong>{item.value}</strong>
              </span>
            ))}
          </div>
        </div>

        <aside className="info-card detail-source">
          <p className="kicker">
            <StatusBadge status={status} />
            <span className="pill">{video.league.toUpperCase()}</span>
            <span className="pill">{labelFromType(video.type)}</span>
          </p>
          <h2>Video source</h2>
          <p className="detail-status">{contentStatusMeta[status].label}: {STATUS_COPY[status]}</p>
          {video.homeTeam && video.awayTeam ? (
            <p className="detail-event">
              <Icon name="calendar" size={15} />
              <span>
                {video.awayTeam} @ {video.homeTeam}
                {formatEventTime(video.eventStartTime) ? ` · ${formatEventTime(video.eventStartTime)}` : ""}
              </span>
            </p>
          ) : null}
          <p>Channel: <Link className="text-link" href="/channels/">{video.channelTitle}</Link></p>
          <p>Published: {formatDate(video.publishedAt)}</p>
          {durationLabel ? <p>Duration: {durationLabel}</p> : null}
          {viewCountLabel ? <p>YouTube views: {viewCountLabel}</p> : null}
          <p>Source level: {sourceLevelLabel(video.sourceLevel)}</p>
          {video.lastCheckedAt ? <p>Last checked: {formatDate(video.lastCheckedAt)}</p> : null}
          {inventoryUpdatedAt ? <p>Inventory updated: {formatDate(inventoryUpdatedAt)}</p> : null}
          <a className="text-link" href={youtubeWatchUrl(video.id)} target="_blank" rel="noreferrer">
            View canonical YouTube page
          </a>
        </aside>
      </section>

      <section className="section video-context">
        <article className="info-card detail-description">
          <p className="eyebrow"><Icon name="youtube" size={14} /> YouTube context</p>
          <h2>Source context.</h2>
          {titleTopic ? (
            <p className="detail-topic">
              <span>Topic detected from title</span>
              <strong>{titleTopic}</strong>
            </p>
          ) : null}
          {youtubeParagraphs.length > 0 ? (
            <>
              {youtubeParagraphs.map((paragraph) => (
                <p className="copy" key={paragraph}>{paragraph}</p>
              ))}
              <p className="detail-caption">
                Shortened from public YouTube metadata. Social links, subscription prompts, and long channel boilerplate are omitted.
              </p>
            </>
          ) : (
            <p className="copy">
              YouTube did not return a usable long description for this inventory item. The verified title, source,
              embed status, and preview classification remain available.
            </p>
          )}
        </article>

        <aside className="info-card detail-metadata">
          <strong>Official metadata</strong>
          <dl className="metadata-list">
            {metadataRows.map((item) => (
              <div className="metadata-row" key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          {metadataTags.length > 0 ? (
            <div className="metadata-tags" aria-label="YouTube and C7 tags">
              {metadataTags.map((tag) => (
                <Link className="pill" href={`/search/?q=${encodeURIComponent(tag.replace(/^#/, ""))}`} key={tag}>
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}
        </aside>
      </section>

      <section className="section detail-grid">
        {video.homeTeam && video.awayTeam ? (
          <article className="info-card">
            <strong>About this matchup</strong>
            <p>
              This preview covers {video.awayTeam} at {video.homeTeam}
              {formatEventTime(video.eventStartTime) ? ` on ${formatEventTime(video.eventStartTime)}` : ""} — a{" "}
              {labelFromType(video.type)} from {video.channelTitle}.
            </p>
          </article>
        ) : null}
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
            {relatedSearches(video, youtubeHashtags.map((tag) => tag.replace(/^#/, ""))).map((item) => (
              <Link className="pill" href={`/search/?q=${encodeURIComponent(item)}`} key={item}>
                {item}
              </Link>
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
