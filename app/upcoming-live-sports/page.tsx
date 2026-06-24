import type { Metadata } from "next";
import Link from "next/link";
import PreviewFinder from "@/components/PreviewFinder";
import { getVideos } from "@/lib/inventory";
import { deriveContentStatus, sortByStatus } from "@/lib/search";

export const metadata: Metadata = {
  title: "Upcoming Sports Videos",
  description:
    "Search upcoming sports broadcasts, pregame shows, watch-party preview videos, and official YouTube sports video pages when available.",
  alternates: {
    canonical: "/upcoming-live-sports/"
  }
};

export default async function UpcomingLiveSportsPage() {
  const { videos: pool } = await getVideos({}, { limit: 24 });
  // This page is scoped to the live/upcoming part of the lifecycle only.
  const videos = sortByStatus(pool.filter((video) => deriveContentStatus(video) !== "completed")).slice(0, 6);

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">Upcoming sports videos</p>
        <h1>Search upcoming live sports without replay noise.</h1>
        <p className="lead">
          Use C7 to look for upcoming live sports, pregame shows, watch parties, and official broadcast previews on YouTube. This
          page separates upcoming video discovery from full-game replays.
        </p>
        <div className="hero-actions">
          <Link className="btn" href="/#finder">
            Search all previews
          </Link>
          <Link className="secondary-btn" href="/sports-previews/">
            Browse sports previews
          </Link>
        </div>
      </section>

      <section className="content-block surface">
        <h2>Upcoming discovery policy</h2>
        <p className="copy">
          C7 looks for trusted, public, embeddable YouTube videos that match upcoming, pregame, preview, or official trailer
          intent. It does not list unauthorized full-game streams, leaked broadcasts, or pages built around piracy keywords.
        </p>
      </section>

      <section className="section">
        <p className="eyebrow">Upcoming finder</p>
        <h2>Search official upcoming sports videos.</h2>
        <PreviewFinder
          defaultType="upcoming-live"
          initialVideos={videos}
          initialStatus="Search upcoming live sports, pregame shows, watch parties, and official broadcast previews."
        />
      </section>
    </>
  );
}
