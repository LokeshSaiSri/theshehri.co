import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  try {
    const { channel, subject, body, segment } = await req.json();

    console.log(`[BROADCAST] Channel: ${channel} | Segment: ${segment}`);
    
    if (channel === 'email') {
      let emails: string[] = [];
      
      // Fetch the actual email list based on the chosen segment
      if (segment === 'waitlist') {
        const { data } = await supabase.from('waitlist').select('email');
        if (data) emails = data.map((row: any) => row.email);
      } else if (segment === 'preorders') {
        const { data } = await supabase.from('preorders').select('email');
        if (data) emails = data.map((row: any) => row.email);
      } else if (segment === 'all_customers') {
        const { data } = await supabase.from('customers').select('email');
        if (data) emails = data.map((row: any) => row.email);
      }

      // Deduplicate emails
      emails = [...new Set(emails)].filter(Boolean);

      if (emails.length === 0) {
        return NextResponse.json({ error: `No emails found for segment: ${segment}` }, { status: 400 });
      }

      // Prepare minimal brand HTML template for the blast
      const emailHtml = `
      <div style="font-family:monospace;padding:32px;background:#F6F3EE;max-width:600px;margin:20px auto;border:1px solid #CEC8BF;">
        <h2 style="color:#191714;font-size:20px;margin:0 0 24px;">The Shehri Co.</h2>
        <div style="color:#191714;font-size:14px;line-height:1.6;white-space:pre-wrap;">${body}</div>
        <hr style="margin:40px 0 20px;border:none;border-top:1px solid #CEC8BF;" />
        <p style="color:#C04E18;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin:0;">Fit With No Logo · Delhi NCR</p>
      </div>`;

      // Use Resend batch API (or send individually for smaller lists)
      const FROM = `The Shehri Co. <${process.env.SENDER_EMAIL!}>`;
      
      console.log(`[BROADCAST] Sending to ${emails.length} recipients...`);
      
      // Resend batch limit is typically 100 per API call, mapping over it for simplicity
      const batchPayload = emails.map(email => ({
        from: FROM,
        to: [email],
        subject: subject || 'Update from The Shehri Co.',
        html: emailHtml,
      }));

      const { data, error } = await resend.batch.send(batchPayload);

      if (error) {
        throw error;
      }

      console.log(`[BROADCAST] Sent! Batch ID: ${data?.data?.[0]?.id || 'unknown'}`);
      return NextResponse.json({ success: true, message: `Blast sent successfully to ${emails.length} people.` });

    } else if (channel === 'whatsapp') {
      console.log(`[BROADCAST] WhatsApp Message: ${body}`);
      // TODO: Integrate WhatsApp API
    }

    return NextResponse.json({ success: true, message: 'Broadcast processed successfully' });
  } catch (error: any) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
