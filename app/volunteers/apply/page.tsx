'use client';

import { useState, useActionState } from 'react';
import { submitVolunteerApplication } from '@/app/actions/volunteers';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FieldError, HoneypotField, fieldValue, invalidProps } from '@/components/forms/FieldError';
import SuccessHeading from '@/components/forms/SuccessHeading';

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

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
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
            <p className="vendor-success-note">We&apos;ll review your application and contact you via email with available shifts and next steps.</p>
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
            <span className="eyebrow-badge">VOLUNTEER APPLICATION</span>
            <h1 className="section-title">
              JOIN OUR TEAM
            </h1>
            <p className="section-subtitle">
              Fill out the form below to apply as a volunteer. We&apos;ll get back to you with available shifts and details.
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

            {/* Personal Information */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Personal Information
              </h3>

              <div className="vendor-form-grid">
                <div className="vendor-form-group">
                  <label htmlFor="full_name" className="form-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    defaultValue={fieldValue(state.fields, 'full_name')}
                    autoComplete="name"
                    maxLength={200}
                    {...invalidProps(state.errors, 'full_name')}
                    required
                    className="form-input"

                  />
                  <FieldError errors={state.errors} name="full_name" />
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={fieldValue(state.fields, 'email')}
                    autoComplete="email"
                    maxLength={320}
                    {...invalidProps(state.errors, 'email')}
                    required
                    className="form-input"

                  />
                  <FieldError errors={state.errors} name="email" />
                </div>
              </div>

              <div className="vendor-form-grid">
                <div className="vendor-form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    defaultValue={fieldValue(state.fields, 'phone')}
                    autoComplete="tel"
                    maxLength={50}
                    className="form-input"

                  />
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="t_shirt_size" className="form-label">
                    T-Shirt Size (for volunteer shirts)
                  </label>
                  <select
                    id="t_shirt_size"
                    name="t_shirt_size"
                    defaultValue={fieldValue(state.fields, 't_shirt_size')}
                    className="form-input"

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
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Volunteer Preferences
              </h3>

              <fieldset
                className="vendor-form-group"
                aria-required="true"
                {...invalidProps(state.errors, 'preferred_roles')}
              >
                <legend className="form-label">
                  Preferred Roles * (Select all that apply)
                </legend>
                <div className="application-choice-grid">
                  {VOLUNTEER_ROLES.map(role => (
                    <label key={role.id} className="application-choice">
                      <input
                        type="checkbox"
                        name="preferred_roles"
                        value={role.name}
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}

                      />
                      <div>
                        <span>{role.name}</span>
                        <span>{role.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <FieldError errors={state.errors} name="preferred_roles" />
              </fieldset>

              <div className="vendor-form-group">
                <label htmlFor="availability" className="form-label">
                  Availability * (Describe when you&apos;re available)
                </label>
                <textarea
                  id="availability"
                  name="availability"
                  defaultValue={fieldValue(state.fields, 'availability')}
                  required
                  minLength={10}
                  maxLength={1000}
                  aria-describedby={state.errors?.availability ? 'availability-hint availability-error' : 'availability-hint'}
                  aria-invalid={state.errors?.availability ? true : undefined}
                  rows={4}
                  placeholder="e.g., Available on weekends, weekday mornings, specific dates..."
                  className="form-input"

                />
                <p id="availability-hint" className="form-field-hint">At least 10 characters — the days and times that suit you.</p>
                <FieldError errors={state.errors} name="availability" />
              </div>

              <div className="vendor-form-group">
                <label htmlFor="previous_experience" className="form-label">
                  Previous Volunteer Experience (Optional)
                </label>
                <textarea
                  id="previous_experience"
                  name="previous_experience"
                  defaultValue={fieldValue(state.fields, 'previous_experience')}
                  maxLength={2000}
                  rows={3}
                  placeholder="Tell us about any relevant volunteer experience..."
                  className="form-input"

                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Emergency Contact
              </h3>

              <div className="vendor-form-grid">
                <div className="vendor-form-group">
                  <label htmlFor="emergency_contact_name" className="form-label">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    defaultValue={fieldValue(state.fields, 'emergency_contact_name')}
                    autoComplete="off"
                    maxLength={200}
                    className="form-input"

                  />
                </div>

                <div className="vendor-form-group">
                  <label htmlFor="emergency_contact_phone" className="form-label">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    defaultValue={fieldValue(state.fields, 'emergency_contact_phone')}
                    autoComplete="off"
                    maxLength={50}
                    className="form-input"

                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="vendor-form-section">
              <h3 className="vendor-form-section-title">
                Additional Information
              </h3>

              <div className="vendor-form-group">
                <label htmlFor="how_heard_about" className="form-label">
                  How did you hear about volunteering?
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
              <Link href="/volunteers" className="application-form-cancel">
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
