import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "STEM Journals Archive",
  description:
    "Archive landing page for old Cox7 STEM journal URLs, separated from the new C7 sports preview product.",
  alternates: {
    canonical: "/archive/stem-journals/"
  }
};

export default function StemJournalsArchivePage() {
  return (
    <section className="page-header">
      <p className="eyebrow">STEM archive</p>
      <h1>STEM journal URLs are preserved as archive context.</h1>
      <p className="lead">
        Some historical Cox7 paths were community or STEM-oriented. C7 keeps that intent separate from the sports preview product
        so old links have a meaningful landing page without confusing the new site theme.
      </p>
      <div className="hero-actions">
        <Link className="btn" href="/archive/">
          View redirect map
        </Link>
        <Link className="secondary-btn" href="/">
          Back to C7 Sports Previews
        </Link>
      </div>
    </section>
  );
}
