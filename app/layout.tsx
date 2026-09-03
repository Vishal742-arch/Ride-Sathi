import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
export const metadata: Metadata = { title: { default: 'Ride With Me — Share the journey', template: '%s | Ride With Me' }, description: 'Affordable verified shared rides across Indore, Dewas and nearby cities.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Header />{children}<Footer /></body></html>; }
