'use client';

import React, { useState, useActionState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  createCollection,
  updateCollection,
} from '@/app/actions/collections';
import {
  COLLECTION_CATEGORIES,
  type Collection,
  type CollectionActionState,
} from '@/app/actions/collections-types';

type Props = {
  initialData?: Collection;
  vendorId: string;
};

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function CollectionForm({ initialData, vendorId }: Props) {
  const isEdit = !!initialData;

  const [uploadedUrls, setUploadedUrls] = useState<string[]>(initialData?.image_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const action = isEdit
    ? updateCollection.bind(null, initialData!.id)
    : createCollection;

  const [state, formAction, isPending] = useActionState<CollectionActionState, FormData>(
    action,
    { message: '' }
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setUploadError(null);

    if (uploadedUrls.length + files.length > MAX_IMAGES) {
      setUploadError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}" exceeds the 5MB limit.`);
        return;
      }
    }

    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const newUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('collection_images')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) {
        setUploadError(`Upload failed: ${error.message}`);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('collection_images')
        .getPublicUrl(path);

      newUrls.push(publicUrl);
    }

    setUploadedUrls(prev => [...prev, ...newUrls]);
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (url: string) => {
    setUploadedUrls(prev => prev.filter(u => u !== url));
  };

  return (
    <form action={formAction} className="collection-form">
      {state?.message && !state.success && (
        <div className="auth-alert auth-alert-error">{state.message}</div>
      )}
      {state?.success && (
        <div className="auth-alert auth-alert-success">{state.message}</div>
      )}

      {/* Hidden image URL fields */}
      {uploadedUrls.map(url => (
        <input key={url} type="hidden" name="image_urls" value={url} />
      ))}

      {/* Title */}
      <div className="auth-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title" name="title" type="text"
          className="profile-input"
          defaultValue={initialData?.title ?? ''}
          placeholder="e.g. Rare Charizard Collection"
          required
        />
        {state?.errors?.title && <span className="collection-form-error">{state.errors.title[0]}</span>}
      </div>

      {/* Description */}
      <div className="auth-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description" name="description"
          className="profile-input collection-form-textarea"
          defaultValue={initialData?.description ?? ''}
          placeholder="Describe your collection — condition, highlights, what's included..."
          required
          rows={4}
        />
        {state?.errors?.description && <span className="collection-form-error">{state.errors.description[0]}</span>}
      </div>

      {/* Price Range */}
      <div className="collection-form-row">
        <div className="auth-group">
          <label htmlFor="price_min">Min Price ($) *</label>
          <input
            id="price_min" name="price_min" type="number"
            className="profile-input"
            defaultValue={initialData?.price_min ?? ''}
            placeholder="0"
            min="0" step="0.01" required
          />
          {state?.errors?.price_min && <span className="collection-form-error">{state.errors.price_min[0]}</span>}
        </div>
        <div className="auth-group">
          <label htmlFor="price_max">Max Price ($) *</label>
          <input
            id="price_max" name="price_max" type="number"
            className="profile-input"
            defaultValue={initialData?.price_max ?? ''}
            placeholder="500"
            min="0" step="0.01" required
          />
          {state?.errors?.price_max && <span className="collection-form-error">{state.errors.price_max[0]}</span>}
        </div>
      </div>

      {/* Categories */}
      <div className="auth-group">
        <label>Categories * <span style={{ fontWeight: 400, color: '#888' }}>(select all that apply)</span></label>
        <div className="collection-form-categories">
          {COLLECTION_CATEGORIES.map(cat => (
            <label key={cat} className="collection-form-category-label">
              <input
                type="checkbox" name="categories" value={cat}
                defaultChecked={initialData?.categories.includes(cat)}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
        {state?.errors?.categories && <span className="collection-form-error">{state.errors.categories[0]}</span>}
      </div>

      {/* Images */}
      <div className="auth-group">
        <label>Images * <span style={{ fontWeight: 400, color: '#888' }}>(1–6, max 5MB each)</span></label>

        {uploadedUrls.length > 0 && (
          <div className="collection-form-image-previews">
            {uploadedUrls.map(url => (
              <div key={url} className="collection-form-image-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Preview" />
                <button type="button" className="collection-form-image-remove" onClick={() => removeImage(url)}>×</button>
              </div>
            ))}
          </div>
        )}

        {uploadedUrls.length < MAX_IMAGES && (
          <label className="collection-form-upload-btn">
            {uploading ? 'Uploading...' : '+ Add Images'}
            <input
              type="file" accept="image/*" multiple
              onChange={handleImageChange}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        )}

        {uploadError && <span className="collection-form-error">{uploadError}</span>}
        {state?.errors?.image_urls && <span className="collection-form-error">{state.errors.image_urls[0]}</span>}
      </div>

      {/* Actions */}
      <div className="profile-form-actions">
        <a href="/" className="btn-profile-cancel">Cancel</a>
        <button type="submit" className="btn-profile-save" disabled={isPending || uploading}>
          {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Post Collection'}
        </button>
      </div>
    </form>
  );
}
