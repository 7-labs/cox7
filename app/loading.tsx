export default function Loading() {
  return (
    <section className="section">
      <div className="page-header">
        <p className="eyebrow">Loading</p>
        <h1>Refreshing C7 inventory…</h1>
        <p className="lead">The page is loading verified preview inventory and metadata.</p>
      </div>
      <div className="results-list">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="video-card skeleton-card" key={index} aria-hidden="true" />
        ))}
      </div>
    </section>
  );
}
