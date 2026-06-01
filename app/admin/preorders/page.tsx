'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';

export default function AdminPreorders() {
  const [preorders, setPreorders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/preorders')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPreorders(data);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Pre-launch Reservations</h1>
        <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">
          {preorders.length} reservation{preorders.length !== 1 ? 's' : ''} from the CLAIM YOUR DROP form
        </p>
      </div>

      {preorders.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 text-center">
          <ClipboardList size={32} className="mx-auto text-ink/20 mb-3" />
          <p className="font-mono text-ink/60 text-sm">No reservations yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 px-5 py-3">Name</th>
                <th className="text-left font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 px-5 py-3">Email</th>
                <th className="text-left font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 px-5 py-3">Phone</th>
                <th className="text-left font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 px-5 py-3">Product</th>
                <th className="text-left font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 px-5 py-3">Color</th>
                <th className="text-left font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 px-5 py-3">Size</th>
                <th className="text-left font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {preorders.map((p, i) => (
                <tr key={p.id} className={`border-b border-[#F9FAFB] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#FAFAFA]'}`}>
                  <td className="px-5 py-3 font-rajdhani font-bold text-[#191714]">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-[0.75rem] text-ink/70">{p.email}</td>
                  <td className="px-5 py-3 font-mono text-[0.75rem] text-ink/70">{p.phone || '—'}</td>
                  <td className="px-5 py-3 font-mono text-[0.75rem] text-ink/70">{p.product || '—'}</td>
                  <td className="px-5 py-3 font-mono text-[0.75rem] text-ink/70">{p.color || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="inline-block bg-terracotta/10 text-terracotta font-mono text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded">
                      {p.size || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[0.68rem] text-ink/50">
                    {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
