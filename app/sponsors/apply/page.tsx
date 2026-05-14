'use client';

import { useState, useActionState } from 'react';
import { submitSponsorApplication } from '@/app/actions/sponsors';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
        <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content modal-lg" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <div className="modal-header" style={{ borderBottom: '2px solid var(--color-yellow)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 className="modal-title" style={{ margin: 0, color: 'var(--color-dark)' }}>Application Submitted!</h3>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}></div>
              <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1.5rem' }}>{state.message}</p>
              <p style={{ fontSize: '0.95rem', color: '#888' }}>Our partnerships team will review your application and contact you within 2-3 business days.</p>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1.5rem' }}>
              <Link href="/" className="vendors-cta-btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '0.75rem 2rem' }}>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Navbar />

      {/* Page Header */}
      <section className="vendors-page-header-section">
        <div className="container">
          <div className="vendors-page-header">
            <span className="eyebrow-badge">SPONSORSHIP APPLICATION</span>
            <h1 className="section-title">
              PARTNER WITH US
            </h1>
            <p className="section-subtitle">
              Fill out the form below to explore sponsorship opportunities. We&apos;ll get back to you with a custom proposal.
            </p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="section" style={{ padding: '4rem 0' }}>
        <div className="container">
          <form action={formAction} className="vendor-application-form" style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Company Information */}
            <div className="form-section" style={{ marginBottom: '2.5rem' }}>
              <h3 className="form-section-title" style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--color-yellow)'
              }}>
                Company Information
              </h3>
              
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="company_name" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    required
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  {state.errors?.company_name && (
                    <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{state.errors.company_name[0]}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="website" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Company Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    placeholder="https://yourcompany.com"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="industry" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Industry
                  </label>
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    placeholder="e.g., Gaming, Retail, Food & Beverage"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company_size" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Company Size
                  </label>
                  <select
                    id="company_size"
                    name="company_size"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
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
            <div className="form-section" style={{ marginBottom: '2.5rem' }}>
              <h3 className="form-section-title" style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--color-yellow)'
              }}>
                Contact Information
              </h3>
              
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="contact_name" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    id="contact_name"
                    name="contact_name"
                    required
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  {state.errors?.contact_name && (
                    <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{state.errors.contact_name[0]}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="contact_position" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Position/Title
                  </label>
                  <input
                    type="text"
                    id="contact_position"
                    name="contact_position"
                    placeholder="e.g., Marketing Director, CEO"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="contact_email" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    required
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  {state.errors?.contact_email && (
                    <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{state.errors.contact_email[0]}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="contact_phone" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sponsorship Details */}
            <div className="form-section" style={{ marginBottom: '2.5rem' }}>
              <h3 className="form-section-title" style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--color-yellow)'
              }}>
                Sponsorship Details
              </h3>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="sponsorship_tier" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Preferred Sponsorship Tier
                </label>
                <select
                  id="sponsorship_tier"
                  name="sponsorship_tier"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <option value="">Select a tier...</option>
                  {SPONSORSHIP_TIERS.map(tier => (
                    <option key={tier.id} value={tier.id}>{tier.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Sponsorship Interests * (Select all that apply)
                </label>
                <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  {SPONSORSHIP_INTERESTS.map(interest => (
                    <label key={interest.id} className="checkbox-label" style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ...(selectedInterests.includes(interest.id) ? {
                        borderColor: 'var(--color-yellow)',
                        background: 'rgba(244, 197, 66, 0.05)'
                      } : {})
                    }}>
                      <input
                        type="checkbox"
                        name="sponsorship_interest"
                        value={interest.name}
                        checked={selectedInterests.includes(interest.id)}
                        onChange={() => handleInterestToggle(interest.id)}
                        style={{ marginTop: '0.25rem', accentColor: 'var(--color-yellow)' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--color-dark)', display: 'block' }}>{interest.name}</span>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{interest.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {state.errors?.sponsorship_interest && (
                  <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{state.errors.sponsorship_interest[0]}</p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="budget_range" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Budget Range
                </label>
                <select
                  id="budget_range"
                  name="budget_range"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <option value="">Select budget range...</option>
                  {BUDGET_RANGES.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="previous_sponsor" className="checkbox-label" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    id="previous_sponsor"
                    name="previous_sponsor"
                    style={{ accentColor: 'var(--color-yellow)' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>We have sponsored Collector&apos;s Paradise events before</span>
                </label>
              </div>

              {state.errors?.brand_description && (
                <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{state.errors.brand_description[0]}</p>
              )}
            </div>

            {/* Brand & Marketing */}
            <div className="form-section" style={{ marginBottom: '2.5rem' }}>
              <h3 className="form-section-title" style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--color-yellow)'
              }}>
                Brand & Marketing
              </h3>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="brand_description" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Brand Description * (Brief overview of your company/brand)
                </label>
                <textarea
                  id="brand_description"
                  name="brand_description"
                  required
                  rows={4}
                  placeholder="Tell us about your brand, products, and target audience..."
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="social_media_links" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Social Media Links
                </label>
                <input
                  type="url"
                  id="social_media_links"
                  name="social_media_links"
                  placeholder="https://instagram.com/yourbrand or https://facebook.com/yourbrand"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="marketing_goals" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Marketing Goals (What do you hope to achieve?)
                </label>
                <textarea
                  id="marketing_goals"
                  name="marketing_goals"
                  rows={3}
                  placeholder="e.g., Brand awareness, product launches, community engagement..."
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </div>

            {/* Event Preferences */}
            <div className="form-section" style={{ marginBottom: '2.5rem' }}>
              <h3 className="form-section-title" style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--color-yellow)'
              }}>
                Event Preferences
              </h3>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Events Interested In
                </label>
                <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {EVENTS_INTEREST.map(event => (
                    <label key={event} className="checkbox-label" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ...(selectedEvents.includes(event) ? {
                        borderColor: 'var(--color-yellow)',
                        background: 'rgba(244, 197, 66, 0.05)'
                      } : {})
                    }}>
                      <input
                        type="checkbox"
                        name="events_interested"
                        value={event}
                        checked={selectedEvents.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        style={{ accentColor: 'var(--color-yellow)' }}
                      />
                      <span style={{ fontWeight: 500, color: 'var(--color-dark)' }}>{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Additional Services
                </label>
                <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {ADDITIONAL_SERVICES.map(service => (
                    <label key={service} className="checkbox-label" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ...(selectedServices.includes(service) ? {
                        borderColor: 'var(--color-yellow)',
                        background: 'rgba(244, 197, 66, 0.05)'
                      } : {})
                    }}>
                      <input
                        type="checkbox"
                        name="additional_services"
                        value={service}
                        checked={selectedServices.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        style={{ accentColor: 'var(--color-yellow)' }}
                      />
                      <span style={{ fontWeight: 500, color: 'var(--color-dark)' }}>{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="preferred_booth_size" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Preferred Booth Size
                </label>
                <input
                  type="text"
                  id="preferred_booth_size"
                  name="preferred_booth_size"
                  placeholder="e.g., Standard table, 3x3m booth, Custom setup"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="form-section" style={{ marginBottom: '2.5rem' }}>
              <h3 className="form-section-title" style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid var(--color-yellow)'
              }}>
                Additional Information
              </h3>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="how_heard_about" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  How did you hear about sponsorship opportunities?
                </label>
                <select
                  id="how_heard_about"
                  name="how_heard_about"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <option value="">Select an option...</option>
                  {HOW_HEARD_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="custom_proposal" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Custom Proposal (Optional)
                </label>
                <textarea
                  id="custom_proposal"
                  name="custom_proposal"
                  rows={3}
                  placeholder="If you have a custom sponsorship idea, tell us about it..."
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="additional_notes" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="additional_notes"
                  name="additional_notes"
                  rows={3}
                  placeholder="Any other information you&apos;d like to share..."
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e5e5',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions" style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(0,0,0,0.1)'
            }}>
              <button
                type="submit"
                disabled={isPending}
                className="vendors-cta-btn-primary"
                style={{
                  minWidth: '200px',
                  opacity: isPending ? 0.7 : 1,
                  cursor: isPending ? 'not-allowed' : 'pointer'
                }}
              >
                {isPending ? 'Submitting...' : 'Submit Application'}
              </button>
              <Link href="/sponsorship" className="vendors-cta-btn-secondary">
                Cancel
              </Link>
            </div>

            {state.message && !state.success && (
              <div className="form-message" style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                color: '#92400e',
                textAlign: 'center'
              }}>
                {state.message}
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
