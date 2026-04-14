'use client';

import { useActionState, useState } from 'react';
import { submitVendorApplication } from '@/app/actions/vendors';
import Image from 'next/image';

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
  const [showPassword, setShowPassword] = useState(false);
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
            />
            {state.errors?.business_name && (
              <span className="vendor-form-error">{state.errors.business_name[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="logo">Business Logo / Avatar *</label>
            <div 
              className={`upload-zone ${logoPreview ? 'upload-zone-active' : ''}`}
            >
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                required
                onChange={handleLogoChange}
                className="sr-only"
              />
              
              {logoPreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '3px solid var(--color-dark)' }}>
                    <Image src={logoPreview} alt="Logo preview" fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-dark)', textTransform: 'uppercase' }}>{logoName}</span>
                    <button 
                      type="button" 
                      onClick={() => { setLogoPreview(null); setLogoName(null); }}
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
            </div>
          </div>

          <div className="vendor-form-group">
            <label htmlFor="contact_name">Contact Name *</label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              placeholder="Your full name"
              required
            />
            {state.errors?.contact_name && (
              <span className="vendor-form-error">{state.errors.contact_name[0]}</span>
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
            />
            {state.errors?.email && (
              <span className="vendor-form-error">{state.errors.email[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="password">Account Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a secure password"
                required
                minLength={8}
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/><path d="M14.08 14.08A3 3 0 0 1 9.92 9.92"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {state.errors?.password && (
              <span className="vendor-form-error">{state.errors.password[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="confirm_password">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                required
                minLength={8}
                style={{ width: '100%', paddingRight: '40px' }}
              />
            </div>
            {state.errors?.confirm_password && (
              <span className="vendor-form-error">{state.errors.confirm_password[0]}</span>
            )}
          </div>

          <div className="vendor-form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+61 400 000 000"
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
            >
              <input
                type="checkbox"
                name="categories"
                value={cat}
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="sr-only"
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
          />
          {state.errors?.description && (
            <span className="vendor-form-error">{state.errors.description[0]}</span>
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
