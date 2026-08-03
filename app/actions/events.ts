'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { z } from 'zod';

// ============================================
// Types
// ============================================
export type Event = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string | null;
  venue_address: string | null;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  capacity: number;
  tickets_sold: number;
  ticket_price: number;
  cover_image_url: string | null;
  booking_link: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// Validation Schemas
// ============================================
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  event_date: z.string().min(1, 'Event date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  venue: z.string().optional(),
  venue_address: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  ticket_price: z.coerce.number().min(0, 'Price cannot be negative'),
  booking_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

// ============================================
// Public Actions
// ============================================

const createPublicEventsClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

// Legacy records may contain multi-megabyte base64 images. Sending those
// inside an RSC payload makes transitions slow and can exceed Next.js's
// data-cache limits, so expose those covers through a small image route.
const normalizePublicEventCover = (event: Event): Event => ({
  ...event,
  cover_image_url: event.cover_image_url?.startsWith('data:')
    ? `/api/events/${event.id}/cover`
    : event.cover_image_url,
});

const getCachedEvents = unstable_cache(
  async (): Promise<Event[]> => {
    const supabase = createPublicEventsClient();

    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, event_date, start_time, end_time, venue, venue_address, status, capacity, tickets_sold, ticket_price, cover_image_url, booking_link, created_at, updated_at')
      .in('status', ['upcoming', 'active', 'completed'])
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return (data as Event[]).map(normalizePublicEventCover);
  },
  ['public-events-v2'],
  { revalidate: 3600, tags: ['events'] }
);

const getCachedEventById = unstable_cache(
  async (id: string): Promise<Event | null> => {
    const supabase = createPublicEventsClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    return normalizePublicEventCover(data as Event);
  },
  ['public-event-v2'],
  { revalidate: 3600, tags: ['events'] }
);

const getCachedEventsByMonth = unstable_cache(
  async (year: number, month: number): Promise<Event[]> => {
    const supabase = createPublicEventsClient();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, start_time, end_time, status')
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events by month:', error);
      return [];
    }

    return data as unknown as Event[];
  },
  ['public-events-by-month'],
  { revalidate: 3600, tags: ['events'] }
);

/** Fetch all upcoming/active events (publicly accessible) */
export async function getEvents(): Promise<Event[]> {
  return getCachedEvents();
}

/** Fetch a single event by ID */
export async function getEventById(id: string): Promise<Event | null> {
  return getCachedEventById(id);
}

/** Fetch events for a specific month (for the calendar) */
export async function getEventsByMonth(year: number, month: number): Promise<Event[]> {
  return getCachedEventsByMonth(year, month);
}

// ============================================
// Admin Actions
// ============================================

type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' as const };

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRecord) return { error: 'not_admin' as const };
  return { user, adminRecord };
}

/** Upload cover image to Supabase Storage and return the public URL.
 * Falls back to base64 data URI if the storage bucket isn't configured.
 * NOTE: Requires an 'event_covers' bucket in Supabase Storage (public).
 */
async function uploadCoverImage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  file: File,
  eventId?: string
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `event-covers/${eventId || 'pending'}-${Date.now()}.${fileExt}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('event_covers')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Event cover upload error:', uploadError);
    // Fallback: If storage bucket isn't configured or has RLS issues,
    // save the image as a base64 string to prevent blocking event creation.
    if (
      uploadError.message.includes('security policy') ||
      uploadError.message.includes('not found') ||
      uploadError.message.includes('bucket')
    ) {
      console.warn('Storage upload failed for event cover, falling back to Base64 encoding.');
      const base64String = Buffer.from(arrayBuffer).toString('base64');
      return `data:${file.type};base64,${base64String}`;
    }
    return null; // Non-recoverable upload error
  }

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event_covers/${filePath}`;
}

