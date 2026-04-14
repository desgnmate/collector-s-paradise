import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <main>
      <Navbar />
      <section className="profile-section">
        <div className="container">
          <div className="auth-header" style={{ textAlign: 'left', marginBottom: '3rem' }}>
            <h1 className="auth-title">My Profile</h1>
            <p className="auth-subtitle">Manage your personal information and security settings</p>
          </div>

          <ProfileClient user={user} profile={profile} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
