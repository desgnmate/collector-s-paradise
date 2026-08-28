'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { CheckCircle2, LoaderCircle, Send } from 'lucide-react';
import { submitSupportReport, type ReportFormState } from '@/app/actions/reports';
import { REPORT_CATEGORY_OPTIONS, REPORT_IMPACT_OPTIONS } from '@/lib/reports';
import { SITE_URL } from '@/lib/site';
import styles from './reports.module.css';

const initialState: ReportFormState = { message: '' };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className={styles.fieldError}>{errors[0]}</p>;
}

function normalisePageUrl(value: string) {
  try {
    const url = new URL(value, SITE_URL);
    if (!['http:', 'https:'].includes(url.protocol)) return '';

    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      return new URL(`${url.pathname}${url.search}${url.hash}`, SITE_URL).toString();
    }

    return url.toString();
  } catch {
    return '';
  }
}

export default function ReportIssueForm({ initialPageUrl = '' }: { initialPageUrl?: string }) {
  const [state, formAction, isPending] = useActionState(submitSupportReport, initialState);
  const pageUrlRef = useRef<HTMLInputElement>(null);
  const browserDetailsRef = useRef<HTMLInputElement>(null);
  const normalisedInitialPageUrl = normalisePageUrl(initialPageUrl);

  useEffect(() => {
    if (browserDetailsRef.current) browserDetailsRef.current.value = navigator.userAgent;

    if (normalisedInitialPageUrl) {
      if (pageUrlRef.current) pageUrlRef.current.value = normalisedInitialPageUrl;
      return;
    }

    if (document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        if (pageUrlRef.current && referrer.origin === window.location.origin && referrer.pathname !== '/reports') {
          pageUrlRef.current.value = normalisePageUrl(referrer.toString());
        }
      } catch {
        // The affected page is optional; leave it empty when a referrer is invalid.
      }
    }
  }, [normalisedInitialPageUrl]);

  if (state.success) {
    return (
      <div className={styles.successCard} role="status">
        <span className={styles.successIcon}><CheckCircle2 aria-hidden="true" /></span>
        <p className={styles.eyebrow}>Report received</p>
        <h2>Thanks for letting us know.</h2>
        <p>{state.message}</p>
        <div className={styles.ticketReference}>
          <span>Ticket reference</span>
          <strong>{state.ticketNumber}</strong>
        </div>
        <p className={styles.successNote}>Our team can reply to the email address you provided if we need more information.</p>
        <div className={styles.successActions}>
          <button type="button" className={styles.primaryLink} onClick={() => window.location.reload()}>File another report</button>
          <Link href="/" className={styles.secondaryLink}>Return home</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input ref={browserDetailsRef} type="hidden" name="browser_details" defaultValue="" />
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="report-website">Website</label>
        <input id="report-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.formHeading}>
        <h2>Send us the details</h2>
        <p>Required fields are marked with an asterisk. Please do not include passwords or payment card details.</p>
      </div>

      {state.message && (
        <div className={styles.formAlert} role="alert">{state.message}</div>
      )}

      <div className={styles.twoColumns}>
        <div className={styles.field}>
          <label htmlFor="report-name">Your name *</label>
          <input
            id="report-name"
            name="reporter_name"
            type="text"
            autoComplete="name"
            defaultValue={state.fields?.reporter_name}
            aria-invalid={Boolean(state.errors?.reporter_name)}
            required
          />
          <FieldError errors={state.errors?.reporter_name} />
        </div>
        <div className={styles.field}>
          <label htmlFor="report-email">Email address *</label>
          <input
            id="report-email"
            name="reporter_email"
            type="email"
            autoComplete="email"
            defaultValue={state.fields?.reporter_email}
            aria-invalid={Boolean(state.errors?.reporter_email)}
            required
          />
          <FieldError errors={state.errors?.reporter_email} />
        </div>
      </div>

      <div className={styles.twoColumns}>
        <div className={styles.field}>
          <label htmlFor="report-category">What do you need help with? *</label>
          <select
            id="report-category"
            name="category"
            defaultValue={state.fields?.category || ''}
            aria-invalid={Boolean(state.errors?.category)}
            required
          >
            <option value="" disabled>Select a category</option>
            {REPORT_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldError errors={state.errors?.category} />
        </div>
        <div className={styles.field}>
          <label htmlFor="report-page">Affected page</label>
          <input
            id="report-page"
            ref={pageUrlRef}
            name="page_url"
            type="url"
            inputMode="url"
            placeholder="https://www.collectorsparadise.au/events"
            defaultValue={state.fields?.page_url || normalisedInitialPageUrl}
            aria-invalid={Boolean(state.errors?.page_url)}
          />
          <FieldError errors={state.errors?.page_url} />
        </div>
      </div>

      <fieldset className={styles.impactFieldset}>
        <legend>How much is this affecting you? *</legend>
        <div className={styles.impactGrid}>
          {REPORT_IMPACT_OPTIONS.map((option) => (
            <label className={styles.impactOption} key={option.value}>
              <input
                type="radio"
                name="impact"
                value={option.value}
                defaultChecked={(state.fields?.impact || 'medium') === option.value}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>
        <FieldError errors={state.errors?.impact} />
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="report-subject">Short summary *</label>
        <input
          id="report-subject"
          name="subject"
          type="text"
          placeholder="For example: Checkout button does not respond"
          maxLength={160}
          defaultValue={state.fields?.subject}
          aria-invalid={Boolean(state.errors?.subject)}
          required
        />
        <FieldError errors={state.errors?.subject} />
      </div>

      <div className={styles.field}>
        <label htmlFor="report-description">What happened? *</label>
        <textarea
          id="report-description"
          name="description"
          rows={7}
          placeholder="What were you trying to do, and what happened instead? Include any error message you saw."
          maxLength={5000}
          defaultValue={state.fields?.description}
          aria-invalid={Boolean(state.errors?.description)}
          required
        />
        <FieldError errors={state.errors?.description} />
      </div>

      <label className={styles.consent}>
        <input type="checkbox" name="privacy_acknowledgement" required />
        <span>
          I agree that Collector&apos;s Paradise may use these details, including basic browser information, to investigate and respond to this report. *
        </span>
      </label>
      <FieldError errors={state.errors?.privacy_acknowledgement} />

      <button className={styles.submitButton} type="submit" disabled={isPending}>
        {isPending ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : <Send aria-hidden="true" />}
        {isPending ? 'Filing report…' : 'File report'}
      </button>
    </form>
  );
}
