import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  const result = await resend.emails.send({
    from:    `The Shehri Co. <${process.env.SENDER_EMAIL!}>`,
    to:      [process.env.OWNER_EMAIL!],
    subject: '✅ Resend Test — The Shehri Co.',
    html: `
      <div style="font-family:monospace;padding:32px;background:#F6F3EE;max-width:480px;margin:40px auto;border:1px solid #CEC8BF;">
        <h2 style="color:#191714;font-size:20px;margin:0 0 16px;">✅ Email is working!</h2>
        <p style="color:#888;font-size:13px;margin:0 0 8px;">API Key: valid</p>
        <p style="color:#888;font-size:13px;margin:0 0 8px;">Sent to: ${process.env.OWNER_EMAIL}</p>
        <p style="color:#888;font-size:13px;margin:0;">From: ${process.env.SENDER_EMAIL}</p>
        <hr style="margin:20px 0;border:none;border-top:1px solid #CEC8BF;" />
        <p style="color:#C04E18;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0;">
          The Shehri Co. · Delhi NCR
        </p>
      </div>
    `,
  });

  if (result.error) {
    return NextResponse.json({
      success: false,
      error:   result.error,
      hint:    'OWNER_EMAIL must be the exact email used to sign up on resend.com (free plan restriction)',
      ownerEmail: process.env.OWNER_EMAIL,
    }, { status: 400 });
  }

  return NextResponse.json({
    success:    true,
    emailId:    result.data?.id,
    sentTo:     process.env.OWNER_EMAIL,
    message:    'Check your inbox!',
  });
}
