import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VideoDetail from "@/components/VideoDetail";
import { site, youtubeThumbnailUrl } from "@/lib/c7-data";
import { getAllVideosForSitemap, getInventoryStats, getVideoBySlug, getVideos } from "@/lib/inventory";

type VideoPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const videos = await getAllVideosForSitemap();
  return videos.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

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
      canonical: `/video/${video.slug}/`
    },
    openGraph: {
      title: video.title,
      description: video.summary,
      type: "video.other",
      url: `${site.url}/video/${video.slug}/`,
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

export default async function VideoDetailPage({ params }: VideoPageProps) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) notFound();

  const [{ videos: relatedCandidates }, stats] = await Promise.all([
    getVideos({ league: video.league }, { limit: 6 }),
    getInventoryStats()
  ]);
  const relatedVideos = relatedCandidates.filter((item) => item.id !== video.id).slice(0, 3);

  return <VideoDetail video={video} relatedVideos={relatedVideos} inventoryUpdatedAt={stats.lastRunAt} />;
}
