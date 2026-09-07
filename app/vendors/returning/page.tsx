import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ReturningVendorForm, { VendorSignInForm } from '@/components/ReturningVendorForm';
import { getVendorApplicationEvents } from '@/app/actions/events';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { returningProfilesSchema, type ReturningProfile } from '@/lib/returning-vendors';
import { signOutReturningVendor } from '@/app/actions/returning-vendors';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Apply with an existing vendor profile', robots: { index: false, follow: false } };

export default async function ReturningVendorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  let email: string | undefined;
  let profiles: ReturningProfile[] = [];
  let loadError = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email_confirmed_at) {
      email = user.email;
      const { data, error } = await supabase.rpc('my_vendor_profiles');
      if (error?.code === '42501') email = undefined; // Password-only sessions must verify the mailbox.
      else if (error) throw error;
      else profiles = returningProfilesSchema.parse(data);
    }
  } catch { loadError = true; }
  const events = email && !loadError ? await getVendorApplicationEvents() : [];
  return (
    <main>
      <Navbar />
      <section className="vendor-apply-section">
        <div className="container">
          <div className="vendor-apply-header">
            <span className="eyebrow-badge">RETURNING VENDORS</span>
            <h1 className="section-title">APPLY WITH YOUR PROFILE</h1>
            <p className="section-subtitle">Keep your existing business details and logo. Choose your next events.</p>
          </div>
          <div className="vendor-apply-form-wrapper">
            {params.error && <p role="alert" className="vendor-form-alert">This sign-in link expired or was opened in a different browser. Request a fresh link below and open it in this browser.</p>}
            {email && <form action={signOutReturningVendor} className="vendor-form-section">
              <p>Verified as {email}</p>
              <button type="submit" className="btn btn-yellow">Use another email</button>
            </form>}
            {loadError ? <div role="alert" className="vendor-form-alert">
              We could not load your profiles. <Link href="/vendors/returning">Try again</Link> or <Link href="/reports">contact support</Link>. No applications have been changed.
            </div> : !email ? <VendorSignInForm /> : profiles.length === 0 ? <div className="vendor-form-alert">
              No vendor profile is linked to this verified email. Try the email used for your original application, <Link href="/reports">ask support to update it</Link>, or <Link href="/vendors/apply">register a new business</Link>.
            </div> : <ReturningVendorForm profiles={profiles} events={events} />}
            <p className="vendor-form-disclaimer">Changed your email or business details? <Link href="/reports">Contact support</Link> so we can update your existing profile without losing its history.</p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
