'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Users, Package } from 'lucide-react';

export default function AdminDrops() {
  const [drops, setDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/drops')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDrops(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-2 border-terracotta border-t-transparent" /></div>;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-[#191714] text-4xl tracking-wide">Drops</h1>
          <p className="font-mono text-ink/80 text-[0.72rem] mt-0.5">Manage limited drop launches and waitlists</p>
        </div>
        <Link href="/admin/drops/new" className="bg-terracotta text-white font-rajdhani font-bold text-[0.75rem] tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-[#a84015] transition-colors flex items-center gap-2">
          <Plus size={14} /> Create Drop
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {drops.map((drop) => {
          const isUpcoming = new Date(drop.launch_date) > new Date();
          return (
            <Link key={drop.id} href={`/admin/drops/${drop.id}`} className="group bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:border-terracotta/40 transition-all shadow-sm hover:shadow">
              <div className="h-32 bg-[#F9FAFB] relative overflow-hidden">
                {drop.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={drop.cover_image} alt={drop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/20">No Image</div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider rounded ${drop.is_active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {drop.is_active ? 'Active' : 'Draft'}
                  </span>
                  {isUpcoming && (
                    <span className="px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider rounded bg-[#191714] text-white">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-rajdhani font-bold text-lg text-[#191714] uppercase tracking-wide truncate">{drop.name}</h3>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-ink/70">
                    <Calendar size={13} />
                    <span className="font-mono text-[0.68rem]">{new Date(drop.launch_date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink/70">
                    <Package size={13} />
                    <span className="font-mono text-[0.68rem]">{drop.products?.length || 0} Products</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink/70">
                    <Users size={13} />
                    <span className="font-mono text-[0.68rem]">{drop.subscriberCount} Waitlist</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {drops.length === 0 && (
          <div className="col-span-full bg-white border border-[#E5E7EB] rounded-xl p-10 text-center">
            <p className="font-mono text-ink/60 text-sm">No drops created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
