'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { signUp } from '@/app/actions/auth';

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUp, {
    message: '',
  });

  return (
    <main>
      <Navbar />
      <section className="auth-section">
        <div className="container">
          <div className="auth-container" data-aos="fade-up">
            <div className="auth-header">
              <h1 className="auth-title">Join the Paradise</h1>
              <p className="auth-subtitle">Create a collector account to get started</p>
            </div>

            <form action={formAction} className="auth-form">
              {state?.message && (
                <div className="auth-alert auth-alert-error">
                  {state.message}
                </div>
              )}

              <div className="auth-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="auth-input"
                  placeholder="John Smith"
                  required
                />
                {state?.errors?.fullName && (
                  <span className="vendor-form-error">{state.errors.fullName[0]}</span>
                )}
              </div>

              <div className="auth-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  required
                />
                {state?.errors?.email && (
                  <span className="vendor-form-error">{state.errors.email[0]}</span>
                )}
              </div>

              <div className="auth-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  required
                />
                {state?.errors?.password && (
                  <span className="vendor-form-error">{state.errors.password[0]}</span>
                )}
              </div>

              <div className="auth-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  required
                />
                {state?.errors?.confirmPassword && (
                  <span className="vendor-form-error">{state.errors.confirmPassword[0]}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-yellow"
                disabled={isPending}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {isPending ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <Link href="/login" className="auth-link">Login here</Link></p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
