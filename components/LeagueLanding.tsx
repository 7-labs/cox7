import Link from "next/link";
import Icon from "@/components/Icon";
import VideoCard from "@/components/VideoCard";
import { getLeaguePage, leagueIcons, leaguePages, site, type LeagueSlug } from "@/lib/c7-data";
import { getInventoryStats, getLeagueVideos } from "@/lib/inventory";

export default async function LeagueLanding({ slug }: { slug: LeagueSlug }) {
  const page = getLeaguePage(slug);
  const [videos, stats] = await Promise.all([getLeagueVideos(slug, 12), getInventoryStats()]);

  if (!page) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: page.title,
        description: page.description,
        url: `${site.url}${page.path}`
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: site.url
          },
          {
            "@type": "ListItem",
            position: 2,
            name: page.name,
            item: `${site.url}${page.path}`
          }
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
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="page-header">
        <p className="eyebrow"><span aria-hidden="true">{leagueIcons[slug]}</span> {page.name} preview hub</p>
        <h1>{page.title}</h1>
        <p className="lead">{page.description}</p>
        <div className="hero-actions">
          <Link className="btn" href="/#finder">
            Search previews
          </Link>
          <Link className="secondary-btn" href="/sports-previews/">
            All sports previews
          </Link>
        </div>
      </section>

      <section className="section section--tight">
        <div className="section-head">
          <div>
            <p className="eyebrow"><Icon name="play" size={14} /> {page.name} preview videos</p>
            <h2>Latest {page.name} previews.</h2>
          </div>
          {stats.lastRunAt ? (
            <span className="hero-badge">
              <Icon name="clock" size={14} />
              Updated {new Date(stats.lastRunAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          ) : null}
        </div>
        <div className="results-grid">
          {videos.length > 0 ? (
            videos.map((video, index) => <VideoCard video={video} priority={index === 0} key={video.id} />)
          ) : (
            <div className="info-card notice">
              <strong>No inventory video yet</strong>
              <p>
                The updater will fill this hub after the first successful inventory sync. Keep this page indexable because it still
                explains the search intent and links users into the finder.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="content-block surface">
        <h2>What this page is for</h2>
        <p className="copy">{page.primaryIntent}</p>
        <ul>
          {page.keywords.map((keyword) => (
            <li key={keyword}>{keyword}</li>
          ))}
        </ul>
      </section>

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
