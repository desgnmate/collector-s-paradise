import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

const parseDataImage = (value: string) => {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  return {
    contentType: match[1],
    bytes: Uint8Array.from(Buffer.from(match[2], 'base64')),
  };
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createPublicEventsClient();

  const { data, error } = await supabase
    .from('events')
    .select('cover_image_url')
    .eq('id', id)
    .maybeSingle();

  if (error || !data?.cover_image_url) {
    return NextResponse.redirect(new URL('/images/event-experience.png', _request.url));
  }

  if (!data.cover_image_url.startsWith('data:')) {
    return NextResponse.redirect(data.cover_image_url);
  }

  const image = parseDataImage(data.cover_image_url);
  if (!image) {
    return NextResponse.redirect(new URL('/images/event-experience.png', _request.url));
  }

  return new Response(image.bytes, {
    headers: {
      'Content-Type': image.contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'index, follow',
    },
  });
}
