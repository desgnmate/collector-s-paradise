import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CollectionCard from '@/components/CollectionCard';
import { getCollections, getVendorCollections, checkVendorStatus } from '@/app/actions/collections';
import { deleteCollection } from '@/app/actions/collections';

export const metadata: Metadata = {
  title: 'Collections | Collector\'s Paradise',
  description: 'Browse Pokémon card collections posted by our approved vendors. Discover rare singles, sealed products, graded cards and more.',
};

export default async function CollectionsPage() {
  const [collections, vendorStatus, myCollections] = await Promise.all([
    getCollections(),
    checkVendorStatus(),
    getVendorCollections(),
  ]);

  return (
    <main className="collections-page-wrapper">
      <Navbar />

      {/* Header */}
      <section className="collections-page-header">
        <div className="container">
          <div className="collections-header-inner">
            <div>
              <span className="eyebrow-badge" style={{ marginBottom: '1.5rem', display: 'inline-block' }}>COMMUNITY</span>
              <h1 className="collections-hero-title">COLLECTIONS</h1>
              <p className="collections-hero-desc">
                Browse Pokémon card collections from our approved vendors.
                Discover rare singles, sealed products, graded slabs and more.
              </p>
            </div>
            {vendorStatus.isVendor && (
              <div className="collections-post-btn-wrapper">
                <Link href="/collections/new" className="collections-post-btn">
                  + Post a Collection
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Vendor Dashboard */}
      {vendorStatus.isVendor && (
        <section className="collections-vendor-dashboard">
          <div className="container">
            <div className="vendor-dashboard-header">
              <h2 className="vendor-dashboard-title">My Collections</h2>
              <span className="vendor-dashboard-count">{myCollections.length} listing{myCollections.length !== 1 ? 's' : ''}</span>
            </div>

            {myCollections.length === 0 ? (
              <p className="vendor-dashboard-empty">You haven&apos;t posted any collections yet. <Link href="/collections/new" className="vendor-dashboard-link">Post your first one →</Link></p>
            ) : (
              <div className="vendor-dashboard-list">
                {myCollections.map(col => (
                  <div key={col.id} className="vendor-dashboard-item">
                    <span className="vendor-dashboard-item-title">{col.title}</span>
                    <div className="vendor-dashboard-item-actions">
                      <Link href={`/collections/${col.id}/edit`} className="vendor-dashboard-edit">Edit</Link>
                      <form action={async () => { "use server"; await deleteCollection(col.id); }} style={{ display: 'inline' }}>
                        <button type="submit" className="vendor-dashboard-delete">Delete</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gallery */}
      <section className="collections-gallery-section">
        <div className="container">
          {collections.length === 0 ? (
            <div className="collections-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <h3>No Collections Yet</h3>
              <p>Be the first to post a collection. Approved vendors can share their Pokémon card listings with the community.</p>
            </div>
          ) : (
            <div className="collections-grid">
              {collections.map(col => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
