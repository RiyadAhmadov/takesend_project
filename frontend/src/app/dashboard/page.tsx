'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, Plus, TrendingUp, Clock, CheckCircle, AlertCircle, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLangStore } from '@/store/lang';
import { ordersAPI, usersAPI } from '@/lib/api';
import OrderCard from '@/components/OrderCard';
import { useState } from 'react';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user, updateUser } = useAuthStore();
  const { t } = useLangStore();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', 'home'],
    queryFn: () => ordersAPI.list({ limit: 5 }).then(r => r.data)
  });

  const { data: earnings } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => usersAPI.getEarnings().then(r => r.data),
    enabled: user?.role === 'COURIER'
  });

  const { data: availableOrders } = useQuery({
    queryKey: ['available-orders'],
    queryFn: () => ordersAPI.list({ limit: 10 }).then(r => r.data),
    enabled: user?.role === 'COURIER'
  });

  const [toggling, setToggling] = useState(false);
  const toggleAvailability = async () => {
    if (!user || user.role !== 'COURIER') return;
    setToggling(true);
    try {
      await usersAPI.setAvailability(!user.isOnline);
      updateUser({ isOnline: !user.isOnline });
    } finally {
      setToggling(false);
    }
  };

  if (!user) return null;

  const orders = ordersData?.orders || [];
  const statusColors: Record<string, string> = {
    CREATED: 'bg-gray-100 text-gray-700',
    ACCEPTED: 'bg-blue-50 text-blue-700',
    PICKED_UP: 'bg-amber-50 text-amber-700',
    IN_TRANSIT: 'bg-purple-50 text-purple-700',
    DELIVERED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-red-50 text-red-600'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Salam, {user.name}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user.role === 'SENDER' ? 'Yeni göndəriş yarat və ya sifarişlərini izlə' : 'Aktiv sifarişlərini qəbul et'}
          </p>
        </div>
        
        {user.role === 'SENDER' && (
          <Link href="/dashboard/orders/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Yeni Sifariş
          </Link>
        )}

        {user.role === 'COURIER' && (
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              user.isOnline
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : user.isOnline ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {user.isOnline ? 'Onlayn' : 'Oflayn'}
          </button>
        )}
      </div>

      {/* Courier stats */}
      {user.role === 'COURIER' && earnings && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Bu gün qazanc', value: `${earnings.today.earnings} ₼`, sub: `${earnings.today.orders} çatdırılma`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Bu ay', value: `${earnings.month.earnings} ₼`, sub: `${earnings.month.orders} çatdırılma`, icon: Clock, color: 'text-blue-600 bg-blue-50' },
            { label: 'Reytinq', value: `⭐ ${user.rating}`, sub: `${earnings.total.orders} ümumi`, icon: CheckCircle, color: 'text-amber-600 bg-amber-50' },
          ].map((stat, i) => (
            <div key={i} className="card">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
              <div className="text-xs text-gray-400">{stat.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sender quick stats */}
      {user.role === 'SENDER' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Aktiv', value: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length, color: 'text-orange-600 bg-orange-50' },
            { label: 'Çatdırıldı', value: orders.filter(o => o.status === 'DELIVERED').length, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Ümumi', value: orders.length, color: 'text-blue-600 bg-blue-50' },
          ].map((s, i) => (
            <div key={i} className="card text-center">
              <div className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {user.role === 'COURIER' ? 'Mövcud Sifarişlər' : 'Son Sifarişlər'}
          </h2>
          <Link href="/dashboard/orders" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            Hamısına bax →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Hələ sifariş yoxdur</p>
            {user.role === 'SENDER' && (
              <Link href="/dashboard/orders/new" className="btn-primary text-sm mt-4 inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> İlk sifariş yarat
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <OrderCard key={order.id} order={order} statusColors={statusColors} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
