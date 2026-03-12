import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TakeSend — Beynəlxalq Çatdırılma Platforması',
  description: 'Xaricə paket, sənəd, əşya göndərin. Kuryer tapın. Güvənli, sürətli, əlverişli.',
  keywords: ['çatdırılma', 'kuryer', 'beynəlxalq', 'göndəriş', 'azərbaycan'],
  openGraph: {
    title: 'TakeSend',
    description: 'Xaricə çatdırılma platforması',
    locale: 'az_AZ',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
