'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, Package, User, Settings, LogOut, Plane, 
  DollarSign, BarChart2, Users, Menu
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLangStore } from '@/store/lang';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { t } = useLangStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  if (!user) return null;

  const senderNav = [
    { href: '/dashboard', icon: Home, label: t('home') },
    { href: '/dashboard/orders', icon: Package, label: t('orders') },
    { href: '/dashboard/profile', icon: User, label: t('profile') },
  ];

  const courierNav = [
    { href: '/dashboard', icon: Home, label: t('home') },
    { href: '/dashboard/orders', icon: Package, label: t('orders') },
    { href: '/dashboard/earnings', icon: DollarSign, label: t('earnings') },
    { href: '/dashboard/profile', icon: User, label: t('profile') },
  ];

  const adminNav = [
    { href: '/dashboard', icon: BarChart2, label: 'Dashboard' },
    { href: '/dashboard/admin/users', icon: Users, label: 'İstifadəçilər' },
    { href: '/dashboard/admin/orders', icon: Package, label: 'Sifarişlər' },
    { href: '/dashboard/admin/pricing', icon: DollarSign, label: 'Qiymətlər' },
  ];

  const nav = user.role === 'ADMIN' ? adminNav : user.role === 'COURIER' ? courierNav : senderNav;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-gray-900">Take<span className="text-orange-500">Send</span></span>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
              {user.name[0]}{user.surname[0]}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">{user.name} {user.surname}</div>
              <div className="text-xs text-gray-400 capitalize">
                {user.role === 'SENDER' ? '📦 Göndərən' : user.role === 'COURIER' ? '🚗 Kuryer' : '👑 Admin'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 space-y-0.5">
          <LanguageSwitcher variant="sidebar" />
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900">Take<span className="text-orange-500">Send</span></span>
          <div className="w-5" />
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
