export default function AdminConfigurationNotice() {
  return (
    <main className="admin-configuration-notice" aria-labelledby="admin-configuration-title">
      <div className="admin-configuration-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.6 2.5 17.1A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.9L13.7 3.6a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <p className="admin-configuration-eyebrow">Protected access paused</p>
      <h1 id="admin-configuration-title">The admin workspace needs one server setting.</h1>
      <p>
        Your administrator login is valid, but this deployment is missing the private
        Supabase credential used for protected data. No customer or vendor records have
        been exposed.
      </p>
      <div className="admin-configuration-action">
        <strong>Deployment owner action</strong>
        <span>
          Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to the Vercel project for Production,
          Preview, and Development, then redeploy.
        </span>
      </div>
    </main>
  );
}
