import type { Metadata } from "next";
import Link from "next/link";
import { site, trustedChannels } from "@/lib/c7-data";

export const metadata: Metadata = {
  title: "Trusted Sports YouTube Channels",
  description:
    "C7 Sports Previews channel whitelist for official and trusted sports preview video discovery.",
  alternates: {
    canonical: "/channels/"
  }
};

const faqs = [
  {
    q: "Which channels qualify for C7?",
    a: "Official league channels, official network channels, and a small number of trusted sports channels that consistently publish preview-intent videos."
  },
  {
    q: "Does C7 list every sports YouTube channel?",
    a: "No. The directory stays intentionally narrow so preview discovery remains trustworthy and avoids replay-heavy or unclear-rights channels."
  },
  {
    q: "Why are raw channel IDs hidden here?",
    a: "C7 stores channel IDs internally for verification, but this public page focuses on source trust, league coverage, and direct YouTube attribution."
  }
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: "Channels", item: `${site.url}/channels/` }
      ]
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    }
  ]
};

export default function ChannelsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="page-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            <li><Link className="text-link" href="/">Home</Link></li>
            <li><span aria-current="page">Channels</span></li>
          </ol>
        </nav>
        <p className="eyebrow">Trusted channel directory</p>
        <h1>Start with sources that reduce risk.</h1>
        <p className="lead">
          C7 is designed around a whitelist-first model. League and network channels are preferred before broader discovery, and
          every result still needs preview intent and embeddability checks.
        </p>
        <div className="hero-actions">
          <Link className="btn" href="/search/">
            Search trusted previews
          </Link>
          <Link className="secondary-btn" href="/sports-previews/">
            Browse all previews
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="channel-grid">
          {trustedChannels.map((channel) => (
            <article className="info-card" key={channel.channelId}>
              <p className="kicker">
                <span className="pill">{channel.sourceLevel.replace(/-/g, " ")}</span>
                <span>{channel.leagues.map((league) => league.toUpperCase()).join(" / ")}</span>
              </p>
              <h2>{channel.name}</h2>
              <p>{channel.notes}</p>
              <a className="text-link" href={channel.youtubeUrl} target="_blank" rel="noreferrer">
                Open on YouTube →
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="content-block surface">
        <h2>Channel directory FAQ</h2>
        <ul>
          {faqs.map((item) => (
            <li key={item.q}>
              <strong>{item.q}</strong> {item.a}
            </li>
          ))}
        </ul>
      </section>

      <section className="content-block surface notice">
        <h2>Expansion rule</h2>
        <p>
          Add channels slowly. A new source should be official, league-owned, network-owned, or consistently useful for preview
          intent. Avoid channels where the main value is copied replay footage, betting-only content, or unclear rights ownership.
        </p>
      </section>
    </>
  );
}
