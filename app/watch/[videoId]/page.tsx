import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import VideoDetail from "@/components/VideoDetail";
import { site, youtubeThumbnailUrl, type PreviewVideo } from "@/lib/c7-data";
import { getInventoryStats, getVideoById, getVideos } from "@/lib/inventory";
import { fetchVerifiedWatchVideo, isValidYouTubeVideoId } from "@/lib/youtube-search";

export const dynamic = "force-dynamic";

type WatchPageProps = {
  params: Promise<{ videoId: string }>;
};

async function getWatchVideo(videoId: string): Promise<PreviewVideo | null> {
  if (!isValidYouTubeVideoId(videoId)) return null;

  const inventoryVideo = await getVideoById(videoId);

  if (inventoryVideo) {
    return inventoryVideo;
  }

  if (process.env.YOUTUBE_LIVE_FALLBACK !== "on" || !process.env.YOUTUBE_API_KEY) {
    return null;
  }

  try {
    return await fetchVerifiedWatchVideo(videoId, process.env.YOUTUBE_API_KEY);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { videoId } = await params;
  const video = await getWatchVideo(videoId);

  if (!video) {
    return {
      title: "Sports Preview Video Not Found"
    };
  }

  const image = video.thumbnailUrl || youtubeThumbnailUrl(video.id);

  return {
    title: video.title,
    description: video.summary,
    alternates: {
      canonical: video.source === "youtube-api" ? `/watch/${video.id}/` : `/video/${video.slug}/`
    },
    openGraph: {
      title: video.title,
      description: video.summary,
      type: "video.other",
      url: video.source === "youtube-api" ? `${site.url}/watch/${video.id}/` : `${site.url}/video/${video.slug}/`,
      images: [image]
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description: video.summary,
      images: [image]
    }
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { videoId } = await params;
  const video = await getWatchVideo(videoId);

  if (!video) notFound();

  if (video.source !== "youtube-api") {
    permanentRedirect(`/video/${video.slug}/`);
  }

  const [{ videos: relatedCandidates }, stats] = await Promise.all([
    getVideos({ league: video.league }, { limit: 6 }),
    getInventoryStats()
  ]);
  const relatedVideos = relatedCandidates.filter((item) => item.id !== video.id).slice(0, 3);

  return <VideoDetail video={video} relatedVideos={relatedVideos} inventoryUpdatedAt={stats.lastRunAt} canonicalPath={`/watch/${video.id}/`} />;
}
