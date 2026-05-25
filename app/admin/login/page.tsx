'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError('Incorrect password. Try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0E0D] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-baseline gap-1.5 font-bebas text-paper text-3xl tracking-widest mb-2">
            <span>THE</span>
            <span className="font-devanagari text-terracotta text-3xl">शहरी</span>
            <span>CO.</span>
          </div>
          <p className="font-mono text-ink/80 text-[0.7rem] tracking-[0.25em] uppercase">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-[#1A1815] border border-white/5 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-terracotta/10 rounded flex items-center justify-center">
              <Lock size={14} className="text-terracotta" />
            </div>
            <div>
              <p className="font-rajdhani font-bold text-paper text-sm tracking-widest uppercase">Secure Access</p>
              <p className="font-mono text-ink/80 text-[0.65rem]">Owner access only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-[0.65rem] text-ink/80 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#0F0E0D] border border-white/10 text-paper font-mono text-sm px-4 py-3 pr-10 focus:outline-none focus:border-terracotta/60 transition-colors placeholder:text-ink/80"
                  placeholder="Enter admin password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/80 hover:text-ink/80 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-[0.68rem] text-terracotta mt-2"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={!password || loading}
              className="w-full bg-terracotta text-white font-rajdhani font-bold text-sm tracking-[0.2em] uppercase py-3.5 flex items-center justify-center gap-2 hover:bg-[#a84015] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : 'Enter Admin'}
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[0.6rem] text-ink/80 mt-6">
          The Shehri Co. · Delhi NCR
        </p>
      </motion.div>
    </main>
  );
}
