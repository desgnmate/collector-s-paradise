'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { requestVendorSignIn, submitReturningVendor, verifyVendorEmailCode } from '@/app/actions/returning-vendors';
import { applicationStatusText, type ReturningProfile } from '@/lib/returning-vendors';
import type { VendorApplicationEvent } from '@/components/VendorApplicationForm';

export function VendorSignInForm({ codeEnabled = false }: { codeEnabled?: boolean }) {
  const [state, action, pending] = useActionState(requestVendorSignIn, { message: '' });
  const [codeState, codeAction, verifying] = useActionState(verifyVendorEmailCode, { message: '' });
  const [email, setEmail] = useState('');
  return <><form action={action} onReset={event => event.preventDefault()} className="vendor-apply-form returning-vendor-form">
    <h2>Find your existing profile</h2>
    <p>Enter the email used on your original application. We will send a secure sign-in link; no password is needed.</p>
    <div className="vendor-form-group">
      <label htmlFor="returning-email">Email address</label>
      <input id="returning-email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
    </div>
    <p role="status" aria-live="polite">{state.message}</p>
    <button className="btn btn-yellow" disabled={pending}>{pending ? 'Sending…' : 'Email me a sign-in link'}</button>
    <Link href="/vendors/apply">First time applying? Register a new business</Link>
  </form>
  {codeEnabled && <form action={codeAction} onReset={event => event.preventDefault()} className="vendor-apply-form returning-vendor-form">
    <h2>Have an email code?</h2>
    <p>Enter it here to continue, even if you read the email on another device.</p>
    <div className="vendor-form-group">
      <label htmlFor="code-email">Email used to request the code</label>
      <input id="code-email" name="email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
    </div>
    <div className="vendor-form-group">
      <label htmlFor="vendor-email-code">Email verification code</label>
      <input id="vendor-email-code" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" minLength={6} maxLength={8} required />
    </div>
    <p role="status" aria-live="polite">{codeState.message}</p>
    <button className="btn btn-yellow" disabled={verifying}>{verifying ? 'Verifying…' : 'Verify email code'}</button>
  </form>}</>;
}

export default function ReturningVendorForm({ profiles, events }: { profiles: ReturningProfile[]; events: VendorApplicationEvent[] }) {
  const [state, action, pending] = useActionState(submitReturningVendor, { message: '' });
  const [profileId, setProfileId] = useState(profiles[0]?.id || '');
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [tables, setTables] = useState('');
  const [power, setPower] = useState('');
  const [notes, setNotes] = useState('');
  const [agreement, setAgreement] = useState(false);
  const profile = profiles.find(item => item.id === profileId);
  const fieldError = (name: string) => state.errors?.[name] && <span role="alert" className="vendor-form-error">{state.errors[name][0]}</span>;

  return <form action={action} onReset={event => event.preventDefault()} className="vendor-apply-form returning-vendor-form">
    <div className="vendor-form-group">
      <label htmlFor="returning-profile">Business profile</label>
      <select id="returning-profile" name="vendor_id" value={profileId} disabled={pending} onChange={event => { setProfileId(event.target.value); setEventIds([]); }}>
        {profiles.map(item => <option key={item.id} value={item.id}>{item.business_name}</option>)}
      </select>
      <p className="vendor-form-hint">Your saved business details and logo will be reused. No new upload is needed.</p>
      {profile && profile.duplicate_count > 1 && <p className="vendor-form-hint">We found older records for this business. Existing applications across those records will be preserved.</p>}
      {fieldError('vendor_id')}
    </div>
    <fieldset className="vendor-form-section" disabled={pending}>
      <legend className="vendor-form-section-title">Choose your events</legend>
      <p>Each event is reviewed separately. Selecting an event already on file will not change its decision.</p>
      {events.length === 0 && <p role="status">No upcoming events are accepting applications right now.</p>}
      <div className="vendor-event-checklist">
        {events.map(event => {
          const statuses = [...new Set(profile?.applications.filter(item => item.event_id === event.id).map(item => item.status))];
          const status = statuses.length > 1 ? 'needs_review' : statuses[0];
          return <label key={event.id} className="vendor-event-option">
            <input type="checkbox" name="event_ids" value={event.id} checked={eventIds.includes(event.id)} onChange={e => setEventIds(previous => e.target.checked ? [...previous, event.id] : previous.filter(id => id !== event.id))} />
            <span className="vendor-event-option-check" aria-hidden="true">✓</span>
            <span className="vendor-event-option-copy"><strong>{event.title}</strong>
              <span>{event.event_date}{event.venue ? ` · ${event.venue}` : ''}</span>
              {status && <span>{applicationStatusText(status)}</span>}
            </span>
          </label>;
        })}
      </div>
      {fieldError('event_ids')}
    </fieldset>
    <fieldset className="vendor-form-section" disabled={pending}>
      <legend className="vendor-form-section-title">Requirements for new applications</legend>
      <div className="vendor-form-grid">
        <div className="vendor-form-group">
          <label htmlFor="returning-tables">Number of tables</label>
          <select id="returning-tables" name="tables_requested" required value={tables} onChange={e => setTables(e.target.value)}>
            <option value="">Select quantity</option>
            {['1', '2', '3', '4', '5+'].map(value => <option key={value} value={value}>{value} {value === '1' ? 'table' : 'tables'}</option>)}
          </select>{fieldError('tables_requested')}
        </div>
        <div className="vendor-form-group">
          <label htmlFor="returning-power">Power requirements</label>
          <select id="returning-power" name="power_requirements" value={power} onChange={e => setPower(e.target.value)}>
            <option value="">Select requirement</option><option value="none">No power needed</option>
            <option value="standard">Standard outlet</option><option value="multiple">Multiple outlets</option><option value="heavy">Heavy duty</option>
          </select>{fieldError('power_requirements')}
        </div>
      </div>
      <div className="vendor-form-group">
        <label htmlFor="returning-notes">Notes for these events</label>
        <textarea id="returning-notes" name="additional_notes" rows={3} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} />
        {fieldError('additional_notes')}
      </div>
      <label className="vendor-agreement-label"><input name="agreement" type="checkbox" required checked={agreement} onChange={e => setAgreement(e.target.checked)} />
        <span>I agree to the <Link href="/terms" target="_blank">Terms and Conditions</Link>. An application does not guarantee acceptance.</span>
      </label>{fieldError('agreement')}
    </fieldset>
    <div aria-live="polite" role="status">
      {state.message && <p className="vendor-form-alert">{state.message}</p>}
      {state.result && <section aria-label="Application results">
        <h2>Event application results</h2>
        <ul>{state.result.outcomes.map(event => <li key={event.event_id}><strong>{event.title}:</strong> {event.outcome === 'created' ? 'Application received — pending review' : applicationStatusText(event.status)}</li>)}</ul>
        <p>Profile reference: {state.result.vendor_id}</p>
        {state.result.receipt_ids.length > 0 && <p>Receipt references: {state.result.receipt_ids.join(', ')}</p>}
      </section>}
    </div>
    <button type="submit" disabled={pending || events.length === 0} className="btn btn-yellow vendor-submit-btn">{pending ? 'Submitting…' : 'Submit selected events'}</button>
    <p className="vendor-form-disclaimer">Retries do not duplicate applications or reset approvals. Contact support to change an application already on file.</p>
  </form>;
}
