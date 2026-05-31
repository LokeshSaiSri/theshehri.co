'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { SITE_CONTACT } from '@/lib/site-contact';

export default function AdminSettings() {
  const [shipping, setShipping]   = useState('199');
  const [freeAt, setFreeAt]       = useState('2000');
  const [saved, setSaved]         = useState<string | null>(null);
  const [isLaunched, setIsLaunched] = useState(false);
  const [loadingLaunch, setLoadingLaunch] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings/shipping')
      .then((res) => res.json())
      .then((data) => {
        if (data.shipping_rate != null) setShipping(String(data.shipping_rate));
        if (data.free_shipping_above != null) setFreeAt(String(data.free_shipping_above));
      })
      .catch(console.error);

    fetch('/api/admin/launch')
      .then(res => res.json())
      .then(data => {
        setIsLaunched(data.is_launched === true);
        setLoadingLaunch(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingLaunch(false);
      });
  }, []);

  async function handleLaunchToggle(launched: boolean) {
    try {
      await fetch('/api/admin/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_launched: launched })
      });
      setIsLaunched(launched);
      mockSave('launch');
    } catch (e) {
      console.error(e);
    }
  }

  function mockSave(section: string) {
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  }

  async function saveShipping() {
    try {
      const res = await fetch('/api/admin/settings/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_rate: parseInt(shipping, 10),
          free_shipping_above: parseInt(freeAt, 10),
        }),
      });
      if (res.ok) mockSave('shipping');
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6 max-w-[700px]">
      <div>
        <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Settings</h1>
        <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">Store configuration</p>
      </div>

      {/* Shipping */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Shipping Rules</h2>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 block mb-2">Flat Rate (₹)</label>
            <input type="number" value={shipping} onChange={e => setShipping(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.82rem] focus:outline-none focus:border-terracotta/40" />
          </div>
          <div>
            <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/80 block mb-2">Free Above (₹)</label>
            <input type="number" value={freeAt} onChange={e => setFreeAt(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.82rem] focus:outline-none focus:border-terracotta/40" />
          </div>
        </div>
        <div className="bg-[#F9FAFB] rounded-lg px-4 py-3 mb-4">
          <p className="font-mono text-[0.72rem] text-ink/80">
            Current: ₹{shipping} flat shipping · FREE above ₹{Number(freeAt).toLocaleString('en-IN')}
          </p>
        </div>
        <button onClick={saveShipping}
          className={`flex items-center gap-2 px-4 py-2.5 font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase rounded-lg transition-colors ${saved === 'shipping' ? 'bg-green-600 text-white' : 'bg-terracotta text-white hover:bg-[#a84015]'}`}>
          {saved === 'shipping' ? <><Check size={13} />Saved</> : 'Save Shipping'}
        </button>
      </div>

      {/* Store info */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Store Info</h2>
        <div className="space-y-3">
          {[
            { label: 'Store Name',   value: 'The Shehri Co.' },
            { label: 'Location',     value: 'Delhi NCR, India' },
            { label: 'Owner Email',  value: SITE_CONTACT.email },
            { label: 'Phone',        value: SITE_CONTACT.phoneDisplay },
            { label: 'Instagram',    value: SITE_CONTACT.instagramHandle },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-2.5 border-b border-[#F9FAFB] last:border-0">
              <span className="font-mono text-[0.68rem] uppercase tracking-wider text-ink/80">{row.label}</span>
              <span className="font-mono text-[0.75rem] text-[#191714]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations status */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Integrations</h2>
        <div className="space-y-3">
          {[
            { name: 'Supabase',  status: 'Connected', color: 'bg-green-100 text-green-700' },
            { name: 'Resend',    status: 'Test Mode (domain unverified)', color: 'bg-yellow-100 text-yellow-700' },
            { name: 'PostHog',   status: 'Active', color: 'bg-green-100 text-green-700' },
            { name: 'Razorpay',  status: 'Mock Mode (awaiting keys)', color: 'bg-orange-100 text-orange-600' },
          ].map(i => (
            <div key={i.name} className="flex items-center justify-between py-2.5 border-b border-[#F9FAFB] last:border-0">
              <span className="font-rajdhani font-bold text-[0.82rem] text-[#191714] uppercase tracking-wide">{i.name}</span>
              <span className={`font-mono text-[0.62rem] px-2.5 py-1 rounded-full font-bold ${i.color}`}>{i.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin access — password is set via server env, not in the UI */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Admin Access</h2>
        <p className="font-mono text-[0.72rem] text-ink/80 leading-relaxed">
          Admin login is protected by <code className="text-[0.68rem]">ADMIN_PASSWORD</code> in your Vercel environment variables.
          To change it, update that variable and redeploy — there is no in-app password field.
        </p>
        <p className="font-mono text-[0.65rem] text-ink/60 mt-3">
          Access: press <kbd className="px-1 py-0.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded text-[0.6rem]">⌘⇧L</kbd> on any page, then sign in at <span className="text-[#191714]">/admin/login</span>. Direct admin URLs redirect away. Session expires after 7 days.
        </p>
      </div>

      {/* Store Launch Status */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
        <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-5">Store Status</h2>
        <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg mb-4">
          <div>
            <h3 className="font-mono text-[0.8rem] text-ink font-bold uppercase tracking-wider">
              {loadingLaunch ? 'Loading...' : (isLaunched ? 'Store is LIVE' : 'Pre-launch Mode')}
            </h3>
            <p className="font-mono text-[0.65rem] text-ink/70 mt-1 max-w-[300px]">
              {isLaunched 
                ? 'Public traffic can access the full store and checkout.' 
                : 'All traffic is being redirected to the pre-launch page.'}
            </p>
          </div>
          <button 
            onClick={() => handleLaunchToggle(!isLaunched)}
            disabled={loadingLaunch}
            className={`px-5 py-2.5 font-rajdhani font-bold text-[0.8rem] tracking-widest uppercase rounded-lg transition-colors disabled:opacity-50 ${
              isLaunched 
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLaunched ? 'Revert to Pre-launch' : 'Launch Store'}
          </button>
        </div>
      </div>
    </div>
  );
}
