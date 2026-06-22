'use client';

import { useActionState, useState } from 'react';
import { submitVendorApplication } from '@/app/actions/vendors';

const AUSTRALIAN_STATES = [
  'New South Wales',
  'Victoria',
  'Queensland',
  'Western Australia',
  'South Australia',
  'Tasmania',
  'Australian Capital Territory',
  'Northern Territory',
];

const VENDOR_CATEGORIES = [
  'Pokémon TCG',
  'Yu-Gi-Oh!',
  'Magic: The Gathering',
  'One Piece TCG',
  'Dragon Ball Super',
  'Sports Cards',
  'Vintage / Retro Cards',
  'Card Accessories & Supplies',
  'Graded Cards',
  'Other Collectibles',
];

export default function VendorApplicationForm() {
  const [state, formAction, isPending] = useActionState(submitVendorApplication, {
    message: '',
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoName(file.name);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    } else {
      setLogoName(null);
      setLogoPreview(null);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  if (state.success) {
    return (
      <div className="vendor-form-success">
        <div className="vendor-success-icon">✓</div>
        <h2 className="vendor-success-title">Application Submitted!</h2>
        <p className="vendor-success-text">
          Thanks for your interest in joining Collector&apos;s Paradise as a vendor.
          We&apos;ll review your application and get back to you via email within 3–5 business days.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="vendor-apply-form">
      {state.message && !state.success && (
        <div className="vendor-form-alert vendor-form-alert-error">
          {state.message}
        </div>
      )}

      {/* Business Info */}
      <div className="vendor-form-section">
        <h3 className="vendor-form-section-title">Business Information</h3>
        <div className="vendor-form-grid">
          <div className="vendor-form-group">
            <label htmlFor="business_name">Business Name *</label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              placeholder="e.g. Rare Card Co."
              required
              defaultValue={state.fields?.business_name || ''}
            />
            {state.errors?.business_name && (
              <span className="vendor-form-error">{state.errors.business_name[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="logo">Business Logo / Avatar *</label>
            <label 
              htmlFor="logo"
              className={`upload-zone ${logoPreview ? 'upload-zone-active' : ''}`}
              style={{ cursor: 'pointer', display: 'block', position: 'relative' }}
            >
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                required
                onChange={handleLogoChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                }}
              />
              
              {logoPreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '3px solid var(--color-dark)' }}>
                    <img src={logoPreview || ''} alt="Logo preview" loading="lazy" style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-dark)', textTransform: 'uppercase' }}>{logoName}</span>
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setLogoPreview(null); setLogoName(null); }}
                      style={{ 
                        background: 'var(--color-red)', 
                        color: 'white', 
                        border: '2px solid var(--color-dark)', 
                        padding: '4px 12px', 
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>Click to change image</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    background: 'var(--color-yellow)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '3px solid var(--color-dark)'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-dark)' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-dark)', textTransform: 'uppercase' }}>Click to upload logo</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#666' }}>Maximum file size: 5MB (PNG, JPG)</span>
                </div>
              )}
            </label>
          </div>

          <div className="vendor-form-group">
            <label htmlFor="contact_name">Contact Name *</label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              placeholder="Your full name"
              required
              defaultValue={state.fields?.contact_name || ''}
            />
            {state.errors?.contact_name && (
              <span className="vendor-form-error">{state.errors.contact_name[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="location_state">State *</label>
            <select
              id="location_state"
              name="location_state"
              required
              defaultValue={state.fields?.location_state || ''}
            >
              <option value="">Select a state...</option>
              {AUSTRALIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {state.errors?.location_state && (
              <span className="vendor-form-error">{state.errors.location_state[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              defaultValue={state.fields?.email || ''}
            />
            {state.errors?.email && (
              <span className="vendor-form-error">{state.errors.email[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+61 400 000 000"
              defaultValue={state.fields?.phone || ''}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="vendor-form-section">
        <h3 className="vendor-form-section-title">What do you sell? *</h3>
        <p className="vendor-form-section-hint">Select all categories that apply.</p>
        <div className="vendor-category-grid">
          {VENDOR_CATEGORIES.map((cat) => (
            <label
              key={cat}
              className={`vendor-category-chip ${selectedCategories.includes(cat) ? 'selected' : ''}`}
              style={{ position: 'relative' }}
            >
              <input
                type="checkbox"
                name="categories"
                value={cat}
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <span className="vendor-chip-check">
                {selectedCategories.includes(cat) ? '✓' : '+'}
              </span>
              {cat}
            </label>
          ))}
        </div>
        {state.errors?.categories && (
          <span className="vendor-form-error">{state.errors.categories[0]}</span>
        )}
      </div>

      {/* Description */}
      <div className="vendor-form-section">
        <h3 className="vendor-form-section-title">About Your Business *</h3>
        <div className="vendor-form-group vendor-form-group-wide">
          <label htmlFor="description">
            Tell us about your products, experience, and what you&apos;d bring to the event.
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="We specialize in graded vintage Pokémon cards and sealed booster boxes. We've been selling at collector events for 3 years..."
            required
            defaultValue={state.fields?.description || ''}
          />
          {state.errors?.description && (
            <span className="vendor-form-error">{state.errors.description[0]}</span>
          )}
        </div>
      </div>

      {/* Social Media */}
      <div className="vendor-form-section">
        <h3 className="vendor-form-section-title">Social Media & Online Presence</h3>
        <div className="vendor-form-grid">
          <div className="vendor-form-group vendor-form-group-wide">
            <label htmlFor="social_links">Instagram / Social Links *</label>
            <input
              id="social_links"
              name="social_links"
              type="url"
              required
              placeholder="https://instagram.com/yourbusiness"
              defaultValue={state.fields?.social_links || ''}
            />
            <span className="vendor-form-hint">Share your Instagram, Facebook, or other social profiles.</span>
          </div>
        </div>
      </div>

      {/* Event Requirements */}
      <div className="vendor-form-section">
        <h3 className="vendor-form-section-title">Event Requirements</h3>
        <div className="vendor-form-grid">
          <div className="vendor-form-group">
            <label htmlFor="tables_requested">Number of Tables Requested *</label>
            <select
              id="tables_requested"
              name="tables_requested"
              required
              defaultValue={state.fields?.tables_requested || ''}
            >
              <option value="">Select quantity</option>
              <option value="1">1 Table</option>
              <option value="2">2 Tables</option>
              <option value="3">3 Tables</option>
              <option value="4">4 Tables</option>
              <option value="5+">5+ Tables (contact for large setup)</option>
            </select>
            {state.errors?.tables_requested && (
              <span className="vendor-form-error">{state.errors.tables_requested[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="power_requirements">Power Requirements</label>
            <select
              id="power_requirements"
              name="power_requirements"
              defaultValue={state.fields?.power_requirements || ''}
            >
              <option value="">Select requirement</option>
              <option value="none">No power needed</option>
              <option value="standard">Standard outlet (1-2 devices)</option>
              <option value="multiple">Multiple outlets (3+ devices)</option>
              <option value="heavy">Heavy duty (equipment requiring dedicated circuit)</option>
            </select>
            <span className="vendor-form-hint">Let us know your electrical needs for the event.</span>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="vendor-form-section">
        <h3 className="vendor-form-section-title">Additional Notes</h3>
        <div className="vendor-form-group vendor-form-group-wide">
          <label htmlFor="additional_notes">Anything else we should know?</label>
          <textarea
            id="additional_notes"
            name="additional_notes"
            rows={4}
            placeholder="Special setup requirements, accessibility needs, or other information..."
            defaultValue={state.fields?.additional_notes || ''}
          />
        </div>
      </div>

      {/* Agreement */}
      <div className="vendor-form-section">
        <div className="vendor-form-group vendor-form-group-wide">
          <label className="vendor-agreement-label">
            <input
              type="checkbox"
              name="agreement"
              required
              defaultChecked={state.fields?.agreement === true}
            />
            <span>
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a> and confirm that all information provided is accurate. I understand that submission of this application does not guarantee vendor acceptance. *
            </span>
          </label>
          {state.errors?.agreement && (
            <span className="vendor-form-error">{state.errors.agreement[0]}</span>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-yellow vendor-submit-btn"
        disabled={isPending}
      >
        {isPending ? 'Submitting...' : 'Submit Application'}
      </button>

      <p className="vendor-form-disclaimer">
        By submitting this form, you agree to be contacted regarding vendor opportunities
        at Collector&apos;s Paradise events. All applications are reviewed by our team.
      </p>
    </form>
  );
}
