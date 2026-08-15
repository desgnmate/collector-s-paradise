import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const FALLBACK = '/images/logo.png';
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

function parseDataImage(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/i);
  if (!match) return null;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.byteLength === 0 || bytes.byteLength > 8 * 1024 * 1024) return null;
  return { contentType: match[1].toLowerCase(), bytes };
}

const fallbackResponse = async (request: Request) => {
  try {
    const bytes = await readFile(join(process.cwd(), 'public/images/logo.png'));
    return new Response(bytes, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline',
        'Cache-Control': CACHE_CONTROL,
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    // Keep a URL fallback if the deployment asset is unavailable.
    return NextResponse.redirect(new URL(FALLBACK, request.url), { status: 307 });
  }
};

async function getLogoValue(id: string): Promise<string | null> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('vendors')
      .select('logo_url')
      .eq('id', id)
      .maybeSingle();

    if (!error && typeof data?.logo_url === 'string' && data.logo_url.length > 0) {
      return data.logo_url;
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
      .from('vendors')
      .select('logo_url')
      .eq('id', id)
      .maybeSingle();

    if (!error && typeof data?.logo_url === 'string' && data.logo_url.length > 0) {
      return data.logo_url;
    }
  } catch {
    // Invalid/missing public credentials use the fallback below.
  }

  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return fallbackResponse(request);
  }

  const logoValue = await getLogoValue(id);
  if (!logoValue) return fallbackResponse(request);

  if (!logoValue.startsWith('data:')) {
    try {
      const imageUrl = new URL(logoValue);
      if (imageUrl.protocol === 'https:') return NextResponse.redirect(imageUrl);
    } catch {
      // Invalid legacy URLs use the fallback below.
    }
    return fallbackResponse(request);
  }

  const image = parseDataImage(logoValue);
  if (!image) return fallbackResponse(request);

  return new Response(image.bytes, {
    headers: {
      'Content-Type': image.contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': CACHE_CONTROL,
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}
