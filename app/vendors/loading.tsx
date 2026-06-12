import TopProgressBar from '@/components/TopProgressBar';

export default function Loading() {
  return (
    <>
      <TopProgressBar />
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-cream)',
        }}
      >
        <div className="page-loading-spinner" />
      </div>
      <style>{`
        .page-loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(46, 46, 46, 0.1);
          border-top-color: var(--color-yellow, #F4C542);
          border-radius: 50%;
          animation: pageSpin 0.8s linear infinite;
        }
        @keyframes pageSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
