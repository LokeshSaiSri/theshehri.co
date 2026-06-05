import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Storage is not configured on the server.' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 4MB — use a smaller file.`,
        },
        { status: 413 }
      );
    }

    const supabase = createServerClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Upload to 'images' bucket
    const { data, error } = await supabase
      .storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
