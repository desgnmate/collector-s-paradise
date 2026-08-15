import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const EVENT_COVER_FALLBACK = '/images/event-experience.jpg';
const IMAGE_CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

type CoverValue = string | null;

const parseDataImage = (value: string) => {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/i);
  if (!match) return null;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.byteLength === 0 || bytes.byteLength > 8 * 1024 * 1024) return null;

  return {
    contentType: match[1].toLowerCase(),
    bytes: Uint8Array.from(bytes),
  };
};

const fallbackResponse = async (request: Request) => {
  try {
    const bytes = await readFile(join(process.cwd(), 'public/images/event-experience.jpg'));
    return new Response(bytes, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'inline',
        'Cache-Control': IMAGE_CACHE_CONTROL,
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch {
    return NextResponse.redirect(new URL(EVENT_COVER_FALLBACK, request.url), {
      status: 307,
      headers: { 'Cache-Control': IMAGE_CACHE_CONTROL },
    });
  }
};

/**
 * Read the cover with the privileged client when available. The anon fallback
 * is intentionally limited to this image route: it never returns the database
 * value, and only serves an already-public image (or a safe fallback). This
 * keeps legacy data-URI covers working while the event cover migration is
 * rolled out; once the RLS hardening is applied, the anon query simply fails
 * closed until the service-role key is configured.
 */
async function getCoverValue(id: string): Promise<CoverValue> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('events')
      .select('cover_image_url')
      .eq('id', id)
      .maybeSingle();

    if (!error && typeof data?.cover_image_url === 'string' && data.cover_image_url.length > 0) {
      return data.cover_image_url;
    }
  } catch {
    // Local previews and older deployments may not have a service-role key.
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  try {
    const publicClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await publicClient
      .from('events')
      .select('cover_image_url')
      .eq('id', id)
      .maybeSingle();

    if (!error && typeof data?.cover_image_url === 'string' && data.cover_image_url.length > 0) {
      return data.cover_image_url;
    }
  } catch {
    // Invalid/missing public credentials use the local fallback below.
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return fallbackResponse(_request);
  }

  const coverValue = await getCoverValue(id);
  if (!coverValue) return fallbackResponse(_request);

  if (!coverValue.startsWith('data:')) {
    try {
      const imageUrl = new URL(coverValue);
      if (imageUrl.protocol === 'https:') return NextResponse.redirect(imageUrl);
    } catch {
      // Invalid legacy URLs use the fallback below.
    }
    return fallbackResponse(_request);
  }

  const image = parseDataImage(coverValue);
  if (!image) {
    return fallbackResponse(_request);
  }

  return new Response(image.bytes, {
    headers: {
      'Content-Type': image.contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': IMAGE_CACHE_CONTROL,
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'index, follow',
    },
  });
}
