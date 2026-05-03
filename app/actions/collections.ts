'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { COLLECTION_CATEGORIES } from './collections-types';
import type { Collection, CollectionActionState } from './collections-types';

// ============================================
// Validation Schema
// ============================================
const collectionSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  price_min:   z.coerce.number().min(0, 'Minimum price must be 0 or more'),
  price_max:   z.coerce.number().min(0, 'Maximum price must be 0 or more'),
  categories:  z.array(z.string()).min(1, 'Select at least one category'),
  image_urls:  z.array(z.string().url()).min(1, 'At least one image is required').max(6, 'Maximum 6 images allowed'),
}).refine(d => d.price_min <= d.price_max, {
  message: 'Minimum price cannot exceed maximum price',
  path: ['price_min'],
});

// ============================================
// Internal Auth Helper
// ============================================
async function requireApprovedVendor(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthenticated' as const };

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .eq('application_status', 'approved')
    .maybeSingle();

  if (!vendor) return { error: 'not_vendor' as const };
  return { user, vendor };
}

// ============================================
// Public Read Actions
// ============================================

/** Fetch all collections with vendor info, newest first */
export async function getCollections(): Promise<Collection[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('collections')
    .select('*, vendor:vendors(business_name, logo_url)')
    .order('created_at', { ascending: false });

  if (error) { console.error('getCollections error:', error); return []; }
  return (data ?? []) as Collection[];
}

/** Fetch a single collection by ID */
export async function getCollectionById(id: string): Promise<Collection | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('collections')
    .select('*, vendor:vendors(business_name, logo_url)')
    .eq('id', id)
    .maybeSingle();

  if (error) { console.error('getCollectionById error:', error); return null; }
  return data as Collection | null;
}

/** Fetch only the authenticated vendor's collections */
export async function getVendorCollections(): Promise<Collection[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('collections')
    .select('*, vendor:vendors(business_name, logo_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) { console.error('getVendorCollections error:', error); return []; }
  return (data ?? []) as Collection[];
}

/** Check if the current user is an approved vendor */
export async function checkVendorStatus(): Promise<{ isVendor: boolean; vendorId?: string }> {
  const supabase = await createSupabaseServerClient();
  const result = await requireApprovedVendor(supabase);
  if ('error' in result) return { isVendor: false };
  return { isVendor: true, vendorId: result.vendor.id };
}

// ============================================
// Mutation Actions
// ============================================

/** Create a new collection (approved vendors only) */
export async function createCollection(
  prevState: CollectionActionState,
  formData: FormData
): Promise<CollectionActionState> {
  const supabase = await createSupabaseServerClient();
  const auth = await requireApprovedVendor(supabase);

  if ('error' in auth) {
    return auth.error === 'unauthenticated'
      ? { message: 'Please log in to post a collection.' }
      : { message: 'Only approved vendors can post collections.' };
  }

  const imageUrls = formData.getAll('image_urls') as string[];
  const categories = formData.getAll('categories') as string[];

  const parsed = collectionSchema.safeParse({
    title:       formData.get('title'),
    description: formData.get('description'),
    price_min:   formData.get('price_min'),
    price_max:   formData.get('price_max'),
    categories,
    image_urls:  imageUrls,
  });

  if (!parsed.success) {
    return { message: 'Please fix the errors below.', errors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from('collections').insert({
    vendor_id:   auth.vendor.id,
    user_id:     auth.user.id,
    title:       parsed.data.title,
    description: parsed.data.description,
    image_urls:  parsed.data.image_urls,
    price_min:   parsed.data.price_min,
    price_max:   parsed.data.price_max,
    categories:  parsed.data.categories,
  });

  if (error) {
    console.error('createCollection error:', error);
    return { message: 'Failed to create collection. Please try again.' };
  }

  revalidatePath('/collections');
  return { success: true, message: 'Collection posted successfully!' };
}

/** Update an existing collection (owner only) */
export async function updateCollection(
  id: string,
  prevState: CollectionActionState,
  formData: FormData
): Promise<CollectionActionState> {
  const supabase = await createSupabaseServerClient();
  const auth = await requireApprovedVendor(supabase);

  if ('error' in auth) {
    return { message: 'Unauthorized' };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('collections')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.user_id !== auth.user.id) {
    return { message: 'Unauthorized' };
  }

  const imageUrls = formData.getAll('image_urls') as string[];
  const categories = formData.getAll('categories') as string[];

  const parsed = collectionSchema.safeParse({
    title:       formData.get('title'),
    description: formData.get('description'),
    price_min:   formData.get('price_min'),
    price_max:   formData.get('price_max'),
    categories,
    image_urls:  imageUrls,
  });

  if (!parsed.success) {
    return { message: 'Please fix the errors below.', errors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase
    .from('collections')
    .update({
      title:       parsed.data.title,
      description: parsed.data.description,
      image_urls:  parsed.data.image_urls,
      price_min:   parsed.data.price_min,
      price_max:   parsed.data.price_max,
      categories:  parsed.data.categories,
    })
    .eq('id', id);

  if (error) {
    console.error('updateCollection error:', error);
    return { message: 'Failed to update collection. Please try again.' };
  }

  revalidatePath('/collections');
  revalidatePath(`/collections/${id}`);
  return { success: true, message: 'Collection updated successfully!' };
}

/** Delete a collection and its images (owner only) */
export async function deleteCollection(id: string): Promise<CollectionActionState> {
  const supabase = await createSupabaseServerClient();
  const auth = await requireApprovedVendor(supabase);

  if ('error' in auth) return { message: 'Unauthorized' };

  // Verify ownership and get image URLs for cleanup
  const { data: existing } = await supabase
    .from('collections')
    .select('user_id, image_urls')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.user_id !== auth.user.id) {
    return { message: 'Unauthorized' };
  }

  // Delete images from storage
  if (existing.image_urls?.length) {
    const paths = existing.image_urls.map((url: string) => {
      const parts = url.split('/collection_images/');
      return parts[1] ?? '';
    }).filter(Boolean);

    if (paths.length) {
      await supabase.storage.from('collection_images').remove(paths);
    }
  }

  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) {
    console.error('deleteCollection error:', error);
    return { message: 'Failed to delete collection.' };
  }

  revalidatePath('/collections');
  return { success: true, message: 'Collection deleted.' };
}
