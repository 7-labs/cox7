import { getAllVideosForSitemap } from "@/lib/inventory";
import { site, youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/c7-data";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const videos = await getAllVideosForSitemap();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videos
  .map(
    (video) => `  <url>
    <loc>${site.url}/video/${video.slug}/</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl || youtubeThumbnailUrl(video.id))}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(video.summary || video.title)}</video:description>
      <video:player_loc allow_embed="yes">${escapeXml(youtubeEmbedUrl(video.id))}</video:player_loc>
      <video:publication_date>${escapeXml(video.publishedAt)}</video:publication_date>
    </video:video>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}
