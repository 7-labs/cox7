import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cox7 Archive Routing",
  description:
    "Archive routing page for historical Cox7 sports, video, schedule, events, local video, and STEM journal URL intent.",
  alternates: {
    canonical: "/archive/"
  }
};

const routes = [
  ["/sports/", "/sports-previews/", "Sports intent now maps to official sports preview discovery."],
  ["/video/", "/sports-previews/", "Generic video intent now maps to the all-preview hub."],
  ["/schedule/", "/upcoming-live-sports/", "Schedule intent now maps to upcoming sports video discovery."],
  ["/shows/", "/channels/", "Show/channel intent now maps to trusted YouTube channel discovery."],
  ["/events/", "/upcoming-live-sports/", "Event intent now maps to upcoming sports video discovery."],
  ["/video/cox7-advertiser/*", "/archive/local-video/", "Local advertiser video intent is preserved as archive context."],
  ["/stem-journals/*", "/archive/stem-journals/", "STEM journal intent is preserved without mixing it into sports pages."]
];

export default function ArchivePage() {
  return (
    <>
      <section className="page-header">
        <p className="eyebrow">Old Cox7 URL handling</p>
        <h1>Historical intent is preserved, but the new product is sports previews.</h1>
        <p className="lead">
          This page documents the redirect strategy for old Cox7 video, sports, schedule, events, local content, and STEM journal
          paths. The goal is semantic continuity, not a fake recreation of the old local channel.
        </p>
      </section>

      <section className="content-block surface">
        <h2>Redirect map</h2>
        <div className="results-list">
          {routes.map(([oldPath, newPath, note]) => (
            <div className="info-card" key={oldPath}>
              <strong>{oldPath} → {newPath}</strong>
              <p>{note}</p>
              <Link className="text-link" href={newPath}>
                Open target →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
