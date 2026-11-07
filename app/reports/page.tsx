import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS } from '@/lib/seo/metadata';
import Navbar from '@/components/Navbar';
import ReportIssueForm from './ReportIssueForm';
import styles from './reports.module.css';

export const metadata: Metadata = {
  title: "Report an Issue | Collector's Paradise",
  description: "File a support ticket for a website, booking, vendor, accessibility, payment, or event-information issue.",
  alternates: { canonical: '/reports' },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    title: "Report an Issue | Collector's Paradise",
    description: "File a support ticket for a website, booking, vendor, accessibility, payment, or event-information issue.",
    url: '/reports',
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialPageUrl = typeof params.from === 'string' ? params.from : '';

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>Website support</p>
            <h1>Report a problem</h1>
            <p className={styles.heroCopy}>
              Tell us what happened and we&apos;ll send a ticket reference to your email.
            </p>
          </div>
        </section>

        <section className={styles.content}>
          <ReportIssueForm initialPageUrl={initialPageUrl} />
        </section>
      </main>
    </>
  );
}
