'use client';
import Link from 'next/link';
import { MapPin, Package, Clock, ChevronRight } from 'lucide-react';
import { useLangStore } from '@/store/lang';

interface OrderCardProps {
  order: any;
  statusColors: Record<string, string>;
}

const packageIcons: Record<string, string> = {
  DOCUMENT: '📄',
  BOX: '📦',
  FOOD: '🍱',
  OTHER: '📫'
};

const countryFlags: Record<string, string> = {
  TR: '🇹🇷', RU: '🇷🇺', DE: '🇩🇪', AE: '🇦🇪',
  US: '🇺🇸', GB: '🇬🇧', UA: '🇺🇦', GE: '🇬🇪'
};

export default function OrderCard({ order, statusColors }: OrderCardProps) {
  const { t } = useLangStore();
  const statusKey = order.status as keyof typeof t;
  const statusLabel = t(order.status as any) || order.status;
  const badgeClass = statusColors[order.status] || 'bg-gray-100 text-gray-700';

  return (
    <Link href={`/dashboard/orders/${order.id}`}>
      <div className="card hover:shadow-md hover:border-orange-100 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              {packageIcons[order.packageType] || '📦'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`status-badge ${badgeClass}`}>
                  {statusLabel}
                </span>
                {order.isUrgent && (
                  <span className="status-badge bg-red-50 text-red-600">⚡ Təcili</span>
                )}
                <span className="text-xs text-gray-400">
                  {countryFlags[order.destinationCountry]} {order.destinationCountry}
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="truncate">{order.pickupAddress}</span>
                <span className="text-gray-300 mx-0.5">→</span>
                <span className="truncate">{order.dropoffAddress}</span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0 flex items-center gap-2">
            <div>
              <div className="text-lg font-bold text-orange-500">{order.price} ₼</div>
              <div className="text-xs text-gray-400">{order.distanceKm} km</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
