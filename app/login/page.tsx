'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, {
    message: '',
  });

  return (
    <main>
      <Navbar />
      <section className="auth-section">
        <div className="container">
          <div className="auth-container" data-aos="fade-up">
            <div className="auth-header">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Login to your Collector&apos;s Paradise account</p>
            </div>

            <form action={formAction} className="auth-form">
              {state?.message && (
                <div className="auth-alert auth-alert-error">
                  {state.message}
                </div>
              )}

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

              <button
                type="submit"
                className="btn btn-yellow"
                disabled={isPending}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {isPending ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Don&apos;t have an account? <Link href="/signup" className="auth-link">Sign up as Buyer</Link></p>
              <p style={{ marginTop: '0.5rem' }}>Want to sell? <Link href="/vendors/apply" className="auth-link">Apply as Vendor</Link></p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
