import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-header">
      <p className="eyebrow">404</p>
      <h1>This C7 preview page is not available.</h1>
      <p className="lead">
        The video may not be in the seed catalog yet, or the old Cox7 URL may need a more specific archive mapping.
      </p>
      <div className="hero-actions">
        <Link className="btn" href="/#finder">
          Search previews
        </Link>
        <Link className="secondary-btn" href="/archive/">
          View archive routing
        </Link>
      </div>
    </section>
  );
}
