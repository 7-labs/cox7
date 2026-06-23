import type { MetadataRoute } from "next";
import { leaguePages, site } from "@/lib/c7-data";
import { getAllVideosForSitemap } from "@/lib/inventory";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = ["/", "/search/", "/sports-previews/", "/channels/", "/archive/", "/archive/local-video/", "/archive/stem-journals/"];
  const videos = await getAllVideosForSitemap();

  return [
    ...staticPages.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
      priority: path === "/" ? 1 : 0.75
    })),
    ...leaguePages.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified: now,
      priority: 0.82
    })),
    ...videos.map((video) => ({
      url: `${site.url}/video/${video.slug}/`,
      lastModified: new Date(video.publishedAt),
      priority: 0.64
    }))
  ];
}
