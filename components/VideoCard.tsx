import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import {
  leagueIcons,
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

function formatDuration(totalSeconds?: number) {
  if (!totalSeconds || totalSeconds <= 0) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

function formatViews(views?: number) {
  if (!views || views <= 0) return null;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(views);
}

function detailHref(video: PreviewVideo) {
  return `/video/${video.slug}/`;
}

function sourceLabel(video: PreviewVideo) {
  if (video.source === "curated-seed") return "Curated seed result";
  if (video.lastVerifiedAt || video.status === "active") return "Verified inventory result";
  return "Source: YouTube API";
}

export default function VideoCard({ video, compact = false, priority = false }: { video: PreviewVideo; compact?: boolean; priority?: boolean }) {
  const thumbnail = video.thumbnailUrl || youtubeThumbnailUrl(video.id);
  const duration = formatDuration(video.durationSeconds);
  const views = formatViews(video.viewCount);

  return (
    <article className={`video-card${compact ? " video-card--compact" : ""}`}>
      <Link className="video-thumb" href={detailHref(video)} aria-label={`Watch ${video.title}`}>
        <Image
          src={thumbnail}
          alt={`${video.title} thumbnail`}
          fill
          priority={priority}
          sizes={compact ? "(max-width: 640px) 100vw, 168px" : "(max-width: 640px) 100vw, (max-width: 980px) 50vw, 320px"}
        />
        <span className="thumb-play" aria-hidden="true">
          <Icon name="play" size={22} />
        </span>
        <span className="thumb-league" aria-hidden="true">{leagueIcons[video.league]}</span>
        {duration ? <span className="thumb-duration">{duration}</span> : null}
        <span className="sr-only">Open embedded YouTube preview</span>
      </Link>
      <div className="video-body">
        <div className="card-meta">
          <span className="pill pill--league">
            <span aria-hidden="true">{leagueIcons[video.league]}</span>
            {video.league.toUpperCase()}
          </span>
          <span className="pill">{labelFromType(video.type)}</span>
          <span className="meta-inline">
            <Icon name="calendar" size={14} />
            {formatDate(video.publishedAt)}
          </span>
          {views ? (
            <span className="meta-inline">
              <Icon name="eye" size={14} />
              {views}
            </span>
          ) : null}
        </div>
        <h3>
          <Link href={detailHref(video)}>{video.title}</Link>
        </h3>
        {!compact ? <p>{video.summary}</p> : null}
        <div className="card-meta card-meta--source">
          <span>{sourceLabel(video)}</span>
          <span>{video.channelTitle}</span>
          <span>Filtered by: {video.filterSummary || "trusted channel + embeddable + preview intent"}</span>
          {video.lastCheckedAt ? (
            <span className="meta-inline">
              <Icon name="clock" size={13} />
              Last checked {formatDate(video.lastCheckedAt)}
            </span>
          ) : null}
        </div>
        <div className="card-actions">
          <Link className="btn btn--sm" href={detailHref(video)}>
            <Icon name="play" size={16} />
            Watch on C7
          </Link>
          <a className="text-link" href={youtubeWatchUrl(video.id)} target="_blank" rel="noreferrer">
            <Icon name="youtube" size={16} />
            Open on YouTube
          </a>
        </div>
      </div>
    </article>
  );
}
