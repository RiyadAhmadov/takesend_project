'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';

// Fix Leaflet icons
const pickupIcon = L.divIcon({
  html: `<div style="background:#f97316;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [32, 32], iconAnchor: [16, 32], className: ''
});

const dropoffIcon = L.divIcon({
  html: `<div style="background:#3b82f6;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px">📍</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16], className: ''
});

const courierIcon = L.divIcon({
  html: `<div style="background:#10b981;width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px">🚗</div>`,
  iconSize: [40, 40], iconAnchor: [20, 20], className: ''
});

interface MapTrackerProps {
  pickupLat: number; pickupLng: number;
  dropoffLat: number; dropoffLng: number;
  courierId?: string;
  orderId?: string;
}

export default function MapTracker({ pickupLat, pickupLng, dropoffLat, dropoffLng, courierId, orderId }: MapTrackerProps) {
  const { token } = useAuthStore();
  const [courierPos, setCourierPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!courierId || !token) return;

    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      if (orderId) socket.emit('join:order', orderId);
    });

    socket.on('location:updated', (data: any) => {
      if (data.courierId === courierId) {
        setCourierPos([data.lat, data.lng]);
      }
    });

    return () => { socket.disconnect(); };
  }, [courierId, orderId, token]);

  const center: [number, number] = [pickupLat, pickupLng];

  return (
    <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap'
      />
      
      <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
        <Popup>📦 Götürülmə</Popup>
      </Marker>
      
      {dropoffLat && dropoffLng && (
        <Marker position={[dropoffLat, dropoffLng]} icon={dropoffIcon}>
          <Popup>📍 Çatdırılma</Popup>
        </Marker>
      )}

      {courierPos && (
        <Marker position={courierPos} icon={courierIcon}>
          <Popup>🚗 Kuryer</Popup>
        </Marker>
      )}

      {courierPos && dropoffLat && (
        <Polyline
          positions={[courierPos, [dropoffLat, dropoffLng]]}
          color="#f97316"
          weight={3}
          dashArray="8"
          opacity={0.8}
        />
      )}
    </MapContainer>
  );
}
