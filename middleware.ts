import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
const COOKIE = 'shehri_admin';

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' };
const UNLOCK_COOKIE = 'admin_unlocked';

function redirectAwayFromAdmin(req: NextRequest) {
  const referer = req.headers.get('referer');
  const origin = req.nextUrl.origin;

  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.origin === origin && !refUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(refUrl);
      }
    } catch {
      // fall through to home
    }
  }

  return NextResponse.redirect(new URL('/', req.url));
}

async function verifyAdminSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Protect admin API routes (matcher includes /api/admin/*)
  if (pathname.startsWith('/api/admin')) {
    if (
      pathname === '/api/admin/unlock' ||
      pathname === '/api/admin/login' ||
      pathname === '/api/admin/logout'
    ) {
      return NextResponse.next();
    }

    if (!(await verifyAdminSession(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  // 2. Admin pages — hidden unless unlocked via Cmd+Shift+L (even during pre-launch)
  if (pathname.startsWith('/admin')) {
    if (!req.cookies.has(UNLOCK_COOKIE)) {
      return redirectAwayFromAdmin(req);
    }

    if (pathname === '/admin/login') {
      const res = NextResponse.next();
      Object.entries(NOINDEX).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (!(await verifyAdminSession(req))) {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.delete(COOKIE);
      Object.entries(NOINDEX).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const res = NextResponse.next();
    Object.entries(NOINDEX).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // 3. Global pre-launch logic (allow public /track)
  if (pathname !== '/pre-launch' && pathname !== '/track') {
    try {
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_settings?id=eq.is_launched&select=value`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: 'no-store',
        }
      );

      if (res.ok) {
        const data = await res.json();
        const isLaunched = data[0]?.value === 'true';

        if (!isLaunched) {
          return NextResponse.redirect(new URL('/pre-launch', req.url));
        }
      } else {
        return NextResponse.redirect(new URL('/pre-launch', req.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/pre-launch', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
