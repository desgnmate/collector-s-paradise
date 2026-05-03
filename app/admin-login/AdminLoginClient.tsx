'use client';

import React, { useActionState, useState } from 'react';
import { adminLogin } from '@/app/actions/auth';

export default function AdminLoginClient() {
  const [state, formAction, isPending] = useActionState(adminLogin, {
    message: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        {/* Glow orbs */}
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>

        {/* Lock icon */}
        <div className="admin-login-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="admin-login-title">Admin Panel</h1>
        <p className="admin-login-subtitle">Authorized personnel only</p>

        {state?.message && (
          <div className="admin-login-alert admin-login-alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {state.message}
          </div>
        )}

        {state?.success && (
          <div className="admin-login-alert admin-login-alert-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Login successful! Redirecting...
          </div>
        )}

        <form action={formAction} className="admin-login-form">
          <div className="admin-login-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              className="admin-login-input"
              placeholder="admin@collectorsparadise.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="admin-login-group">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-login-password-wrap">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="admin-login-input admin-login-input-password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-yellow admin-login-btn"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <div className="admin-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Signing in...
              </>
            ) : (
              'Sign In to Admin'
            )}
          </button>
        </form>

        <a href="/" className="admin-login-back-link">
          ← Back to Collector&apos;s Paradise
        </a>
      </div>
    </div>
  );
}
