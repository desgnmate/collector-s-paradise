'use client';

import { useState, useActionState } from 'react';
import { submitSponsorApplication } from '@/app/actions/sponsors';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
            <h2 className="vendor-success-title">Application submitted</h2>
            <p className="vendor-success-text">{state.message}</p>
            <p className="vendor-success-note">Our partnerships team will review your application and contact you within 2-3 business days.</p>
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
          <form action={formAction} className="vendor-apply-form application-form-consistent">
            {state.message && !state.success && (
              <div className="vendor-form-alert vendor-form-alert-error" role="alert">
                {state.message}
              </div>
            )}

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
                    required
                    className="form-input"

                  />
                  {state.errors?.company_name && (
                    <p className="vendor-form-error">{state.errors.company_name[0]}</p>
                  )}
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="website" className="form-label">
                    Company Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    placeholder="https://yourcompany.com"
                    className="form-input"

                  />
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
                    required
                    className="form-input"

                  />
                  {state.errors?.contact_name && (
                    <p className="vendor-form-error">{state.errors.contact_name[0]}</p>
                  )}
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="contact_position" className="form-label">
                    Position/Title
                  </label>
                  <input
                    type="text"
                    id="contact_position"
                    name="contact_position"
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
                    required
                    className="form-input"

                  />
                  {state.errors?.contact_email && (
                    <p className="vendor-form-error">{state.errors.contact_email[0]}</p>
                  )}
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="contact_phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
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
                  className="form-input"

                >
                  <option value="">Select a tier...</option>
                  {SPONSORSHIP_TIERS.map(tier => (
                    <option key={tier.id} value={tier.id}>{tier.name}</option>
                  ))}
                </select>
              </div>

              <div className="vendor-form-group">
                <label className="form-label">
                  Sponsorship Interests * (Select all that apply)
                </label>
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
                {state.errors?.sponsorship_interest && (
                  <p className="vendor-form-error">{state.errors.sponsorship_interest[0]}</p>
                )}
              </div>

              <div className="vendor-form-group">
                <label htmlFor="budget_range" className="form-label">
                  Budget Range
                </label>
                <select
                  id="budget_range"
                  name="budget_range"
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

                  />
                  <span>We have sponsored Collector&apos;s Paradise events before</span>
                </label>
              </div>

              {state.errors?.brand_description && (
                <p className="vendor-form-error">{state.errors.brand_description[0]}</p>
              )}
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
                  required
                  rows={4}
                  placeholder="Tell us about your brand, products, and target audience..."
                  className="form-input"

                />
              </div>

              <div className="vendor-form-group">
                <label htmlFor="social_media_links" className="form-label">
                  Social Media Links
                </label>
                <input
                  type="url"
                  id="social_media_links"
                  name="social_media_links"
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

              <div className="vendor-form-group">
                <label className="form-label">
                  Events Interested In
                </label>
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
              </div>

              <div className="vendor-form-group">
                <label className="form-label">
                  Additional Services
                </label>
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
              </div>

              <div className="vendor-form-group">
                <label htmlFor="preferred_booth_size" className="form-label">
                  Preferred Booth Size
                </label>
                <input
                  type="text"
                  id="preferred_booth_size"
                  name="preferred_booth_size"
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
