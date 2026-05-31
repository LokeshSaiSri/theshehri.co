import { NextResponse } from 'next/server';

const UNLOCK_COOKIE = 'admin_unlocked';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(UNLOCK_COOKIE, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  return res;
}
