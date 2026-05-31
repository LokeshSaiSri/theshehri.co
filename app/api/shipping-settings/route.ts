import { NextResponse } from 'next/server';
import { getShippingSettings } from '@/lib/shipping-settings';

export async function GET() {
  const settings = await getShippingSettings();
  return NextResponse.json(settings);
}
