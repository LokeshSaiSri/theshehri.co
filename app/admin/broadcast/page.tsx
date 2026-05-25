'use client';

import { useState } from 'react';
import { Send, Loader2, Check } from 'lucide-react';

export default function AdminBroadcast() {
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [segment, setSegment] = useState('all');

  async function send() {
    if (!body || (channel === 'email' && !subject)) return;
    setSending(true);
    await fetch('/api/admin/broadcast', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, subject: channel === 'whatsapp' ? undefined : subject, body, segment }),
    });
    setSending(false); setSent(true); setSubject(''); setBody('');
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-[800px]">
      <div>
        <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Broadcast</h1>
        <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">Send messages to customer segments</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5">
        <div>
          <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 block mb-2">Channel</label>
          <div className="flex gap-2">
            {[
              { id: 'email', label: 'Email' },
              { id: 'whatsapp', label: 'WhatsApp' }
            ].map((c) => (
              <button key={c.id} onClick={() => setChannel(c.id as any)}
                className={`px-4 py-2 font-rajdhani font-bold text-[0.8rem] uppercase tracking-wider rounded-lg border transition-colors ${channel === c.id ? 'bg-[#191714] text-white border-[#191714]' : 'bg-white text-ink/80 border-[#E5E7EB] hover:border-gray-300'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 block mb-2">Segment</label>
          <div className="flex gap-2 flex-wrap">
            {[['all','All Customers'],['preorders','Drop Pre-orders'],['waitlist','Waitlist (Notify Me)'],['vip','VIP Only'],['repeat','Repeat Buyers'],['new','New Customers'],['at-risk','At Risk']].map(([v,l]) => (
              <button key={v} onClick={() => setSegment(v)}
                className={`px-3 py-1.5 font-mono text-[0.68rem] rounded-lg border transition-colors ${segment === v ? 'bg-terracotta text-white border-terracotta' : 'bg-white text-ink/80 border-[#E5E7EB] hover:border-gray-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {channel === 'email' && (
          <div>
            <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 block mb-2">Subject Line</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. New Drop — Limited Stock"
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3 font-mono text-[0.82rem] focus:outline-none focus:border-terracotta/40 placeholder:text-ink/80" />
          </div>
        )}
        
        <div>
          <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 block mb-2">Message</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder={channel === 'whatsapp' ? "Write your WhatsApp message here..." : "Write your email body here..."}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-3 font-mono text-[0.82rem] focus:outline-none focus:border-terracotta/40 placeholder:text-ink/80 resize-none" />
          {channel === 'whatsapp' && <p className="font-mono text-[0.62rem] text-ink/50 mt-2">WhatsApp messages may require pre-approved templates depending on your Business API provider.</p>}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {channel === 'email' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 font-mono text-[0.68rem] font-bold uppercase tracking-wider">
                <Check size={12} strokeWidth={3} /> Domain Verified
              </span>
            ) : (
              <p className="font-mono text-[0.68rem] text-ink/80">Requires configured Twilio/Meta provider</p>
            )}
          </div>
          <button onClick={send} disabled={!body || (channel === 'email' && !subject) || sending}
            className={`flex items-center gap-2 px-5 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors ${sent ? 'bg-green-600 text-white' : 'bg-terracotta text-white hover:bg-[#a84015] disabled:opacity-40 disabled:cursor-not-allowed'}`}>
            {sending ? <><Loader2 size={14} className="animate-spin" />Sending</> : sent ? <><Check size={14} />Sent!</> : <><Send size={14} />Send Broadcast</>}
          </button>
        </div>
      </div>
    </div>
  );
}
