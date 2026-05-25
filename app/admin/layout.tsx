'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart2,
  Activity, Zap, Megaphone, RotateCcw, Bell, Settings,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/admin/orders',     label: 'Orders',     icon: Package },
  { href: '/admin/products',   label: 'Products',   icon: ShoppingBag },
  { href: '/admin/customers',  label: 'Customers',  icon: Users },
  { href: '/admin/analytics',  label: 'Analytics',  icon: BarChart2 },
  { href: '/admin/footfall',   label: 'Footfall',   icon: Activity },
  { href: '/admin/drops',      label: 'Drops',      icon: Zap },
  { href: '/admin/broadcast',  label: 'Broadcast',  icon: Megaphone },
  { href: '/admin/returns',    label: 'Returns',    icon: RotateCcw },
  { href: '/admin/alerts',     label: 'Alerts',     icon: Bell },
  { href: '/admin/settings',   label: 'Settings',   icon: Settings },
];

function NavItem({ href, label, icon: Icon, exact, onClick }: {
  href: string; label: string; icon: React.ElementType;
  exact?: boolean; onClick?: () => void;
}) {
  const pathname  = usePathname();
  const isActive  = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-rajdhani font-bold tracking-wider transition-all duration-150 group ${
        isActive
          ? 'bg-terracotta/15 text-terracotta'
          : 'text-white/50 hover:text-white/70 hover:bg-white/5'
      }`}
    >
      <Icon size={16} className={isActive ? 'text-terracotta' : 'text-white/30 group-hover:text-white/50'} />
      <span className="uppercase tracking-[0.12em]">{label}</span>
      {isActive && <ChevronRight size={12} className="ml-auto text-terracotta/60" />}
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="w-60 min-h-screen bg-[#0F0E0D] border-r border-white/5 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-baseline gap-1 font-bebas text-paper text-xl tracking-widest">
          <span>THE</span>
          <span className="font-devanagari text-terracotta">शहरी</span>
          <span>CO.</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[0.5rem] text-white/30 uppercase tracking-widest">Admin</span>
          {onClose && (
            <button onClick={onClose} className="text-white/30 hover:text-white/70 lg:hidden">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavItem key={item.href} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-rajdhani font-bold tracking-wider text-white/40 hover:text-white/70 hover:bg-white/5 rounded-md transition-all"
        >
          <LogOut size={16} />
          <span className="uppercase tracking-[0.12em]">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden bg-[#0F0E0D] border-b border-white/5 px-4 h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-1 font-bebas text-paper text-lg tracking-widest">
            <span>THE</span>
            <span className="font-devanagari text-terracotta">शहरी</span>
            <span>CO.</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-white/50 hover:text-white/70">
            <Menu size={20} />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
