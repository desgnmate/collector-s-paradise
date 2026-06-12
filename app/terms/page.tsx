import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Read the Terms and Conditions governing your use of the Collector\'s Paradise website and services.',
  openGraph: {
    title: "Terms & Conditions | Collector's Paradise",
    description: "Terms and Conditions governing your use of the Collector's Paradise website and services.",
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/terms',
  },
};

export default function TermsPage() {
  return (
    <main>
      <Navbar />

      <section className="legal-page-section">
        <div className="container">
          <div className="legal-page-header">
            <span className="eyebrow-badge">LEGAL</span>
            <h1 className="section-title">Terms &amp; Conditions</h1>
            <p className="legal-page-date">Last updated: April 2026</p>
          </div>

          <div className="legal-page-body">

            <div className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing or using the Collector's Paradise website and services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
            </div>

            <div className="legal-section">
              <h2>2. Use of the Website</h2>
              <p>You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of others. You must not:</p>
              <ul>
                <li>Use the site in any way that violates applicable local, national, or international laws</li>
                <li>Transmit unsolicited or unauthorised advertising material</li>
                <li>Attempt to gain unauthorised access to any part of the website</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use of the website</li>
                <li>Post false, misleading, or fraudulent content</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>3. User Accounts</h2>
              <p>When you create an account with us, you must provide accurate and complete information. You are responsible for:</p>
              <ul>
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorised use of your account</li>
              </ul>
              <p>We reserve the right to terminate accounts that violate these terms.</p>
            </div>

            <div className="legal-section">
              <h2>4. Event Tickets and Registrations</h2>
              <p>When purchasing tickets or registering for events through Collector's Paradise:</p>
              <ul>
                <li>All ticket sales are subject to availability</li>
                <li>Tickets are non-transferable unless otherwise stated</li>
                <li>Refund policies are determined on a per-event basis and will be communicated at the time of purchase</li>
                <li>We reserve the right to cancel or reschedule events, in which case registered attendees will be notified</li>
                <li>You must comply with all event rules and venue requirements</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>5. Vendor Applications and Participation</h2>
              <p>Vendors applying to participate in Collector's Paradise events agree to:</p>
              <ul>
                <li>Provide accurate and truthful information in their application</li>
                <li>Comply with all event rules, booth guidelines, and venue regulations</li>
                <li>Only sell legitimate, authentic products</li>
                <li>Maintain appropriate conduct with attendees and other vendors</li>
                <li>Accept that approval is at the sole discretion of Collector's Paradise</li>
              </ul>
              <p>We reserve the right to reject or revoke vendor applications without obligation to provide reasons.</p>
            </div>

            <div className="legal-section">
              <h2>6. Collections and Community Content</h2>
              <p>Approved vendors may post collection listings on our platform. By posting content, you:</p>
              <ul>
                <li>Confirm you own or have the right to share the content</li>
                <li>Grant Collector's Paradise a non-exclusive licence to display the content on our platform</li>
                <li>Agree not to post misleading, fraudulent, or inappropriate content</li>
                <li>Accept that we may remove content that violates these terms</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>7. Intellectual Property</h2>
              <p>All content on this website — including text, graphics, logos, images, and software — is the property of Collector's Paradise or its content suppliers and is protected by applicable intellectual property laws.</p>
              <p>You may not reproduce, distribute, or create derivative works from our content without express written permission.</p>
            </div>

            <div className="legal-section">
              <h2>8. Disclaimer of Warranties</h2>
              <p>This website and its content are provided "as is" without any warranties, express or implied. We do not warrant that:</p>
              <ul>
                <li>The website will be uninterrupted or error-free</li>
                <li>Any defects will be corrected</li>
                <li>The website is free of viruses or other harmful components</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>9. Limitation of Liability</h2>
              <p>To the fullest extent permitted by law, Collector's Paradise shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services, including but not limited to loss of profits, data, or goodwill.</p>
            </div>

            <div className="legal-section">
              <h2>10. Third-Party Links</h2>
              <p>Our website may contain links to third-party websites. These links are provided for your convenience only. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.</p>
            </div>

            <div className="legal-section">
              <h2>11. Governing Law</h2>
              <p>These Terms and Conditions are governed by and construed in accordance with the laws of Victoria, Australia. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Victoria.</p>
            </div>

            <div className="legal-section">
              <h2>12. Changes to These Terms</h2>
              <p>We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website after any changes constitutes your acceptance of the new terms.</p>
            </div>

            <div className="legal-section">
              <h2>13. Contact Us</h2>
              <p>If you have any questions about these Terms and Conditions, please contact us:</p>
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
