import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'My Profile',
  description: "Manage your Collector's Paradise profile, view your tickets, and update your account settings.",
  robots: { index: false, follow: false },
};
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

  // Merge user_metadata as fallback for profile fields not yet saved to the DB
  const mergedProfile = {
    ...profile,
    full_name: profile?.full_name || user.user_metadata?.full_name || null,
    shop_name: profile?.shop_name || null,
  };

  // Fetch events the user has registered for
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('event_id, created_at, events(id, title, description, cover_image_url, event_date, start_time, end_time, venue, venue_address, status, ticket_price)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const registeredEvents = registrations
    ?.map((r: any) => ({ ...r.events, registered_at: r.created_at }))
    .filter(Boolean) ?? [];

  return (
    <main>
      <Navbar />
      <section className="profile-v2-section">
        <div className="container">
          <ProfileClient user={user} profile={mergedProfile} registeredEvents={registeredEvents} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
