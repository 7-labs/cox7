import type { Metadata } from "next";
import Link from "next/link";
import PreviewFinder from "@/components/PreviewFinder";
import VideoCard from "@/components/VideoCard";
import { site, type LeagueSlug, type PreviewType } from "@/lib/c7-data";
import { getVideos } from "@/lib/inventory";
import { isLeagueSlug, isPreviewType, safeQuery, type SearchFilters } from "@/lib/search";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parseFilters(params: Record<string, string | string[] | undefined>): Required<SearchFilters> {
  const query = safeQuery(typeof params.q === "string" ? params.q : null);
  const leagueParam = typeof params.league === "string" ? params.league : null;
  const typeParam = typeof params.type === "string" ? params.type : null;

  return {
    query,
    league: leagueParam === "all" ? "all" : isLeagueSlug(leagueParam) ? leagueParam : "all",
    type: typeParam === "all" ? "all" : isPreviewType(typeParam) ? typeParam : "all"
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const filters = parseFilters((await searchParams) || {});
  const title = filters.query ? `Search results for ${filters.query}` : "Search sports previews";
  const description = filters.query
    ? `Browse server-rendered C7 preview search results for ${filters.query}.`
    : "Search C7 Sports Previews by query, league, and preview type.";

  return {
    title,
    description,
    alternates: {
      canonical: "/search/"
    },
    robots: {
      index: !filters.query,
      follow: true
    },
    openGraph: {
      title,
      description,
      url: `${site.url}/search/`
    }
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const filters = parseFilters((await searchParams) || {});
  const { videos, source } = await getVideos(filters, { limit: 24 });
  const status =
    source === "supabase"
      ? `Showing ${videos.length} verified inventory result${videos.length === 1 ? "" : "s"}.`
      : "Showing curated fallback results while inventory fallback is active.";

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">Search</p>
        <h1>Search sports previews with a shareable URL.</h1>
        <p className="lead">
          This HTML page is the canonical search destination for C7. Use it for shareable results, server-rendered discovery, and
          a cleaner handoff from search engines.
        </p>
        <div className="hero-actions">
          <Link className="secondary-btn" href="/">
            Back to home
          </Link>
          <Link className="secondary-btn" href="/sports-previews/">
            Browse all previews
          </Link>
        </div>
      </section>

      <section className="section section--tight">
        <PreviewFinder
          defaultQuery={filters.query}
          defaultLeague={filters.league}
          defaultType={filters.type}
          initialVideos={videos}
          initialStatus={status}
        />
      </section>

      <section className="section">
        <p className="eyebrow">Search results</p>
        <h2>{filters.query ? `Results for "${filters.query}"` : "Browse the latest inventory"}</h2>
        <div className="results-list">
          {videos.length > 0 ? (
            videos.map((video) => <VideoCard video={video} key={video.id} />)
          ) : (
            <div className="info-card notice">
              <strong>No result yet</strong>
              <p>Try a broader query or clear one of the filters to widen the verified inventory search.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
