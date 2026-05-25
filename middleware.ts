import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
const COOKIE  = 'shehri_admin';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Admin Auth & Secret Gatekeeper
  if (pathname.startsWith('/admin')) {
    // Secret Keyboard Shortcut Gatekeeper
    if (!req.cookies.has('admin_unlocked')) {
      return NextResponse.redirect(new URL('/pre-launch', req.url));
    }

    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    const token = req.cookies.get(COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.delete(COOKIE);
      return res;
    }
  }

  // 2. Global Pre-launch Logic
  if (pathname !== '/pre-launch') {
    try {
      // Check Supabase directly using REST API (Edge compatible)
      // We use the service role key if available to bypass RLS read restrictions
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_settings?id=eq.is_launched&select=value`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        // Do not cache this edge request so the Launch toggle works instantly
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        const isLaunched = data[0]?.value === 'true';
        
        console.log('[Middleware] Supabase store_settings is_launched:', isLaunched, 'Raw data:', data);

        if (!isLaunched) {
          return NextResponse.redirect(new URL('/pre-launch', req.url));
        }
      } else {
        // If table doesn't exist yet, default to pre-launch mode
        return NextResponse.redirect(new URL('/pre-launch', req.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/pre-launch', req.url));
    }
  }

  return NextResponse.next();



}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - any file with an image extension (.png, .jpg, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
