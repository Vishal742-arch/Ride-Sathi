import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
export const metadata: Metadata = {
  title: { default: 'Ride With Me — Shared Rides & Carpooling', template: '%s | Ride With Me' },
  description: 'Affordable, verified shared rides and carpooling across Indore, Dewas, Ujjain and surrounding regions.',
  icons: [
    { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'icon', url: '/favicon.png', type: 'image/png' },
    { rel: 'shortcut icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/favicon.png' },
  ],
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ridewithme.app'),
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Ride With Me' },
  openGraph: {
    type: 'website',
    siteName: 'Ride With Me',
    title: 'Ride With Me — Shared Rides & Carpooling',
    description: 'Affordable, verified shared rides and carpooling across Indore, Dewas, Ujjain and surrounding regions.',
    images: [{ url: '/favicon.png', width: 1200, height: 630, alt: 'Ride With Me Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ride With Me — Shared Rides & Carpooling',
    description: 'Affordable, verified shared rides and carpooling across Indore, Dewas, Ujjain and surrounding regions.',
    images: ['/favicon.png'],
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><head><meta name="theme-color" content="#087c64" /><meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="default" /><meta name="apple-mobile-web-app-title" content="Ride With Me" /><link rel="icon" type="image/svg+xml" href="/favicon.svg" /><link rel="icon" type="image/png" href="/favicon.png" /><link rel="shortcut icon" href="/favicon.ico" /><link rel="apple-touch-icon" href="/favicon.png" /></head><body><Header />{children}<Footer /><script dangerouslySetInnerHTML={{ __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js').catch(function(e) { console.warn('SW registration failed:', e); }); }); }` }} /></body></html>; }
