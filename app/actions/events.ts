'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
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
});

// ============================================
// Public Actions
// ============================================

/** Fetch all upcoming/active events (publicly accessible) */
export async function getEvents(): Promise<Event[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_date, start_time, end_time, venue, cover_image_url, status')
    .in('status', ['upcoming', 'active'])
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data as unknown as Event[];
}

/** Fetch a single event by ID */
export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return data as Event;
}

/** Fetch events for a specific month (for the calendar) */
export async function getEventsByMonth(year: number, month: number): Promise<Event[]> {
  const supabase = await createSupabaseServerClient();

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

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
}

// ============================================
// Admin Actions
// ============================================

type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

/** Create a new event (admin only) */
export async function createEvent(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'Unauthorized' };
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
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.from('events').insert(validatedFields.data);

  if (error) {
    console.error('Error creating event:', error);
    return { message: 'Failed to create event. Please try again.' };
  }

  revalidatePath('/events');
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'Unauthorized' };
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
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase
    .from('events')
    .update(validatedFields.data)
    .eq('id', eventId);

  if (error) {
    console.error('Error updating event:', error);
    return { message: 'Failed to update event. Please try again.' };
  }

  revalidatePath('/events');
  revalidatePath('/admin/events');
  return { message: 'Event updated successfully!', success: true };
}

/** Delete an event (admin only) */
export async function deleteEvent(eventId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'Unauthorized' };
  }

  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    return { message: 'Failed to delete event.' };
  }

  revalidatePath('/events');
  revalidatePath('/admin/events');
  return { message: 'Event deleted successfully!', success: true };
}

/** Fetch all events for admin (including past/cancelled) */
export async function getAdminEvents(): Promise<Event[]> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
