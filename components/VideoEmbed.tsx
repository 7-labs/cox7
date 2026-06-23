"use client";

import { useState } from "react";
import { youtubeEmbedUrl } from "@/lib/c7-data";

type VideoEmbedProps = {
  title: string;
  videoId: string;
  thumbnailUrl?: string;
};

export default function VideoEmbed({ title, videoId, thumbnailUrl }: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (isLoaded) {
    return (
      <div className="embed-wrap">
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      className="embed-facade"
      type="button"
      onClick={() => setIsLoaded(true)}
      style={thumbnailUrl ? { backgroundImage: `linear-gradient(rgba(6,7,10,0.2), rgba(6,7,10,0.45)), url(${thumbnailUrl})` } : undefined}
      aria-label={`Load YouTube embed for ${title}`}
    >
      <span className="embed-play">Play preview</span>
      <span className="embed-copy">Click to load the YouTube player only when needed.</span>
    </button>
  );
}
