import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CollectionForm from '@/components/CollectionForm';
import { checkVendorStatus } from '@/app/actions/collections';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NewCollectionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { isVendor, vendorId } = await checkVendorStatus();

  return (
    <main>
      <Navbar />
      <section className="collections-form-section">
        <div className="container">
          <Link href="/collections" className="collection-detail-back">← Back to Collections</Link>

          <div className="collections-form-header">
            <span className="eyebrow-badge">VENDOR</span>
            <h1 className="section-title">Post a Collection</h1>
            <p className="section-subtitle">Share your Pokémon card collection with the community.</p>
          </div>

          {!isVendor ? (
            <div className="collections-access-denied">
              <h3>Approved Vendors Only</h3>
              <p>Only approved vendor accounts can post collections. Apply to become a vendor to get started.</p>
              <Link href="/vendors/apply" className="btn-highlight">Apply as Vendor</Link>
            </div>
          ) : (
            <CollectionForm vendorId={vendorId!} />
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
