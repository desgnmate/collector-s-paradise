import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const origin = process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' : SITE_URL;
  const destination = new URL('/vendors/returning', origin);
  const reference = crypto.randomUUID();
  try {
    if (code) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(destination);
      console.warn('vendor_auth_callback', { reference, code: error.code, status: error.status });
    }
    else console.warn('vendor_auth_callback', { reference, code: 'missing_code' });
  } catch { console.error('vendor_auth_callback', { reference, code: 'connection_failure' }); }
  destination.searchParams.set('error', 'sign_in');
  return NextResponse.redirect(destination);
}
