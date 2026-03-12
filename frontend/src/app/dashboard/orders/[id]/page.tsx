'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Package, Phone, Star, Loader2, CheckCircle, Clock, Truck, AlertCircle, X } from 'lucide-react';
import { ordersAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useLangStore } from '@/store/lang';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const MapTracker = dynamic(() => import('@/components/MapTracker'), { ssr: false });

const STATUS_STEPS = ['CREATED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_ICONS: Record<string, any> = {
  CREATED: Clock,
  ACCEPTED: CheckCircle,
  PICKED_UP: Package,
  IN_TRANSIT: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: X
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { t } = useLangStore();
  const queryClient = useQueryClient();
  const [reviewMode, setReviewMode] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersAPI.get(id as string).then(r => r.data.order),
    refetchInterval: 15000 // Poll every 15s
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      ordersAPI.updateStatus(id as string, status, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] })
  });

  const acceptMutation = useMutation({
    mutationFn: () => ordersAPI.accept(id as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] })
  });

  const reviewMutation = useMutation({
    mutationFn: () => ordersAPI.review(id as string, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setReviewMode(false);
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  if (!data) return <div className="text-center py-12 text-gray-400">Sifariş tapılmadı</div>;

  const order = data;
  const isSender = user?.id === order.senderId;
  const isCourier = user?.id === order.courierId;
  const statusIdx = STATUS_STEPS.indexOf(order.status);

  const statusColors: Record<string, string> = {
    CREATED: 'bg-gray-100 text-gray-700',
    ACCEPTED: 'bg-blue-50 text-blue-700',
    PICKED_UP: 'bg-amber-50 text-amber-700',
    IN_TRANSIT: 'bg-purple-50 text-purple-700',
    DELIVERED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-red-50 text-red-600'
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 page-enter">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sifariş #{order.id.slice(0, 8)}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString('az')}</p>
        </div>
        <span className={`status-badge ${statusColors[order.status]}`}>{t(order.status as any)}</span>
      </div>

      {/* Map (show when active delivery) */}
      {['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status) && order.courier && (
        <div className="card p-0 overflow-hidden">
          <div className="h-48 relative">
            <MapTracker
              pickupLat={order.pickupLat} pickupLng={order.pickupLng}
              dropoffLat={order.dropoffLat} dropoffLng={order.dropoffLng}
              courierId={order.courierId}
              orderId={order.id}
            />
          </div>
        </div>
      )}

      {/* Status timeline */}
      <div className="card">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Çatdırılma Statusu</h2>
        <div className="space-y-3">
          {order.events.map((event: any, i: number) => {
            const Icon = STATUS_ICONS[event.status] || Clock;
            const isLast = i === order.events.length - 1;
            return (
              <div key={event.id} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isLast ? 'bg-orange-500' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${isLast ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${isLast ? 'text-gray-900' : 'text-gray-500'}`}>
                    {t(event.status as any)}
                  </div>
                  <div className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString('az')}</div>
                  {event.note && <div className="text-xs text-gray-500 mt-0.5">{event.note}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order details */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-gray-700">Sifariş Detalları</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Paket növü</div>
            <div className="font-medium text-gray-800">{t(order.packageType?.toLowerCase() as any)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Ölçü / Çəki</div>
            <div className="font-medium text-gray-800">{order.packageSize} · {order.weightKg} kq</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Məsafə</div>
            <div className="font-medium text-gray-800">{order.distanceKm} km</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Qiymət</div>
            <div className="font-bold text-orange-500 text-lg">{order.price} ₼</div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-50">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-gray-400 text-xs">Götürülmə: </span>
              <span className="text-gray-700">{order.pickupAddress}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm mt-1.5">
            <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-gray-400 text-xs">Çatdırılma: </span>
              <span className="text-gray-700">{order.dropoffAddress}</span>
            </div>
          </div>
        </div>

        {order.senderNote && (
          <div className="bg-amber-50 rounded-xl px-3 py-2 text-sm text-amber-700">
            📝 {order.senderNote}
          </div>
        )}
      </div>

      {/* Courier info */}
      {order.courier && (
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
              {order.courier.name[0]}{order.courier.surname[0]}
            </div>
            <div>
              <div className="font-semibold text-gray-800">{order.courier.name} {order.courier.surname}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                ⭐ {order.courier.rating} · {order.courier.transportType?.toLowerCase()}
              </div>
            </div>
          </div>
          <a href={`tel:${order.courier.phone}`} className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors">
            <Phone className="w-4 h-4 text-emerald-600" />
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Courier: accept */}
        {user?.role === 'COURIER' && order.status === 'CREATED' && !order.courierId && (
          <button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {acceptMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            ✅ Sifarişi Qəbul Et
          </button>
        )}

        {/* Courier: status updates */}
        {isCourier && order.status === 'ACCEPTED' && (
          <button onClick={() => statusMutation.mutate({ status: 'PICKED_UP' })} className="btn-primary w-full">
            📦 Götürdüm
          </button>
        )}
        {isCourier && order.status === 'PICKED_UP' && (
          <button onClick={() => statusMutation.mutate({ status: 'IN_TRANSIT' })} className="btn-primary w-full">
            🚗 Yoldayam
          </button>
        )}
        {isCourier && order.status === 'IN_TRANSIT' && (
          <button onClick={() => statusMutation.mutate({ status: 'DELIVERED' })} className="btn-primary w-full">
            ✅ Çatdırdım
          </button>
        )}

        {/* Cancel */}
        {['CREATED', 'ACCEPTED'].includes(order.status) && (isSender || isCourier) && (
          <button
            onClick={() => statusMutation.mutate({ status: 'CANCELLED' })}
            className="w-full py-3 border-2 border-red-100 text-red-500 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            Sifarişi ləğv et
          </button>
        )}

        {/* Review */}
        {order.status === 'DELIVERED' && !order.review && (isSender || isCourier) && (
          !reviewMode ? (
            <button onClick={() => setReviewMode(true)} className="btn-secondary w-full">
              ⭐ Rəy Yaz
            </button>
          ) : (
            <div className="card space-y-4">
              <h3 className="font-bold text-gray-800">Rəy Yaz</h3>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(r => (
                  <button key={r} onClick={() => setRating(r)}
                    className={`text-2xl transition-transform ${r <= rating ? 'scale-110' : 'opacity-30'}`}>
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="input-field resize-none"
                rows={2}
                placeholder="Şərh (ixtiyari)"
              />
              <button onClick={() => reviewMutation.mutate()} className="btn-primary w-full">
                Göndər
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
