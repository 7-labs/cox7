import type { Metadata } from "next";
import Link from "next/link";
import PreviewFinder from "@/components/PreviewFinder";
import { getVideos } from "@/lib/inventory";
import { filterByStatus, sortByStatus } from "@/lib/search";

export const metadata: Metadata = {
  title: "Upcoming Sports Videos",
  description:
    "Search upcoming sports broadcasts, pregame shows, watch-party preview videos, and official YouTube sports video pages when available.",
  alternates: {
    canonical: "/upcoming-live-sports/"
  }
};

const faqs = [
  {
    q: "What kind of videos appear here?",
    a: "Official and trusted, public, embeddable YouTube videos that match upcoming, pregame, preview, or official-trailer intent for sports broadcasts."
  },
  {
    q: "Does C7 stream live games?",
    a: "No. C7 never streams, downloads, or mirrors game footage. It only links to and embeds official or trusted YouTube videos, and excludes full-game replays, leaked broadcasts, and piracy-intent results."
  },
  {
    q: "Why might this page be empty?",
    a: "When no live or upcoming previews are currently verified in the inventory, the page still shows the finder so you can search, plus links to browse all previews."
  }
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a }
  }))
};

export default async function UpcomingLiveSportsPage() {
  const { videos: pool } = await getVideos({}, { limit: 24 });
  // This page is scoped to the live/upcoming part of the content lifecycle. We
  // derive the initial list by content STATUS (live/upcoming), not by the
  // finder's preview TYPE filter ("upcoming-live") — those are related but
  // distinct axes. When nothing is live/upcoming (common in seed fallback) we
  // still render the finder plus an honest empty state instead of a blank page.
  const liveOrUpcoming = sortByStatus([
    ...filterByStatus(pool, "live"),
    ...filterByStatus(pool, "upcoming")
  ]).slice(0, 6);
  const hasLiveOrUpcoming = liveOrUpcoming.length > 0;
  const finderStatus = hasLiveOrUpcoming
    ? `Showing ${liveOrUpcoming.length} live or upcoming preview${liveOrUpcoming.length === 1 ? "" : "s"}.`
    : "No live or upcoming previews are verified right now — search above, or browse all previews.";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="page-header">
        <p className="eyebrow">Upcoming sports videos</p>
        <h1>Search upcoming live sports without replay noise.</h1>
        <p className="lead">
          Use C7 to look for upcoming live sports, pregame shows, watch parties, and official broadcast previews on YouTube. This
          page separates upcoming video discovery from full-game replays.
        </p>
        <div className="hero-actions">
          <Link className="secondary-btn" href="/sports-previews/">
            Browse all sports previews
          </Link>
        </div>
      </section>

      <section className="section section--tight" id="upcoming-finder">
        <p className="eyebrow">Upcoming finder</p>
        <h2>Search official upcoming sports videos.</h2>
        <PreviewFinder defaultType="upcoming-live" initialVideos={liveOrUpcoming} initialStatus={finderStatus} />
        {!hasLiveOrUpcoming ? (
          <div className="info-card notice">
            <strong>No live or upcoming previews right now</strong>
            <p>
              Inventory currently has no live or upcoming items. Try a search above, or{" "}
              <Link className="text-link" href="/sports-previews/">
                browse all sports previews
              </Link>
              .
            </p>
          </div>
        ) : null}
      </section>

      <section className="content-block surface">
        <h2>Upcoming discovery policy</h2>
        <p className="copy">
          C7 looks for trusted, public, embeddable YouTube videos that match upcoming, pregame, preview, or official trailer
          intent. It does not list unauthorized full-game streams, leaked broadcasts, or pages built around piracy keywords.
        </p>
        <h2>FAQ</h2>
        <ul>
          {faqs.map((item) => (
            <li key={item.q}>
              <strong>{item.q}</strong> {item.a}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
