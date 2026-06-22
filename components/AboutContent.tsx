'use client';

export default function AboutContent() {
  return (
    <div className="admin-content-panel">
      {/* Header */}
      <div className="vendor-page-header">
        <div className="vendor-page-header-left">
          <h2 className="vendor-page-title">About</h2>
          <p className="vendor-page-subtitle">Credits, support, and website information</p>
        </div>
      </div>

      <div className="about-grid">
        {/* Developer Card - Full Width */}
        <div className="about-card about-card-highlight">
          <div className="about-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="about-highlight-content">
            <span className="about-highlight-label">Designed & Developed By</span>
            <a
              href="https://desgnmate.com"
              target="_blank"
              rel="noopener noreferrer"
              className="about-card-link"
            >
              DESGNMATE.COM
            </a>
            <p className="about-card-desc">
              Professional web design and development studio crafting modern, high-performance digital experiences.
            </p>
          </div>
        </div>

        {/* Support Card */}
        <div className="about-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h3 className="about-card-title">Need Help?</h3>
          <p className="about-card-desc">
            If you encounter any issues with the website or admin panel, please contact the development team:
          </p>
          <a
            href="mailto:hello@desgnmate.com"
            className="about-contact-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            hello@desgnmate.com
          </a>
        </div>

        {/* System Info Card */}
        <div className="about-card">
          <div className="about-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <h3 className="about-card-title">System Info</h3>
          <div className="about-info-grid">
            <div className="about-info-item">
              <span className="about-info-label">Admin Panel</span>
              <span className="about-info-value">v1.0.0</span>
            </div>
            <div className="about-info-item">
              <span className="about-info-label">Last Updated</span>
              <span className="about-info-value">{new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="about-footer">
        <p>
          Designed and developed by{' '}
          <a href="https://desgnmate.com" target="_blank" rel="noopener noreferrer">
            DESGNMATE.COM
          </a>
        </p>
      </div>
    </div>
  );
}
