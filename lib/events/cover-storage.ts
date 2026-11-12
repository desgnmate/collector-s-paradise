import type { SupabaseClient } from '@supabase/supabase-js';

export const EVENT_COVER_BUCKET = 'event_covers';
export const EVENT_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Call only with the privileged client after verifying admin membership. */
export async function uploadEventCover(client: SupabaseClient, file: File, eventId = 'pending') {
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type];
  if (!extension || file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('Use a JPG, PNG, WebP or GIF cover no larger than 5MB.');
  }
  const objectPath = `event-covers/${eventId}-${crypto.randomUUID()}.${extension}`;
  const bytes = await file.arrayBuffer();
  const upload = () => client.storage.from(EVENT_COVER_BUCKET).upload(objectPath, bytes, {
    contentType: file.type, cacheControl: '3600', upsert: false,
  });
  let result = await upload();
  if (result.error?.message.toLowerCase().includes('bucket not found')) {
    const created = await client.storage.createBucket(EVENT_COVER_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: EVENT_COVER_TYPES,
    });
    // A concurrent admin upload may have created it first. Check existence
    // before retrying, without changing the permissions of an existing bucket.
    if (created.error) {
      const existing = await client.storage.getBucket(EVENT_COVER_BUCKET);
      if (existing.error) throw created.error;
    }
    result = await upload();
  }
  if (result.error) throw result.error;
  return client.storage.from(EVENT_COVER_BUCKET).getPublicUrl(objectPath).data.publicUrl;
}
