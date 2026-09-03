import Link from 'next/link';
import { Calendar, Car, Shield, Star, Users, Repeat, UserCheck, Search, PlusCircle, ArrowRight } from 'lucide-react';

const stats = [
  ['Total Rides Completed', '14', Car],
  ['Trusted Partners', '3', UserCheck],
  ['Recurring Commutes', '2', Repeat],
  ['Commuter Rating', '4.9 ★', Star],
];

export default function Dashboard() {
  return (
    <main className="shell py-10">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-emerald-100 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">RIDE SATHI DASHBOARD</span>
          <h1 className="mt-2 text-3xl font-black text-slate-800">Good morning, Commuter 👋</h1>
          <p className="mt-1 text-slate-600">Manage your active commutes, recurring rides, and trusted partner connections.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/find" className="ride-btn ride-btn-primary">
            <Search size={16} className="mr-2" /> Find a Ride
          </Link>
          <Link href="/offer" className="ride-btn ride-btn-dark">
            <PlusCircle size={16} className="mr-2" /> Offer a Ride
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, val, IconComp]) => {
          const Icon = IconComp as typeof Car;
          return (
            <div className="card border border-emerald-100 bg-white p-5 rounded-2xl shadow-sm" key={label as string}>
              <div className="flex items-center justify-between">
                <Icon className="text-emerald-600" size={22} />
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">ACTIVE</span>
              </div>
              <b className="mt-4 block text-3xl font-extrabold text-slate-900">{val as string}</b>
              <p className="mt-1 text-xs font-semibold text-slate-500">{label as string}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Layout */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Active & Upcoming Rides */}
        <section className="card border border-emerald-100 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-lg text-slate-800">Upcoming & Active Commutes</h2>
              <p className="text-xs text-slate-500">Your scheduled journeys on Ride Sathi</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Indore - Dewas - Ujjain</span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">TODAY • 8:00 AM</span>
                <h3 className="mt-2 font-bold text-slate-900">Indore (Vijay Nagar) ➔ Ujjain (Mahakal)</h3>
                <p className="text-xs text-slate-600 mt-1">Driver: Rahul Sharma (✓ Verified) • ₹80/seat</p>
              </div>
              <Link href="/find" className="ride-btn ride-btn-primary text-xs py-2 px-4">
                View PIN & Chat <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-xs font-extrabold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">RECURRING • MON-FRI</span>
                <h3 className="mt-2 font-bold text-slate-900">Indore (Palasia) ➔ Dewas (BNP Campus)</h3>
                <p className="text-xs text-slate-600 mt-1">Driver: Priya Verma (✓ Verified) • ₹90/seat</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-white border border-slate-300 px-3 py-1 rounded-lg">Confirmed</span>
            </div>
          </div>
        </section>

        {/* Trusted Partners & Quick Actions */}
        <section className="card border border-emerald-100 bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-800">⭐ My Trusted Partners</h2>
            <p className="text-xs text-slate-500 mt-0.5">Repeat ride partners with contact privacy</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold grid place-items-center text-sm">RS</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Rahul Sharma</h4>
                    <p className="text-[11px] text-slate-500">12 rides together • Indore ➔ Ujjain</p>
                  </div>
                </div>
                <Link href="/find" className="text-xs font-bold text-emerald-700 hover:underline">
                  Book Again
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold grid place-items-center text-sm">PV</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Priya Verma</h4>
                    <p className="text-[11px] text-slate-500">7 rides together • Indore ➔ Dewas</p>
                  </div>
                </div>
                <Link href="/find" className="text-xs font-bold text-emerald-700 hover:underline">
                  Book Again
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <Shield size={16} className="text-emerald-600 flex-shrink-0" />
            <span>Phone numbers and personal contacts remain 100% hidden.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
