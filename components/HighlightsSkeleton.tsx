/**
 * Skeleton placeholder for the <Highlights /> section. Renders the
 * same outer shape as the real component (header + card grid) so
 * page layout doesn't shift while the events query is in flight.
 */
export default function HighlightsSkeleton() {
  return (
    <section id="highlights" className="highlights-section highlights-skeleton" aria-hidden="true">
      <div className="container">
        <div className="highlights-calendar-shell">
          <div className="highlights-header">
            <div className="highlights-header-copy">
              <span className="eyebrow-badge">EVENTS &amp; EXPERIENCES</span>
              <h2 className="section-title">COLLECTOR&apos;S CALENDAR</h2>
              <p className="section-subtitle">
                Find your next collector meet-up, plan the day and secure your place before the tables fill up.
              </p>
            </div>
          </div>

          <div className="highlights-controls-wrapper highlights-skeleton-controls">
            <div className="highlights-toggle-container">
              <div className="toggle-btn active">Upcoming <span className="toggle-count" /></div>
              <div className="toggle-btn">Past <span className="toggle-count" /></div>
            </div>
            <div className="view-toggle-container">
              <div className="view-btn active"><span className="skeleton-view-grid" /></div>
              <div className="view-btn"><span className="skeleton-view-calendar" /></div>
            </div>
          </div>

          <div className="ec-grid-wrapper">
            <div className="ec-grid ec-grid--single highlights-skeleton-grid">
              <div className="highlights-skeleton-card">
                <div className="highlights-skeleton-cover">
                  <span className="highlights-skeleton-date" />
                </div>
                <div className="highlights-skeleton-content">
                  <div className="highlights-skeleton-kicker">
                    <span className="skeleton-line skeleton-line--date" />
                  </div>
                  <span className="skeleton-line skeleton-line--title" />
                  <span className="skeleton-line skeleton-line--title-short" />
                  <div className="highlights-skeleton-spacer" />
                  <span className="skeleton-line skeleton-line--meta" />
                  <span className="skeleton-line skeleton-line--cta" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
