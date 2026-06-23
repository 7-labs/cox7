import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Local Video Archive",
  description:
    "Archive landing page for old Cox7 local video and advertiser video URLs, now routed into the C7 Sports Previews structure.",
  alternates: {
    canonical: "/archive/local-video/"
  }
};

export default function LocalVideoArchivePage() {
  return (
    <section className="page-header">
      <p className="eyebrow">Local video archive</p>
      <h1>Old local video paths now land here.</h1>
      <p className="lead">
        Historical Cox7 local video URLs are preserved as archive intent. New C7 pages focus on official sports preview discovery,
        but this archive page avoids dropping old video-related links into a generic 404.
      </p>
      <div className="hero-actions">
        <Link className="btn" href="/sports-previews/">
          Browse sports previews
        </Link>
        <Link className="secondary-btn" href="/archive/">
          View redirect map
        </Link>
      </div>
    </section>
  );
}
