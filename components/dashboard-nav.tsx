'use client';
import Link from 'next/link';
import { Car, LayoutDashboard, MessageSquare, Repeat, Settings, ShieldCheck, UserCheck, UserRound } from 'lucide-react';

const items = [
  ['Overview', '/dashboard', LayoutDashboard],
  ['Find Rides', '/find', Car],
  ['Offer Ride', '/offer', Repeat],
  ['Trusted Partners', '/dashboard', UserCheck],
  ['Messages', '/find', MessageSquare],
  ['My Profile', '/dashboard', UserRound],
  ['Settings', '/dashboard', Settings],
] as const;

export function DashboardNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-emerald-100 bg-white py-3 shell">
      {items.map(([name, href, Icon]) => (
        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
          href={href}
          key={name}
        >
          <Icon size={16} className="text-emerald-600" />
          {name}
        </Link>
      ))}
      <Link
        className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition ml-auto"
        href="/rules"
      >
        <ShieldCheck size={16} className="text-emerald-600" />
        Safety Rules
      </Link>
    </nav>
  );
}
