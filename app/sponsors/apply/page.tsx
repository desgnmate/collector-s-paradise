'use client';

import { useState, useActionState } from 'react';
import { submitSponsorApplication } from '@/app/actions/sponsors';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FieldError, HoneypotField, fieldValue, invalidProps } from '@/components/forms/FieldError';
import SuccessHeading from '@/components/forms/SuccessHeading';

const SPONSORSHIP_TIERS = [
  { id: 'platinum', name: 'Platinum ($5,000+)', description: 'Maximum visibility and premium benefits' },
  { id: 'gold', name: 'Gold ($2,500+)', description: 'Great exposure with priority benefits' },
  { id: 'silver', name: 'Silver ($1,000+)', description: 'Solid presence at accessible price' },
  { id: 'custom', name: 'Custom', description: 'Tailored sponsorship package' },
];

const SPONSORSHIP_INTERESTS = [
  { id: 'event', name: 'Event Sponsorship', description: 'Sponsor the entire event or specific areas' },
  { id: 'prize', name: 'Prize Donation', description: 'Provide prizes for tournaments/raffles' },
  { id: 'workshop', name: 'Workshop Hosting', description: 'Host educational workshops' },
  { id: 'panel', name: 'Panel Speaking', description: 'Participate in expert panels' },
  { id: 'activation', name: 'Brand Activation', description: 'Interactive brand experience booth' },
];

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees',
];

const BUDGET_RANGES = [
  '$1,000 - $2,500',
  '$2,500 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000+',
];

const EVENTS_INTEREST = [
  'Monthly Main Event',
  'Special Holiday Events',
  'Tournament Series',
  'Community Meetups',
  'Launch Parties',
];

const ADDITIONAL_SERVICES = [
  'Workshop/Panel Session',
  'Prize Pool Contribution',
  'Exclusive Product Launch',
  'Social Media Collaboration',
  'Email Newsletter Feature',
];

const HOW_HEARD_OPTIONS = [
  'Social Media (Instagram/Facebook)',
  'Industry Connection/Referral',
  'Previous Event Attendance',
  'Website',
  'Email Newsletter',
  'Other',
];

