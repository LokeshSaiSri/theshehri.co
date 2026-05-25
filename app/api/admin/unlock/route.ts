import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  // Set an HTTP-only cookie that acts as the secret key to even view the admin panel
  res.cookies.set('admin_unlocked', 'true', { path: '/', httpOnly: true });
  return res;
}
