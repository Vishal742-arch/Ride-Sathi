import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
export const metadata: Metadata = { title: { default: 'Promova — Get discovered. Get promoted. Grow.', template: '%s | Promova' }, description: 'A premium platform for creators to promote content and grow their audience.', openGraph: { title: 'Promova', description: 'Get discovered. Get promoted. Grow.', type: 'website' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Header />{children}</body></html>; }
