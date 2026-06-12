/**
 * Skeleton placeholder for the <Highlights /> section. Renders the
 * same outer shape as the real component (header + card grid) so
 * page layout doesn't shift while the events query is in flight.
 */
export default function HighlightsSkeleton() {
  return (
    <section id="highlights" className="highlights-section" aria-hidden="true">
      <div className="container">
        <div className="highlights-header">
          <span className="eyebrow-badge">PREVIOUS &amp; UPCOMING EVENTS</span>
          <h2 className="section-title">COLLECTOR&apos;S CALENDAR</h2>
          <p className="section-subtitle">
            Discover everything happening at the event, from trading zones to exclusive finds.
          </p>
        </div>
        <div
          className="ec-grid"
          style={{ pointerEvents: 'none' }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="ec-card"
              style={{ opacity: 0.5 }}
            >
              <div
                className="ec-image-wrapper"
                style={{ background: 'rgba(46, 46, 46, 0.08)' }}
              />
              <div className="ec-content">
                <div
                  style={{
                    height: 14,
                    width: 80,
                    background: 'rgba(46, 46, 46, 0.08)',
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />
                <div
                  style={{
                    height: 22,
                    width: '85%',
                    background: 'rgba(46, 46, 46, 0.08)',
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    height: 14,
                    width: '60%',
                    background: 'rgba(46, 46, 46, 0.08)',
                    borderRadius: 4,
                    marginBottom: 16,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
