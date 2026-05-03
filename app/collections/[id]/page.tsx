import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCollectionById } from '@/app/actions/collections';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const collection = await getCollectionById(id);

    if (!collection) {
      return {
        title: 'Collection',
        description: 'Pokemon card collection',
      };
    }

    const ogImage = collection.image_urls?.[0]
      ? { url: collection.image_urls[0], alt: collection.title }
      : undefined;

    return {
      title: `${collection.title} | Collector's Paradise`,
      description: collection.description?.slice(0, 155) || 'View this Pokemon card collection',
      openGraph: {
        title: `${collection.title} | Collector's Paradise`,
        description: collection.description?.slice(0, 155) || 'View this Pokemon card collection',
        ...(ogImage && { images: [ogImage] }),
      },
    };
  } catch {
    return {
      title: 'Collection',
      description: 'Pokemon card collection',
    };
  }
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const collection = await getCollectionById(id);

  if (!collection) notFound();

  const priceLabel =
    collection.price_min === collection.price_max
      ? `$${collection.price_min.toFixed(0)}`
      : `$${collection.price_min.toFixed(0)} – $${collection.price_max.toFixed(0)}`;

  const dateLabel = new Date(collection.created_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <main>
      <Navbar />

      <section className="collection-detail-section">
        <div className="container">
          <Link href="/collections" className="collection-detail-back">← Back to Collections</Link>

          <div className="collection-detail-grid">
            {/* Images */}
            <div className="collection-detail-images">
              {collection.image_urls.length > 0 ? (
                <>
                  <div className="collection-detail-primary-image">
                    <Image
                      src={collection.image_urls[0]}
                      alt={collection.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  </div>
                  {collection.image_urls.length > 1 && (
                    <div className="collection-detail-thumbnails">
                      {collection.image_urls.slice(1).map((url, i) => (
                        <div key={i} className="collection-detail-thumb">
                          <Image src={url} alt={`${collection.title} ${i + 2}`} fill style={{ objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="collection-detail-no-image" />
              )}
            </div>

            {/* Info */}
            <div className="collection-detail-info">
              {/* Vendor */}
              {collection.vendor && (
                <div className="collection-detail-vendor">
                  {collection.vendor.logo_url && (
                    <div className="collection-detail-vendor-logo">
                      <Image src={collection.vendor.logo_url} alt={collection.vendor.business_name} fill style={{ objectFit: 'contain' }} />
                    </div>
                  )}
                  <span className="collection-detail-vendor-name">{collection.vendor.business_name}</span>
                </div>
              )}

              <h1 className="collection-detail-title">{collection.title}</h1>

              <div className="collection-detail-price">{priceLabel}</div>

              <div className="collection-detail-categories">
                {collection.categories.map(cat => (
                  <span key={cat} className="category-pill">{cat}</span>
                ))}
              </div>

              <p className="collection-detail-description">{collection.description}</p>

              <p className="collection-detail-date">Posted {dateLabel}</p>

              <Link href="/events" className="btn-highlight collection-detail-cta">
                Book a Ticket to Browse
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