/** Create a new event (admin only) */
export async function createEvent(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);

  if ('error' in auth) {
    return { message: auth.error === 'unauthorized' ? 'Unauthorized' : 'Admin access required' };
  }

  const coverImage = formData.get('cover_image') as File | null;

  // Validate cover image if provided
  if (coverImage && coverImage.size > 0) {
    if (coverImage.size > 5 * 1024 * 1024) {
      return { message: 'Cover image file size must be less than 5MB.' };
    }
    if (!coverImage.type.startsWith('image/')) {
      return { message: 'Cover image must be an image file.' };
    }
  }

  const validatedFields = createEventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    event_date: formData.get('event_date'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    venue: formData.get('venue'),
    venue_address: formData.get('venue_address'),
    capacity: formData.get('capacity'),
    ticket_price: formData.get('ticket_price'),
    booking_link: formData.get('booking_link'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let coverImageUrl: string | null = null;

  if (coverImage && coverImage.size > 0) {
    coverImageUrl = await uploadCoverImage(supabase, coverImage);
    if (coverImageUrl === null) {
      return { message: 'Failed to upload cover image. Please try again.' };
    }
  }

  const { error } = await supabase.from('events').insert({
    ...validatedFields.data,
    cover_image_url: coverImageUrl,
  });

  if (error) {
    console.error('Error creating event:', error);
    return { message: 'Failed to create event. Please try again.' };
  }

  revalidatePath('/events');
  revalidatePath('/vendors/apply');
  revalidateTag('events', 'max');
  revalidatePath('/admin/events');
  return { message: 'Event created successfully!', success: true };
}

/** Update an existing event (admin only) */
export async function updateEvent(
  eventId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);

  if ('error' in auth) {
    return { message: auth.error === 'unauthorized' ? 'Unauthorized' : 'Admin access required' };
  }

  const coverImage = formData.get('cover_image') as File | null;

  // Validate cover image if provided
  if (coverImage && coverImage.size > 0) {
    if (coverImage.size > 5 * 1024 * 1024) {
      return { message: 'Cover image file size must be less than 5MB.' };
    }
    if (!coverImage.type.startsWith('image/')) {
      return { message: 'Cover image must be an image file.' };
    }
  }

  const validatedFields = createEventSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    event_date: formData.get('event_date'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    venue: formData.get('venue'),
    venue_address: formData.get('venue_address'),
    capacity: formData.get('capacity'),
    ticket_price: formData.get('ticket_price'),
    booking_link: formData.get('booking_link'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let coverImageUrl: string | undefined;

  if (coverImage && coverImage.size > 0) {
    // Fetch current event to get old cover image URL for potential cleanup
    const { data: currentEvent } = await supabase
      .from('events')
      .select('cover_image_url')
      .eq('id', eventId)
      .maybeSingle();

    const uploadResult = await uploadCoverImage(supabase, coverImage, eventId);
    if (uploadResult === null) {
      return { message: 'Failed to upload cover image. Please try again.' };
    }
    coverImageUrl = uploadResult;

    // Attempt to delete old cover image from storage (best effort)
    if (currentEvent?.cover_image_url && !currentEvent.cover_image_url.startsWith('data:')) {
      try {
        const urlPath = currentEvent.cover_image_url.split('/storage/v1/object/public/event_covers/')[1];
        if (urlPath) {
          await supabase.storage.from('event_covers').remove([urlPath]);
        }
      } catch {
        // Best effort cleanup — ignore errors
      }
    }
  }

  const updateData: Record<string, unknown> = { ...validatedFields.data };
  if (coverImageUrl !== undefined) {
    updateData.cover_image_url = coverImageUrl;
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId);

  if (error) {
    console.error('Error updating event:', error);
    return { message: 'Failed to update event. Please try again.' };
  }

  revalidatePath('/events');
  revalidatePath('/vendors/apply');
  revalidateTag('events', 'max');
  revalidatePath('/admin/events');
  return { message: 'Event updated successfully!', success: true };
}

/** Delete an event (admin only) */
export async function deleteEvent(eventId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);

  if ('error' in auth) {
    return { message: auth.error === 'unauthorized' ? 'Unauthorized' : 'Admin access required' };
  }

  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    return { message: 'Failed to delete event.' };
  }

  revalidatePath('/events');
  revalidatePath('/vendors/apply');
  revalidateTag('events', 'max');
  revalidatePath('/admin/events');
  return { message: 'Event deleted successfully!', success: true };
}

/** Fetch all events for admin (including past/cancelled) */
export async function getAdminEvents(): Promise<Event[]> {
  const supabase = await createSupabaseServerClient();
  const auth = await requireAdmin(supabase);

  if ('error' in auth) return [];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching admin events:', error);
    return [];
  }

  return data as Event[];
}
