# 🚀 TakeSend — Beynəlxalq Çatdırılma Platforması

> Bakıdan Türkiyəyə, Rusiyaya, Almaniyaya — real kuryerlərlə paket göndər.

---

## 📁 Layihə Strukturu

```
takesend/
├── backend/          # Node.js + Express + Prisma
│   ├── prisma/
│   │   └── schema.prisma   # Tam DB modeli
│   └── src/
│       ├── routes/         # auth, orders, users, admin, payments
│       ├── middleware/      # JWT auth
│       ├── socket/          # Socket.io real-time
│       └── utils/           # seed.js
└── frontend/         # Next.js 14 + Tailwind + Zustand
    └── src/
        ├── app/
        │   ├── page.tsx          # Landing page
        │   ├── login/            # OTP login flow
        │   └── dashboard/        # Sender + Courier views
        ├── components/
        │   ├── MapTracker.tsx    # Leaflet real-time map
        │   ├── OrderCard.tsx     # Reusable order card
        │   └── LanguageSwitcher.tsx # AZ/EN/RU/TR
        ├── store/                # Zustand state
        └── lib/                  # API client, i18n
```

---

## ⚙️ Local Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Git

### 2. Backend

```bash
cd backend

# Install
npm install

# Prisma setup
cp .env.example .env
# .env içindəki DATABASE_URL-i özünün PostgreSQL URL-inə dəyişdir

# DB migrate + generate
npx prisma migrate dev --name init
npx prisma generate

# Test data
npm run db:seed

# Start dev server
npm run dev
# → http://localhost:5000
```

### 3. Frontend

```bash
cd frontend

# Install
npm install

cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start
npm run dev
# → http://localhost:3000
```

---

## 🧪 Test Hesabları (seed sonrası)

| Rol | Telefon | OTP |
|-----|---------|-----|
| Admin | +994501234567 | console-a çıxacaq |
| Sender | +994551234567 | console-a çıxacaq |
| Courier | +994701234567 | console-a çıxacaq |

> Dev modu: OTP kodu SMS göndərilmir, backend console-a çıxır + response-da da görünür.

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/send-otp      — OTP göndər
POST /api/auth/verify-otp    — OTP təsdiqlə / login
GET  /api/auth/me            — Cari istifadəçi
```

### Orders
```
GET    /api/orders                  — Sifariş siyahısı
POST   /api/orders                  — Sifariş yarat
GET    /api/orders/:id              — Sifariş detalları
POST   /api/orders/:id/accept       — Kuryerin qəbulu
PATCH  /api/orders/:id/status       — Status yenilə
POST   /api/orders/:id/review       — Rəy yaz
GET    /api/orders/price/estimate   — Qiymət hesabla
```

### Users
```
GET   /api/users/profile          — Profil
PATCH /api/users/profile          — Profil yenilə
PATCH /api/users/availability     — Kuryer online/offline
GET   /api/users/stats/earnings   — Kuryer qazancı
```

### Admin
```
GET    /api/admin/stats            — Statistika
GET    /api/admin/users            — İstifadəçilər
PATCH  /api/admin/users/:id/ban    — Ban
PATCH  /api/admin/users/:id/verify-id — ID təsdiqi
GET    /api/admin/orders           — Sifarişlər
GET    /api/admin/pricing          — Qiymət konfiqürasiyaları
POST   /api/admin/pricing          — Qiymət yenilə
GET    /api/admin/logs             — Admin logları
```

---

## 🛰️ Real-time (Socket.io)

```javascript
// Connect
const socket = io('http://localhost:5000', { auth: { token } });

// Sifariş otağına qoşul (sender + courier)
socket.emit('join:order', orderId);

// Kuryer location update
socket.emit('location:update', { lat, lng, heading, speed, orderId });

// Events listen
socket.on('location:updated', ({ lat, lng }) => { ... });
socket.on('order:statusUpdated', ({ orderId, status }) => { ... });
socket.on('order:new', (order) => { ... });
```

---

## 🚀 Deployment

### Backend → Render.com

1. GitHub-a push et
2. [render.com](https://render.com) → New Web Service
3. Build: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start: `npm start`
5. Environment variables əlavə et (`.env.example`-dəkilər)

### Database → Render PostgreSQL (pulsuz)

1. Render → New PostgreSQL
2. `DATABASE_URL`-i backend environment-ə əlavə et

### Frontend → Vercel

```bash
npm install -g vercel
cd frontend
vercel --prod
```

Environment: `NEXT_PUBLIC_API_URL=https://your-backend.render.com/api`

---

## 📦 Texnologiya Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, Tailwind CSS, Framer Motion |
| State | Zustand (persist) |
| Data fetching | TanStack Query |
| Backend | Node.js, Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Real-time | Socket.io |
| Maps | React Leaflet (OpenStreetMap) |
| Auth | JWT + OTP (Twilio) |
| Storage | Cloudinary |
| i18n | AZ, EN, RU, TR |

---

## 🔐 Production Checklist

- [ ] `JWT_SECRET` güclü bir string ilə əvəzlə
- [ ] `NODE_ENV=production` set et
- [ ] Twilio credentials əlavə et (real OTP SMS)
- [ ] Cloudinary credentials əlavə et
- [ ] CORS `FRONTEND_URL`-i real domain ilə yenilə
- [ ] Dev mode-da `devCode` response-dan sil
- [ ] Rate limiting yoxla
- [ ] HTTPS aktiv et (Render/Vercel avtomatik edir)

---

## 👨‍💻 Gəlişdirmə Yolu

**v1.1 (Növbəti)**
- [ ] In-app chat (Socket.io rooms)
- [ ] Stripe card payment
- [ ] Push notifications (FCM)
- [ ] Courier ID upload & admin verify flow
- [ ] Advanced admin dashboard

**v2.0**
- [ ] Mobile app (React Native)
- [ ] Courier route optimization
- [ ] Dispute / refund system