export default function SponsorApplyPage() {
  const [state, formAction, isPending] = useActionState(submitSponsorApplication, {
    message: '',
    success: false,
  });

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId) ? prev.filter(i => i !== interestId) : [...prev, interestId]
    );
  };

  const handleEventToggle = (eventName: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventName) ? prev.filter(e => e !== eventName) : [...prev, eventName]
    );
  };

  const handleServiceToggle = (serviceName: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceName) ? prev.filter(s => s !== serviceName) : [...prev, serviceName]
    );
  };

  if (state.success) {
    return (
      <main>
        <Navbar />
        <div className="container application-success-layout">
          <div className="vendor-form-success">
            <div className="vendor-success-icon" aria-hidden="true">✓</div>
            <SuccessHeading>Application submitted</SuccessHeading>
            <p className="vendor-success-text">{state.message}</p>
            <p className="vendor-success-note">A copy of your application is on its way to your inbox. If it doesn&apos;t arrive in a few minutes, check your spam folder.</p>
            <div className="application-success-actions">
              <Link href="/" className="btn btn-yellow vendor-submit-btn">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Navbar />

      {/* Page Header */}
      <section className="vendor-apply-section">
        <div className="container">
          <div className="vendor-apply-header">
            <span className="eyebrow-badge">SPONSORSHIP APPLICATION</span>
            <h1 className="section-title">
              PARTNER WITH US
            </h1>
            <p className="section-subtitle">
              Fill out the form below to explore sponsorship opportunities. We&apos;ll get back to you with a custom proposal.
            </p>
          </div>

          <div className="vendor-apply-layout">
          {/* onReset: keep what people typed when the server returns an error. */}
          <form action={formAction} onReset={(event) => event.preventDefault()} className="vendor-apply-form application-form-consistent">
            {state.message && !state.success && (
              <div className="vendor-form-alert vendor-form-alert-error" role="alert">
                {state.message}
              </div>
            )}
            <HoneypotField />

            {/* Company Information */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Company Information
              </h3>

              <div className="vendor-form-grid">
                <div className="vendor-form-group">
                  <label htmlFor="company_name" className="form-label">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    defaultValue={fieldValue(state.fields, 'company_name')}
                    autoComplete="organization"
                    maxLength={200}
                    {...invalidProps(state.errors, 'company_name')}
                    required
                    className="form-input"

                  />
                  <FieldError errors={state.errors} name="company_name" />
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="website" className="form-label">
                    Company Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    defaultValue={fieldValue(state.fields, 'website')}
                    autoComplete="url"
                    maxLength={500}
                    {...invalidProps(state.errors, 'website')}
                    placeholder="https://yourcompany.com"
                    className="form-input"

                  />
                  <FieldError errors={state.errors} name="website" />
                </div>
              </div>

              <div className="vendor-form-grid">
                <div className="vendor-form-group">
                  <label htmlFor="industry" className="form-label">
                    Industry
                  </label>
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    defaultValue={fieldValue(state.fields, 'industry')}
                    maxLength={200}
                    placeholder="e.g., Gaming, Retail, Food & Beverage"
                    className="form-input"

                  />
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="company_size" className="form-label">
                    Company Size
                  </label>
                  <select
                    id="company_size"
                    name="company_size"
                    defaultValue={fieldValue(state.fields, 'company_size')}
                    className="form-input"

                  >
                    <option value="">Select size...</option>
                    {COMPANY_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Contact Information
              </h3>

              <div className="vendor-form-grid">
                <div className="vendor-form-group">
                  <label htmlFor="contact_name" className="form-label">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    id="contact_name"
                    name="contact_name"
                    defaultValue={fieldValue(state.fields, 'contact_name')}
                    autoComplete="name"
                    maxLength={200}
                    {...invalidProps(state.errors, 'contact_name')}
                    required
                    className="form-input"

                  />
                  <FieldError errors={state.errors} name="contact_name" />
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="contact_position" className="form-label">
                    Position/Title
                  </label>
                  <input
                    type="text"
                    id="contact_position"
                    name="contact_position"
                    defaultValue={fieldValue(state.fields, 'contact_position')}
                    autoComplete="organization-title"
                    maxLength={200}
                    placeholder="e.g., Marketing Director, CEO"
                    className="form-input"

                  />
                </div>
              </div>

              <div className="vendor-form-grid">
                <div className="vendor-form-group">
                  <label htmlFor="contact_email" className="form-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    defaultValue={fieldValue(state.fields, 'contact_email')}
                    autoComplete="email"
                    maxLength={320}
                    {...invalidProps(state.errors, 'contact_email')}
                    required
                    className="form-input"

                  />
                  <FieldError errors={state.errors} name="contact_email" />
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="contact_phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    defaultValue={fieldValue(state.fields, 'contact_phone')}
                    autoComplete="tel"
                    maxLength={50}
                    className="form-input"

                  />
                </div>
              </div>
            </div>

            {/* Sponsorship Details */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Sponsorship Details
              </h3>

              <div className="vendor-form-group">
                <label htmlFor="sponsorship_tier" className="form-label">
                  Preferred Sponsorship Tier
                </label>
                <select
                  id="sponsorship_tier"
                  name="sponsorship_tier"
                  defaultValue={fieldValue(state.fields, 'sponsorship_tier')}
                  className="form-input"

                >
                  <option value="">Select a tier...</option>
                  {SPONSORSHIP_TIERS.map(tier => (
                    <option key={tier.id} value={tier.id}>{tier.name}</option>
                  ))}
                </select>
              </div>

              <fieldset
                className="vendor-form-group"
                aria-required="true"
                {...invalidProps(state.errors, 'sponsorship_interest')}
              >
                <legend className="form-label">
                  Sponsorship Interests * (Select all that apply)
                </legend>
                <div className="application-choice-grid">
                  {SPONSORSHIP_INTERESTS.map(interest => (
                    <label key={interest.id} className="application-choice">
                      <input
                        type="checkbox"
                        name="sponsorship_interest"
                        value={interest.name}
                        checked={selectedInterests.includes(interest.id)}
                        onChange={() => handleInterestToggle(interest.id)}

                      />
                      <div>
                        <span>{interest.name}</span>
                        <span>{interest.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <FieldError errors={state.errors} name="sponsorship_interest" />
              </fieldset>

              <div className="vendor-form-group">
                <label htmlFor="budget_range" className="form-label">
                  Budget Range
                </label>
                <select
                  id="budget_range"
                  name="budget_range"
                  defaultValue={fieldValue(state.fields, 'budget_range')}
                  className="form-input"

                >
                  <option value="">Select budget range...</option>
                  {BUDGET_RANGES.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              <div className="vendor-form-group">
                <label htmlFor="previous_sponsor" className="application-choice">
                  <input
                    type="checkbox"
                    id="previous_sponsor"
                    name="previous_sponsor"
                    defaultChecked={state.fields?.previous_sponsor === true}

                  />
                  <span>We have sponsored Collector&apos;s Paradise events before</span>
                </label>
              </div>

            </div>

            {/* Brand & Marketing */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Brand & Marketing
              </h3>

              <div className="vendor-form-group">
                <label htmlFor="brand_description" className="form-label">
                  Brand Description * (Brief overview of your company/brand)
                </label>
                <textarea
                  id="brand_description"
                  name="brand_description"
                  defaultValue={fieldValue(state.fields, 'brand_description')}
                  required
                  minLength={10}
                  maxLength={1000}
                  aria-describedby={state.errors?.brand_description ? 'brand_description-hint brand_description-error' : 'brand_description-hint'}
                  aria-invalid={state.errors?.brand_description ? true : undefined}
                  rows={4}
                  placeholder="Tell us about your brand, products, and target audience..."
                  className="form-input"

                />
                <p id="brand_description-hint" className="form-field-hint">10–1000 characters.</p>
                <FieldError errors={state.errors} name="brand_description" />
              </div>

              <div className="vendor-form-group">
                <label htmlFor="social_media_links" className="form-label">
                  Social Media Links
                </label>
                <input
                  type="text"
                  id="social_media_links"
                  name="social_media_links"
                  defaultValue={fieldValue(state.fields, 'social_media_links')}
                  maxLength={1000}
                  placeholder="https://instagram.com/yourbrand or https://facebook.com/yourbrand"
                  className="form-input"

                />
              </div>

              <div className="vendor-form-group">
                <label htmlFor="marketing_goals" className="form-label">
                  Marketing Goals (What do you hope to achieve?)
                </label>
                <textarea
                  id="marketing_goals"
                  name="marketing_goals"
                  defaultValue={fieldValue(state.fields, 'marketing_goals')}
                  maxLength={2000}
                  rows={3}
                  placeholder="e.g., Brand awareness, product launches, community engagement..."
                  className="form-input"

                />
              </div>
            </div>

            {/* Event Preferences */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Event Preferences
              </h3>

              <fieldset className="vendor-form-group">
                <legend className="form-label">
                  Events Interested In
                </legend>
                <div className="application-choice-grid">
                  {EVENTS_INTEREST.map(event => (
                    <label key={event} className="application-choice">
                      <input
                        type="checkbox"
                        name="events_interested"
                        value={event}
                        checked={selectedEvents.includes(event)}
                        onChange={() => handleEventToggle(event)}

                      />
                      <span>{event}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="vendor-form-group">
                <legend className="form-label">
                  Additional Services
                </legend>
                <div className="application-choice-grid">
                  {ADDITIONAL_SERVICES.map(service => (
                    <label key={service} className="application-choice">
                      <input
                        type="checkbox"
                        name="additional_services"
                        value={service}
                        checked={selectedServices.includes(service)}
                        onChange={() => handleServiceToggle(service)}

                      />
                      <span>{service}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="vendor-form-group">
                <label htmlFor="preferred_booth_size" className="form-label">
                  Preferred Booth Size
                </label>
                <input
                  type="text"
                  id="preferred_booth_size"
                  name="preferred_booth_size"
                  defaultValue={fieldValue(state.fields, 'preferred_booth_size')}
                  maxLength={200}
                  placeholder="e.g., Standard table, 3x3m booth, Custom setup"
                  className="form-input"

                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Additional Information
              </h3>

              <div className="vendor-form-group">
                <label htmlFor="how_heard_about" className="form-label">
                  How did you hear about sponsorship opportunities?
                </label>
                <select
                  id="how_heard_about"
                  name="how_heard_about"
                  defaultValue={fieldValue(state.fields, 'how_heard_about')}
                  className="form-input"

                >
                  <option value="">Select an option...</option>
                  {HOW_HEARD_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="vendor-form-group">
                <label htmlFor="custom_proposal" className="form-label">
                  Custom Proposal (Optional)
                </label>
                <textarea
                  id="custom_proposal"
                  name="custom_proposal"
                  defaultValue={fieldValue(state.fields, 'custom_proposal')}
                  maxLength={2000}
                  rows={3}
                  placeholder="If you have a custom sponsorship idea, tell us about it..."
                  className="form-input"

                />
              </div>

              <div className="vendor-form-group">
                <label htmlFor="additional_notes" className="form-label">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="additional_notes"
                  name="additional_notes"
                  defaultValue={fieldValue(state.fields, 'additional_notes')}
                  maxLength={2000}
                  rows={3}
                  placeholder="Any other information you&apos;d like to share..."
                  className="form-input"

                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="application-form-actions">
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-yellow vendor-submit-btn"

              >
                {isPending ? 'Submitting...' : 'Submit Application'}
              </button>
              <Link href="/sponsorship" className="application-form-cancel">
                Cancel
              </Link>
            </div>

          </form>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
