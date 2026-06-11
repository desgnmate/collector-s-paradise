import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'experimental-edge';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Fast path: public pages don't need Supabase auth.
  // The previous version called getUser() on every request, which
  // added a network round-trip (and cold-start latency) to every
  // navigation. Auth is only required for /admin and /admin-login.
  const needsAuth = pathname === '/admin-login' || pathname.startsWith('/admin');

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (needsAuth) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Admin login page — allow access without auth check
    if (pathname === '/admin-login') {
      if (user) {
        const { data: adminRecord } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminRecord) {
          const url = request.nextUrl.clone();
          url.pathname = '/admin';
          return NextResponse.redirect(url);
        }
      }
      return supabaseResponse;
    }

    // 2. Protect /admin - redirect to /admin-login if unauthenticated or not admin
    if (pathname.startsWith('/admin')) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin-login';
        return NextResponse.redirect(url);
      }

      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminRecord) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin-login';
        return NextResponse.redirect(url);
      }
    }
  }

  // Security headers — applied to every response (cheap, in-memory)
  const securityHeaders = new Map<string, string>([
    ['X-Frame-Options', 'DENY'],
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ]);

  securityHeaders.forEach((value, key) => {
    supabaseResponse.headers.set(key, value);
  });

  if (process.env.NODE_ENV === 'production') {
    supabaseResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  supabaseResponse.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ttf|woff|woff2)$).*)',
  ],
};
