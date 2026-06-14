'use client';

import { useState, useActionState } from 'react';
import { submitVolunteerApplication } from '@/app/actions/volunteers';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const VOLUNTEER_ROLES = [
  { id: 'setup', name: 'Event Setup Crew', description: 'Help set up tables, chairs, and decorations (7:00 AM - 10:00 AM)' },
  { id: 'registration', name: 'Registration Desk', description: 'Greet attendees and check tickets (9:00 AM - 1:00 PM or 1:00 PM - 5:00 PM)' },
  { id: 'floor', name: 'Floor Guides', description: 'Assist attendees and ensure smooth flow (10:00 AM - 2:00 PM or 2:00 PM - 6:00 PM)' },
  { id: 'breakdown', name: 'Breakdown Crew', description: 'Help pack up after the event (6:00 PM - 8:00 PM)' },
];

const T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const HOW_HEARD_OPTIONS = [
  'Social Media (Instagram/Facebook)',
  'Friend/Word of Mouth',
  'Previous Event',
  'Email Newsletter',
  'Website',
  'Other',
];

export default function VolunteerApplyPage() {
  const [state, formAction, isPending] = useActionState(submitVolunteerApplication, {
    message: '',
    success: false,
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const handleEventToggle = (eventName: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventName) ? prev.filter(e => e !== eventName) : [...prev, eventName]
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
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1.5rem' }}>{state.message}</p>
              <p style={{ fontSize: '0.95rem', color: '#888' }}>We&apos;ll review your application and contact you via email with available shifts and next steps.</p>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1.5rem' }}>
              <Link href="/" className="vendors-cta-btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '0.75rem 2rem' }}>
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
      <section className="vendors-page-header-section">
        <div className="container">
          <div className="vendors-page-header">
            <span className="eyebrow-badge">VOLUNTEER APPLICATION</span>
            <h1 className="section-title">
              JOIN OUR TEAM
            </h1>
            <p className="section-subtitle">
              Fill out the form below to apply as a volunteer. We&apos;ll get back to you with available shifts and details.
            </p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="section" style={{ padding: '4rem 0' }}>
        <div className="container">
          <form action={formAction} className="vendor-application-form" style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            {/* Personal Information */}
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
                Personal Information
              </h3>
              
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="full_name" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
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
                  {state.errors?.full_name && (
                    <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{state.errors.full_name[0]}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
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
                  {state.errors?.email && (
                    <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{state.errors.email[0]}</p>
                  )}
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="phone" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
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
                  <label htmlFor="t_shirt_size" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    T-Shirt Size (for volunteer shirts)
                  </label>
                  <select
                    id="t_shirt_size"
                    name="t_shirt_size"
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
                    {T_SHIRT_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Volunteer Preferences */}
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
                Volunteer Preferences
              </h3>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Preferred Roles * (Select all that apply)
                </label>
                <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  {VOLUNTEER_ROLES.map(role => (
                    <label key={role.id} className="checkbox-label" style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '1rem',
                      border: '2px solid #e5e5e5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ...(selectedRoles.includes(role.id) ? {
                        borderColor: 'var(--color-yellow)',
                        background: 'rgba(244, 197, 66, 0.05)'
                      } : {})
                    }}>
                      <input
                        type="checkbox"
                        name="preferred_roles"
                        value={role.name}
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        style={{ marginTop: '0.25rem', accentColor: 'var(--color-yellow)' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--color-dark)', display: 'block' }}>{role.name}</span>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{role.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {state.errors?.preferred_roles && (
                  <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{state.errors.preferred_roles[0]}</p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="availability" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Availability * (Describe when you&apos;re available)
                </label>
                <textarea
                  id="availability"
                  name="availability"
                  required
                  rows={4}
                  placeholder="e.g., Available on weekends, weekday mornings, specific dates..."
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
                {state.errors?.availability && (
                  <p className="form-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.25rem' }}>{state.errors.availability[0]}</p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="previous_experience" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                  Previous Volunteer Experience (Optional)
                </label>
                <textarea
                  id="previous_experience"
                  name="previous_experience"
                  rows={3}
                  placeholder="Tell us about any relevant volunteer experience..."
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

            {/* Emergency Contact */}
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
                Emergency Contact
              </h3>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="emergency_contact_name" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
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
                  <label htmlFor="emergency_contact_phone" className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
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
                  How did you hear about volunteering?
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
              <Link href="/volunteers" className="vendors-cta-btn-secondary">
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
      <Footer />
    </main>
  );
}
