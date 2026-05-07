import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Collection } from '@/app/actions/collections-types';

type Props = {
  collection: Collection;
};

export default function CollectionCard({ collection }: Props) {
  const primaryImage = collection.image_urls[0];
  const priceLabel =
    collection.price_min === collection.price_max
      ? `$${collection.price_min.toFixed(0)}`
      : `$${collection.price_min.toFixed(0)} – $${collection.price_max.toFixed(0)}`;

  const dateLabel = new Date(collection.created_at).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link href="/" className="collection-card">
      {/* Image */}
      <div className="collection-card-image">
        {primaryImage ? (
          <Image src={primaryImage} alt={collection.title} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div className="collection-card-image-placeholder" />
        )}
        <span className="collection-card-price">{priceLabel}</span>
      </div>

      {/* Body */}
      <div className="collection-card-body">
        <h3 className="collection-card-title">{collection.title}</h3>

        {collection.vendor && (
          <p className="collection-card-vendor">{collection.vendor.business_name}</p>
        )}

        <div className="collection-card-categories">
          {collection.categories.slice(0, 3).map(cat => (
            <span key={cat} className="category-pill">{cat}</span>
          ))}
          {collection.categories.length > 3 && (
            <span className="category-pill category-pill--more">+{collection.categories.length - 3}</span>
          )}
        </div>

        <p className="collection-card-date">{dateLabel}</p>
      </div>
    </Link>
  );
}
