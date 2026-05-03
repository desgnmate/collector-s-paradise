import React from 'react';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CollectionForm from '@/components/CollectionForm';
import { getCollectionById, checkVendorStatus } from '@/app/actions/collections';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ id: string }> };

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [collection, { isVendor, vendorId }] = await Promise.all([
    getCollectionById(id),
    checkVendorStatus(),
  ]);

  if (!collection) notFound();
  if (!isVendor || collection.user_id !== user.id) redirect('/collections');

  return (
    <main>
      <Navbar />
      <section className="collections-form-section">
        <div className="container">
          <Link href={`/collections/${id}`} className="collection-detail-back">← Back to Collection</Link>

          <div className="collections-form-header">
            <span className="eyebrow-badge">EDIT</span>
            <h1 className="section-title">Edit Collection</h1>
            <p className="section-subtitle">Update your collection details.</p>
          </div>

          <CollectionForm initialData={collection} vendorId={vendorId!} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
