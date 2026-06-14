import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read our Privacy Policy to understand how Collector\'s Paradise collects, uses, and protects your personal information.',
  openGraph: {
    title: "Privacy Policy | Collector's Paradise",
    description: "How Collector's Paradise collects, uses, and protects your personal information.",
    url: "https://collectorsparadise.au/privacy",
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />

      <section className="legal-page-section">
        <div className="container">
          <div className="legal-page-header">
            <span className="eyebrow-badge">LEGAL</span>
            <h1 className="section-title">Privacy Policy</h1>
            <p className="legal-page-date">Last updated: April 2026</p>
          </div>

          <div className="legal-page-body">

            <div className="legal-section">
              <h2>1. Introduction</h2>
              <p>Welcome to Collector's Paradise ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>
            </div>

            <div className="legal-section">
              <h2>2. Information We Collect</h2>
              <p>We may collect the following types of information:</p>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register for an account.</li>
                <li><strong>Vendor Information:</strong> Business name, business description, logo, and booth preferences when you apply as a vendor.</li>
                <li><strong>Transaction Data:</strong> Event ticket purchases and registration details.</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on the site, browser type, and device information.</li>
                <li><strong>Communications:</strong> Messages you send us via contact forms or email.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Create and manage your account</li>
                <li>Process event registrations and ticket purchases</li>
                <li>Review and process vendor applications</li>
                <li>Send event reminders and updates (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Respond to your enquiries and support requests</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>4. Sharing Your Information</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with:</p>
              <ul>
                <li><strong>Service Providers:</strong> Trusted third-party services that help us operate our platform (e.g., Supabase for database hosting, payment processors).</li>
                <li><strong>Event Organisers:</strong> Relevant registration details shared with event staff for check-in purposes.</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>5. Data Storage and Security</h2>
              <p>Your data is stored securely using Supabase infrastructure with industry-standard encryption. We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.</p>
              <p>However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
            </div>

            <div className="legal-section">
              <h2>6. Cookies</h2>
              <p>We use cookies and similar tracking technologies to enhance your experience on our website. These include:</p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for the website to function (e.g., authentication sessions).</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site.</li>
              </ul>
              <p>You can control cookie settings through your browser preferences.</p>
            </div>

            <div className="legal-section">
              <h2>7. Your Rights</h2>
              <p>Depending on your location, you may have the following rights regarding your personal data:</p>
              <ul>
                <li>The right to access your personal information</li>
                <li>The right to correct inaccurate data</li>
                <li>The right to request deletion of your data</li>
                <li>The right to withdraw consent at any time</li>
                <li>The right to data portability</li>
              </ul>
              <p>To exercise any of these rights, please contact us at the details below.</p>
            </div>

            <div className="legal-section">
              <h2>8. Children's Privacy</h2>
              <p>Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.</p>
            </div>

            <div className="legal-section">
              <h2>9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page with an updated date. We encourage you to review this policy periodically.</p>
            </div>

            <div className="legal-section">
              <h2>10. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="legal-contact-card">
                <p><strong>Collector's Paradise</strong></p>
                <p>Melbourne, Australia</p>
                <p>Email: <a href="mailto:hello@collectorsparadise.au">hello@collectorsparadise.au</a></p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
