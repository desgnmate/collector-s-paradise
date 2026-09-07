import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/site';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const origin = process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' : SITE_URL;
  const destination = new URL('/vendors/returning', origin);
  try {
    if (code) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(destination);
    }
  } catch { /* Show a safe, recoverable sign-in error without exposing tokens. */ }
  destination.searchParams.set('error', 'sign_in');
  return NextResponse.redirect(destination);
}
