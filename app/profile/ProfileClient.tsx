'use client';

import React, { useActionState, useState } from 'react';
import { updateProfile, updatePassword, signOut } from '@/app/actions/auth';
import type { User } from '@supabase/supabase-js';

interface ProfileProps {
  user: User;
  profile: any;
}

export default function ProfileClient({ user, profile }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  const [profileState, profileAction, isProfilePending] = useActionState(updateProfile, {
    message: '',
  });

  const [passwordState, passwordAction, isPasswordPending] = useActionState(updatePassword, {
    message: '',
  });

  return (
    <div className="profile-layout">
      {/* Sidebar */}
      <aside className="profile-sidebar">
        <div className="profile-nav-card">
          <button 
            className={`profile-nav-item ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
          >
            <span style={{ fontSize: '1.2rem' }}>👤</span> Personal Info
          </button>
          <button 
            className={`profile-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔒</span> Security
          </button>
        </div>

        <div className="logout-btn-container">
          <form action={signOut}>
            <button type="submit" className="btn btn-logout" style={{ padding: '0.75rem' }}>
              LOGOUT
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="profile-content">
        {activeTab === 'info' && (
          <div className="profile-card" data-aos="fade-left">
            <div className="profile-card-header">
              <h2 className="profile-card-title">Personal Information</h2>
            </div>
            
            <form action={profileAction} className="auth-form">
              {profileState?.message && (
                <div className={`auth-alert ${profileState.success ? 'auth-alert-success' : 'auth-alert-error'}`}>
                  {profileState.message}
                </div>
              )}

              <div className="auth-group">
                <label>Email Address (Public)</label>
                <input
                  type="email"
                  className="auth-input"
                  value={user.email}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#888' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>Email cannot be changed.</p>
              </div>

              <div className="auth-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="auth-input"
                  defaultValue={profile?.full_name || ''}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="auth-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="auth-input"
                  defaultValue={profile?.phone || ''}
                  placeholder="+61 XXX XXX XXX"
                />
              </div>

              <button
                type="submit"
                className="btn btn-yellow"
                disabled={isProfilePending}
                style={{ width: 'fit-content', minWidth: '200px', marginTop: '1rem' }}
              >
                {isProfilePending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="profile-card" data-aos="fade-left">
            <div className="profile-card-header">
              <h2 className="profile-card-title">Password & Security</h2>
            </div>
            
            <form action={passwordAction} className="auth-form">
              {passwordState?.message && (
                <div className={`auth-alert ${passwordState.success ? 'auth-alert-success' : 'auth-alert-error'}`}>
                  {passwordState.message}
                </div>
              )}

              <div className="auth-group">
                <label htmlFor="password">New Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="auth-input"
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              <div className="auth-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="auth-input"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-yellow"
                disabled={isPasswordPending}
                style={{ width: 'fit-content', minWidth: '200px', marginTop: '1rem' }}
              >
                {isPasswordPending ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
