import Link from "next/link";
import Icon from "@/components/Icon";
import PreviewFinder from "@/components/PreviewFinder";
import VideoCard from "@/components/VideoCard";
import { getLeaguePage, leagueIcons, leaguePages, site, type LeagueSlug } from "@/lib/c7-data";
import { hubContent } from "@/lib/hub-content";
import { getInventoryStats, getLeagueVideos } from "@/lib/inventory";

export default async function LeagueLanding({ slug }: { slug: LeagueSlug }) {
  const page = getLeaguePage(slug);
  const [videos, stats] = await Promise.all([getLeagueVideos(slug, 12), getInventoryStats()]);

  if (!page) return null;

  const hub = hubContent[slug];

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "CollectionPage",
      name: page.title,
      description: page.description,
      url: `${site.url}${page.path}`
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: page.name, item: `${site.url}${page.path}` }
      ]
    },
    {
      "@type": "ItemList",
      name: `${page.name} preview videos`,
      itemListElement: videos.slice(0, 10).map((video, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${site.url}/video/${video.slug}/`,
        name: video.title
      }))
    }
  ];

  if (hub?.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: hub.faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    });
  }

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="page-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li><Link className="text-link" href="/">Home</Link></li>
            <li><span aria-current="page">{page.name}</span></li>
          </ol>
        </nav>
        <p className="eyebrow"><span aria-hidden="true">{leagueIcons[slug]}</span> {page.name} preview hub</p>
        <h1>{page.title}</h1>
        <p className="lead">{page.description}</p>
        <div className="hero-actions">
          <Link className="btn" href="#league-finder">
            Search previews
          </Link>
          <Link className="secondary-btn" href="/sports-previews/">
            All sports previews
          </Link>
        </div>
      </section>

      <section className="section section--tight" id="league-finder">
        <div className="section-head">
          <div>
            <p className="eyebrow"><Icon name="search" size={14} /> {page.name} preview finder</p>
            <h2>Find a {page.name} preview.</h2>
          </div>
          {stats.lastRunAt ? (
            <span className="hero-badge">
              <Icon name="clock" size={14} />
              Updated {new Date(stats.lastRunAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          ) : null}
        </div>
        <PreviewFinder
          defaultLeague={slug}
          initialVideos={videos}
          initialStatus={`Search ${page.name} previews by team, event, or matchup.`}
        />
        {videos.length === 0 ? (
          <div className="info-card notice">
            <strong>No inventory video yet</strong>
            <p>
              The updater will fill this hub after the first successful inventory sync. You can still search above — this page
              stays indexable because it explains the {page.name} preview intent and links into the finder.
            </p>
          </div>
        ) : null}
      </section>

      <section className="content-block surface">
        <h2>What this page is for</h2>
        <p className="copy">{hub?.answer || page.primaryIntent}</p>
        <ul>
          {page.keywords.map((keyword) => (
            <li key={keyword}>{keyword}</li>
          ))}
        </ul>
      </section>

      {hub?.faqs.length ? (
        <section className="content-block surface">
          <h2>{page.name} preview FAQ</h2>
          <ul>
            {hub.faqs.map((item) => (
              <li key={item.q}>
                <strong>{item.q}</strong> {item.a}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="section">
        <p className="eyebrow">Related discovery pages</p>
        <h2>Continue the preview chain.</h2>
        <div className="league-grid">
          {leaguePages
            .filter((item) => item.slug !== slug)
            .slice(0, 3)
            .map((item) => (
              <Link className="info-card" href={item.path} key={item.slug}>
                <strong>{item.title}</strong>
                <p>{item.primaryIntent}</p>
                <span className="text-link">Open page →</span>
              </Link>
            ))}
        </div>
      </section>
    </>
  );
}
