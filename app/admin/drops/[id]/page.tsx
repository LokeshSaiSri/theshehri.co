'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import { uploadAdminImage } from '@/lib/admin-image-upload';

const DEFAULT_DROP = {
  id: 'new', name: '', slug: '', description: '', cover_image: '', launch_date: new Date().toISOString().slice(0,16), is_active: true
};

export default function AdminDropDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [drop, setDrop] = useState<any>(DEFAULT_DROP);
  const [loading, setLoading] = useState(id !== 'new');
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    if (id !== 'new') {
      fetch(`/api/admin/drops/${id}`).then(r => r.json()).then(d => {
        setDrop({
          ...d,
          launch_date: d.launch_date ? new Date(d.launch_date).toISOString().slice(0,16) : ''
        });
        setLoading(false);
      });
    }
  }, [id]);

  async function save() {
    setSaving(true);
    const method = id === 'new' ? 'POST' : 'PATCH';
    const endpoint = id === 'new' ? '/api/admin/drops' : `/api/admin/drops/${id}`;
    
    const payload = {
      ...drop,
      launch_date: new Date(drop.launch_date).toISOString()
    };
    if (payload.id === 'new') delete payload.id;

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) router.push('/admin/drops');
    else { alert('Failed to save drop'); setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this drop? This action cannot be undone.')) return;
    setSaving(true);
    const res = await fetch(`/api/admin/drops/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/drops');
    else { alert('Failed to delete drop'); setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-terracotta" /></div>;

  return (
    <div className="space-y-6 max-w-[800px] pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/drops" className="flex items-center gap-1.5 font-mono text-[0.72rem] text-ink/50 hover:text-ink">
            <ArrowLeft size={13} /> Back
          </Link>
          <h1 className="font-bebas text-[#191714] text-3xl tracking-wide">{id === 'new' ? 'New Drop' : 'Edit Drop'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {id !== 'new' && (
            <button onClick={handleDelete} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 font-rajdhani font-bold text-[0.78rem] tracking-widest uppercase rounded-lg transition-colors bg-terracotta text-white hover:bg-[#a84015] disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving</> : <><Save size={14} />Save Drop</>}
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Drop Name</label>
            <input value={drop.name} onChange={e => setDrop({...drop, name: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40" />
          </div>
          <div>
            <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">URL Slug</label>
            <input value={drop.slug} onChange={e => setDrop({...drop, slug: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40" />
          </div>
        </div>
        
        <div>
          <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Launch Date & Time</label>
          <input type="datetime-local" value={drop.launch_date} onChange={e => setDrop({...drop, launch_date: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 block">Cover Image URL</label>
            <label className={`cursor-pointer bg-terracotta text-white px-2 py-1 rounded text-[0.55rem] font-bold uppercase tracking-widest hover:bg-[#a84015] transition-colors ${coverUploading ? 'opacity-70 pointer-events-none' : ''}`}>
              <span className="flex items-center gap-1">
                {coverUploading ? <Loader2 size={10} className="animate-spin" /> : null}
                {coverUploading ? 'Uploading...' : 'Upload'}
              </span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden"
                disabled={coverUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setCoverUploading(true);
                  try {
                    const url = await uploadAdminImage(file);
                    setDrop({ ...drop, cover_image: url });
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Error uploading file');
                  } finally {
                    setCoverUploading(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
          <input value={drop.cover_image} onChange={e => setDrop({...drop, cover_image: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40" placeholder="https://..." />
          {drop.cover_image && (
            <div className="mt-3 aspect-[4/5] w-32 bg-[#F9FAFB] rounded-lg overflow-hidden border border-[#E5E7EB] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={drop.cover_image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div>
          <label className="font-mono text-[0.62rem] uppercase tracking-widest text-ink/50 mb-1.5 block">Description</label>
          <textarea value={drop.description} onChange={e => setDrop({...drop, description: e.target.value})} rows={4} className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5 font-mono text-[0.8rem] focus:outline-none focus:border-terracotta/40 resize-none" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer mt-4">
          <div className={`w-10 h-5 rounded-full relative transition-colors ${drop.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${drop.is_active ? 'left-6' : 'left-1'}`} />
          </div>
          <span className="font-mono text-[0.75rem] text-ink/70 uppercase tracking-widest">{drop.is_active ? 'Active' : 'Draft'}</span>
        </label>
      </div>

      {id !== 'new' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="font-rajdhani font-bold text-[#191714] text-sm uppercase tracking-wider mb-4">Waitlist Subscribers</h2>
          <div className="space-y-2">
            {(drop.drop_subscribers || []).map((s: any) => (
              <div key={s.id} className="flex justify-between py-2 border-b border-[#F9FAFB] last:border-0">
                <span className="font-mono text-[0.75rem] text-[#191714]">{s.email || s.phone}</span>
                <span className="font-mono text-[0.65rem] text-ink/50">{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {(!drop.drop_subscribers || drop.drop_subscribers.length === 0) && (
              <p className="font-mono text-ink/60 text-[0.7rem] py-2">No subscribers yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
