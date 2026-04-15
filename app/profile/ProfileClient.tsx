'use client';

import React, { useActionState, useState } from 'react';
import Image from 'next/image';
import { updateProfile, updatePassword, signOut } from '@/app/actions/auth';
import type { User } from '@supabase/supabase-js';

interface ProfileProps {
  user: User;
  profile: any;
  registeredEvents?: any[];
}

export default function ProfileClient({ user, profile, registeredEvents = [] }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'info' | 'security'>('orders');

  const [profileState, profileAction, isProfilePending] = useActionState(updateProfile, { message: '' });
  const [passwordState, passwordAction, isPasswordPending] = useActionState(updatePassword, { message: '' });

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const shopName = profile?.shop_name || `${displayName.split(' ')[0].toUpperCase()}'S CARD SHOP`;

  return (
    <div className="profile-v2-wrapper">
      {/* Banner */}
      <div className="profile-v2-banner">
        <div className="profile-v2-banner-sky" />
      </div>

      {/* Avatar + Name */}
      <div className="profile-v2-identity">
        <div className="profile-v2-avatar-ring">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="profile-v2-avatar-img" />
          ) : (
            <div className="profile-v2-avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="profile-v2-name">{displayName.toUpperCase()}</h1>
        <p className="profile-v2-shop">{shopName}</p>
      </div>

      {/* Tabs */}
      <div className="profile-v2-tabs">
        <button
          className={`profile-v2-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={`profile-v2-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Personal Information
        </button>
        <button
          className={`profile-v2-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-v2-content">
        {activeTab === 'orders' && (
          <div className="profile-v2-card">
            <div className="security-section-block">
              <div className="security-block-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
                <div>
                  <h3 className="security-block-title">My Tickets</h3>
                  <p className="security-block-desc">Events you've registered for</p>
                </div>
              </div>

              {registeredEvents.length === 0 ? (
                <div className="orders-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
                  <p>No tickets yet</p>
                  <span>Register for an upcoming event to see your tickets here.</span>
                </div>
              ) : (
                <div className="orders-ticket-list">
                  {registeredEvents.map((event: any) => {
                    const eventDate = new Date(event.event_date);
                    const now = new Date();
                    const isPast = eventDate < now;
                    const isToday = eventDate.toDateString() === now.toDateString();
                    const statusLabel = isToday ? 'Today' : isPast ? 'Completed' : 'Upcoming';
                    const statusClass = isToday ? 'ticket-status--today' : isPast ? 'ticket-status--past' : 'ticket-status--upcoming';
                    const formattedDate = eventDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
                    const formattedTime = event.start_time ? `${event.start_time}${event.end_time ? ' – ' + event.end_time : ''}` : null;

                    return (
                      <div key={event.id} className="orders-ticket-card">
                        {/* Cover image */}
                        <div className="orders-ticket-img">
                          {event.cover_image_url ? (
                            <Image src={event.cover_image_url} alt={event.title} fill style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="orders-ticket-img-placeholder" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="orders-ticket-body">
                          <div className="orders-ticket-top">
                            <h3 className="orders-ticket-title">{event.title}</h3>
                            <span className={`orders-ticket-status ${statusClass}`}>{statusLabel}</span>
                          </div>

                          <div className="orders-ticket-meta">
                            <span className="orders-ticket-meta-item">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              {formattedDate}
                            </span>
                            {formattedTime && (
                              <span className="orders-ticket-meta-item">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {formattedTime}
                              </span>
                            )}
                            {event.venue && (
                              <span className="orders-ticket-meta-item">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {event.venue}
                              </span>
                            )}
                          </div>

                          {event.description && (
                            <p className="orders-ticket-desc">{event.description}</p>
                          )}
                        </div>

                        {/* Ticket stub */}
                        <div className="orders-ticket-stub">
                          <div className="orders-ticket-stub-notch orders-ticket-stub-notch--top" />
                          <div className="orders-ticket-stub-notch orders-ticket-stub-notch--bottom" />
                          <span className="orders-ticket-price">
                            {event.ticket_price > 0 ? `$${event.ticket_price}` : 'FREE'}
                          </span>
                          <span className="orders-ticket-label">TICKET</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="profile-v2-card">

            {/* Profile Details */}
            <div className="security-section-block">
              <div className="security-block-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <div>
                  <h3 className="security-block-title">Profile Details</h3>
                  <p className="security-block-desc">Your public-facing name and shop identity</p>
                </div>
              </div>
              <form action={profileAction} className="security-password-form">
                {profileState?.message && (
                  <div className={`auth-alert ${profileState.success ? 'auth-alert-success' : 'auth-alert-error'}`} style={{ gridColumn: '1 / -1' }}>
                    {profileState.message}
                  </div>
                )}
                <div className="auth-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input id="fullName" name="fullName" type="text" className="profile-input" defaultValue={profile?.full_name || ''} placeholder="Your full name" required />
                </div>
                <div className="auth-group">
                  <label htmlFor="shopName">Shop Name</label>
                  <input id="shopName" name="shopName" type="text" className="profile-input" defaultValue={profile?.shop_name || ''} placeholder="e.g. John's Card Shop" />
                </div>
                <div className="auth-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input id="phone" name="phone" type="tel" className="profile-input" defaultValue={profile?.phone || ''} placeholder="+61 XXX XXX XXX" />
                </div>
                <div className="auth-group">
                  <label>Email Address</label>
                  <input type="email" className="profile-input profile-input--active" value={user.email} disabled />
                </div>
                <div className="profile-form-actions">
                  <button type="button" className="btn-profile-cancel" onClick={() => setActiveTab('orders')}>Cancel</button>
                  <button type="submit" className="btn-profile-save" disabled={isProfilePending}>
                    {isProfilePending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            <div className="security-divider" />

            {/* Collector Preferences */}
            <div className="security-section-block">
              <div className="security-block-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <div>
                  <h3 className="security-block-title">Collector Preferences</h3>
                  <p className="security-block-desc">Tell vendors and the community what you're into</p>
                </div>
              </div>
              <div className="security-toggles">
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Pokémon TCG</span>
                    <span className="security-toggle-hint">Cards, booster packs, sealed product</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="security-switch-track" />
                  </label>
                </div>
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Graded Slabs</span>
                    <span className="security-toggle-hint">PSA, BGS, CGC graded cards</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="security-switch-track" />
                  </label>
                </div>
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Vintage & Rare Finds</span>
                    <span className="security-toggle-hint">Base set, first editions, promos</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" />
                    <span className="security-switch-track" />
                  </label>
                </div>
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Merchandise & Accessories</span>
                    <span className="security-toggle-hint">Sleeves, binders, display cases</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" />
                    <span className="security-switch-track" />
                  </label>
                </div>
              </div>
            </div>

            <div className="security-divider" />

            {/* Account Type */}
            <div className="security-section-block">
              <div className="security-block-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                <div>
                  <h3 className="security-block-title">Account Type</h3>
                  <p className="security-block-desc">How you primarily participate at events</p>
                </div>
              </div>
              <div className="security-toggles">
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Collector / Buyer</span>
                    <span className="security-toggle-hint">Attending to buy, trade and collect</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="security-switch-track" />
                  </label>
                </div>
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Vendor / Seller</span>
                    <span className="security-toggle-hint">Interested in booking a booth</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" />
                    <span className="security-switch-track" />
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'security' && (
          <div className="profile-v2-card">

            {/* Password Change */}
            <div className="security-section-block">
              <div className="security-block-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div>
                  <h3 className="security-block-title">Change Password</h3>
                  <p className="security-block-desc">Use a strong password with at least 8 characters</p>
                </div>
              </div>
              <form action={passwordAction} className="security-password-form">
                {passwordState?.message && (
                  <div className={`auth-alert ${passwordState.success ? 'auth-alert-success' : 'auth-alert-error'}`} style={{ gridColumn: '1 / -1' }}>
                    {passwordState.message}
                  </div>
                )}
                <div className="auth-group">
                  <label htmlFor="password">New Password</label>
                  <input id="password" name="password" type="password" className="profile-input" placeholder="At least 8 characters" required />
                </div>
                <div className="auth-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" className="profile-input" placeholder="Confirm your password" required />
                </div>
                <div className="profile-form-actions">
                  <button type="button" className="btn-profile-cancel" onClick={() => setActiveTab('orders')}>Cancel</button>
                  <button type="submit" className="btn-profile-save" disabled={isPasswordPending}>
                    {isPasswordPending ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Divider */}
            <div className="security-divider" />

            {/* 2FA */}
            <div className="security-section-block">
              <div className="security-block-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div>
                  <h3 className="security-block-title">Two-Factor Authentication</h3>
                  <p className="security-block-desc">Add an extra layer of security to your account</p>
                </div>
              </div>
              <div className="security-toggles">
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Authenticator App</span>
                    <span className="security-toggle-hint">Use an app like Google Authenticator</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" disabled />
                    <span className="security-switch-track" />
                  </label>
                </div>
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">SMS Verification</span>
                    <span className="security-toggle-hint">Receive a code via text message</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" disabled />
                    <span className="security-switch-track" />
                  </label>
                </div>
              </div>
              <p className="security-coming-soon">Coming soon — 2FA setup will be available in a future update.</p>
            </div>

            {/* Divider */}
            <div className="security-divider" />

            {/* Email Notifications */}
            <div className="security-section-block">
              <div className="security-block-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <div>
                  <h3 className="security-block-title">Email Notifications</h3>
                  <p className="security-block-desc">Choose what updates you receive by email</p>
                </div>
              </div>
              <div className="security-toggles">
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Event Reminders</span>
                    <span className="security-toggle-hint">Get notified before events you've registered for</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="security-switch-track" />
                  </label>
                </div>
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">New Events</span>
                    <span className="security-toggle-hint">Be the first to know about upcoming shows</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="security-switch-track" />
                  </label>
                </div>
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Vendor Announcements</span>
                    <span className="security-toggle-hint">Updates from vendors you follow</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" />
                    <span className="security-switch-track" />
                  </label>
                </div>
                <div className="security-toggle-row">
                  <div className="security-toggle-info">
                    <span className="security-toggle-label">Promotional Offers</span>
                    <span className="security-toggle-hint">Deals, discounts and special offers</span>
                  </div>
                  <label className="security-switch">
                    <input type="checkbox" />
                    <span className="security-switch-track" />
                  </label>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="security-divider" />

            {/* Danger Zone */}
            <div className="security-section-block">
              <div className="security-block-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <h3 className="security-block-title">Account Actions</h3>
                  <p className="security-block-desc">Manage your session and account</p>
                </div>
              </div>
              <div className="security-actions-row">
                <form action={signOut}>
                  <button type="submit" className="btn-profile-cancel">Logout</button>
                </form>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
