import Image from "next/image";
import Link from "next/link";
import {
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

  return (
    <article className="video-card">
      <Link className="video-thumb" href={detailHref(video)} aria-label={`Watch ${video.title}`}>
        <Image
          src={thumbnail}
          alt={`${video.title} thumbnail`}
          fill
          priority={priority}
          sizes={compact ? "(max-width: 640px) 100vw, 168px" : "(max-width: 640px) 100vw, (max-width: 980px) 50vw, 168px"}
        />
        <span className="sr-only">Open embedded YouTube preview</span>
      </Link>
      <div>
        <div className="card-meta">
          <span className="pill">{video.league.toUpperCase()}</span>
          <span className="pill">{labelFromType(video.type)}</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
        <h3>
          <Link href={detailHref(video)}>{video.title}</Link>
        </h3>
        {!compact ? <p>{video.summary}</p> : null}
        <div className="card-meta">
          <span>{sourceLabel(video)}</span>
          <span>{video.channelTitle}</span>
          <span>Filtered by: {video.filterSummary || "trusted channel + embeddable + preview intent"}</span>
          {video.lastCheckedAt ? <span>Last checked: {formatDate(video.lastCheckedAt)}</span> : null}
        </div>
        <div className="card-actions">
          <Link className="text-link" href={detailHref(video)}>
            Watch on C7
          </Link>
          <a className="text-link" href={youtubeWatchUrl(video.id)} target="_blank" rel="noreferrer">
            Open on YouTube
          </a>
        </div>
      </div>
    </article>
  );
}
