import type { Metadata } from "next";
import { trustedChannels } from "@/lib/c7-data";

export const metadata: Metadata = {
  title: "Trusted Sports YouTube Channels",
  description:
    "C7 Sports Previews channel whitelist for official and trusted sports preview video discovery.",
  alternates: {
    canonical: "/channels/"
  }
};

export default function ChannelsPage() {
  return (
    <>
      <section className="page-header">
        <p className="eyebrow">Trusted channel directory</p>
        <h1>Start with sources that reduce risk.</h1>
        <p className="lead">
          C7 is designed around a whitelist-first model. League and network channels are preferred before broader discovery, and
          every result still needs preview intent and embeddability checks.
        </p>
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
              <p className="copy">Channel ID: <code>{channel.channelId}</code></p>
              <a className="text-link" href={channel.youtubeUrl} target="_blank" rel="noreferrer">
                Open on YouTube →
              </a>
            </article>
          ))}
        </div>
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
