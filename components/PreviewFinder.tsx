"use client";

import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { leaguePages, previewTypes, type LeagueSlug, type PreviewType, type PreviewVideo } from "@/lib/c7-data";
import { filterSeedVideos, type SearchResponse } from "@/lib/search";
import VideoCard from "@/components/VideoCard";
import Icon from "@/components/Icon";

const popularSearches = [
  "NFL game preview",
  "NBA Draft preview",
  "MLB season preview",
  "Stanley Cup preview",
  "Super Bowl preview",
  "Upcoming live sports"
];

type PreviewFinderProps = {
  defaultQuery?: string;
  defaultLeague?: LeagueSlug | "all";
  defaultType?: PreviewType | "all";
  initialVideos?: PreviewVideo[];
  initialStatus?: string;
};

export default function PreviewFinder({
  defaultQuery = "",
  defaultLeague = "all",
  defaultType = "all",
  initialVideos = [],
  initialStatus = "Search official and trusted sports previews by team, league, event, or matchup."
}: PreviewFinderProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState(defaultQuery);
  const [league, setLeague] = useState<LeagueSlug | "all">(defaultLeague);
  const [type, setType] = useState<PreviewType | "all">(defaultType);
  const [results, setResults] = useState<PreviewVideo[]>(() =>
    initialVideos.length > 0 ? initialVideos : filterSeedVideos({ query: defaultQuery, league: defaultLeague, type: defaultType })
  );
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const localPreview = useMemo(() => filterSeedVideos({ query, league, type }), [query, league, type]);
  const visibleResults = results.length > 0 ? results : localPreview;
  const activeFilters = [
    query ? `Query: ${query}` : null,
    league !== "all" ? `League: ${league.toUpperCase()}` : null,
    type !== "all" ? `Type: ${type.replace(/-/g, " ")}` : null
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    setQuery(defaultQuery);
    setLeague(defaultLeague);
    setType(defaultType);
    setResults(initialVideos.length > 0 ? initialVideos : filterSeedVideos({ query: defaultQuery, league: defaultLeague, type: defaultType }));
    setStatus(initialStatus);
  }, [defaultLeague, defaultQuery, defaultType, initialStatus, initialVideos]);

  function replaceUrl(nextQuery: string, nextLeague: LeagueSlug | "all", nextType: PreviewType | "all") {
    const params = new URLSearchParams();

    if (nextQuery) params.set("q", nextQuery);
    if (nextLeague !== "all") params.set("league", nextLeague);
    if (nextType !== "all") params.set("type", nextType);

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      window.history.replaceState(null, "", nextUrl);
    });
  }

  function handleLeagueChange(nextLeague: LeagueSlug | "all") {
    setLeague(nextLeague);
    replaceUrl(query, nextLeague, type);
  }

  function handleTypeChange(nextType: PreviewType | "all") {
    setType(nextType);
    replaceUrl(query, league, nextType);
  }

  function clearFilters() {
    setQuery(defaultQuery);
    setLeague(defaultLeague);
    setType(defaultType);
    setResults(
      initialVideos.length > 0
        ? initialVideos
        : filterSeedVideos({ query: defaultQuery, league: defaultLeague, type: defaultType })
    );
    setStatus(initialStatus);
    replaceUrl(defaultQuery, defaultLeague, defaultType);
  }

  const hasChangedFilters = query !== defaultQuery || league !== defaultLeague || type !== defaultType;

  async function runSearch(event?: FormEvent<HTMLFormElement>, nextQuery?: string) {
    event?.preventDefault();
    const effectiveQuery = typeof nextQuery === "string" ? nextQuery : query;

    if (typeof nextQuery === "string") {
      setQuery(nextQuery);
    }

    setIsLoading(true);
    setStatus("Searching trusted sports preview sources...");
    replaceUrl(effectiveQuery, league, type);

    const params = new URLSearchParams({ q: effectiveQuery, league, type });

    try {
      const response = await fetch(`/api/search/?${params.toString()}`);
      const payload = (await response.json()) as SearchResponse;
      const fallbackPreview = filterSeedVideos({ query: effectiveQuery, league, type });
      setResults(payload.results.length > 0 ? payload.results : fallbackPreview);
      setStatus(
        `${payload.results.length > 0 ? payload.results.length : fallbackPreview.length} results. ${
          payload.note ||
          (payload.source === "youtube-api" || payload.source === "youtube-cache"
            ? "Live YouTube API results filtered to trusted channels and preview intent."
            : payload.source === "supabase"
              ? "Verified inventory results from Supabase."
              : "Live search is unavailable right now; showing trusted example videos instead.")
        }`
      );
    } catch {
      setResults(filterSeedVideos({ query: effectiveQuery, league, type }));
      setStatus("Search is temporarily unavailable; showing trusted example videos instead.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="finder surface" aria-label="Official Sports Preview Finder">
      <div className="finder-controls">
        <form action="/search/" method="get" onSubmit={runSearch}>
          <label className="finder-label" htmlFor="preview-query">
            <Icon name="search" size={16} />
            Search team, league, event, or matchup
          </label>
          <div className="search-row">
            <div className="input-wrap">
              <Icon name="search" size={18} />
              <input
                id="preview-query"
                name="q"
                className="input input--icon"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Try: Super Bowl preview, NBA Draft preview"
              />
            </div>
            <button className="btn" type="submit" disabled={isLoading}>
              <Icon name="search" size={16} />
              {isLoading ? "Searching" : "Find previews"}
            </button>
          </div>
          <div className="filter-row">
            <select
              aria-label="Filter by league"
              className="select"
              name="league"
              value={league}
              onChange={(event) => handleLeagueChange(event.target.value as LeagueSlug | "all")}
            >
              <option value="all">All leagues</option>
              {leaguePages.map((item) => (
                <option value={item.slug} key={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by preview type"
              className="select"
              name="type"
              value={type}
              onChange={(event) => handleTypeChange(event.target.value as PreviewType | "all")}
            >
              {previewTypes.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="chip-row" aria-label="Popular searches">
            <span>Popular:</span>
            {popularSearches.map((item) => (
              <button className="chip" type="button" key={item} onClick={() => runSearch(undefined, item)} disabled={isLoading}>
                {item}
              </button>
            ))}
          </div>
        </form>

        <p className="finder-status" role="status">
          {status}
        </p>
        {activeFilters ? <p className="finder-status">Active filters: {activeFilters}</p> : null}
        {hasChangedFilters ? (
          <button type="button" className="text-link finder-clear" onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="finder-results">
        <div className="results-list">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <div className="video-card skeleton-card" key={index} aria-hidden="true" />)
          ) : visibleResults.length > 0 ? (
            visibleResults.slice(0, 6).map((video, index) => <VideoCard video={video} compact priority={index === 0 && pathname === "/"} key={video.id} />)
          ) : (
            <div className="info-card notice">
              <strong>No previews matched these filters</strong>
              <p>Try removing a filter or broadening your search to widen the results.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
