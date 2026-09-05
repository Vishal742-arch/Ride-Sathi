'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Car,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  Building2,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { formatPostedTime } from '@/lib/utils/format-posted-time';

interface UpcomingCommute {
  id: string;
  rideId: string;
  origin: string;
  destination: string;
  departureTime: string;
  vehicle: string;
  fareAmount: number;
  seats: number;
  status: string;
  tripPin?: string;
}

interface AvailableRide {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  postedAt: string;
  pricePerSeat: number;
  vehicle: string;
  availableSeats: number;
  driver: {
    name: string;
    rating: number | null;
    completedRides: number;
    isPhoneVerified: boolean;
    isIdentityVerified: boolean;
    isDriverVerified: boolean;
  };
}

interface TrustedDriver {
  id: string;
  name: string;
  rating: number | null;
  completedRides: number;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  isDriverVerified: boolean;
}

interface VerifiedPartner {
  id: string;
  name: string;
  category?: string;
}

interface RecentActivityItem {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [upcomingCommutes, setUpcomingCommutes] = useState<UpcomingCommute[]>([]);
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>([]);
  const [trustedDrivers, setTrustedDrivers] = useState<TrustedDriver[]>([]);
  const [verifiedPartners, setVerifiedPartners] = useState<VerifiedPartner[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    fetchDashboardData();

    // Live runtime ticker for relative timestamps
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/data');
      if (res.ok) {
        const data = await res.json();
        setUpcomingCommutes(data.upcomingCommutes || []);
        setAvailableRides(data.availableRides || []);
        setTrustedDrivers(data.trustedDrivers || []);
        setVerifiedPartners(data.verifiedPartners || []);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (e) {
      console.warn('[Dashboard] Data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shell py-8 space-y-10">
      {/* 1. Dashboard Greeting & Search Form */}
      <section className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">RIDE WITH ME</span>
            <h1 className="mt-1 text-3xl sm:text-4xl font-black text-slate-900">Your next ride starts here.</h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600">Find genuine rides from real people traveling your way.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/find" className="ride-btn ride-btn-primary">
              <Search size={16} /> Find a Ride
            </Link>
            <Link href="/offer" className="ride-btn ride-btn-dark">
              <PlusCircle size={16} /> Offer a Ride
            </Link>
          </div>
        </div>

        {/* Inline Quick Search Form */}
        <form action="/find" method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-emerald-800 uppercase mb-1">From</label>
            <input type="text" name="from" placeholder="Select pickup location" className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-600 text-slate-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-emerald-800 uppercase mb-1">To</label>
            <input type="text" name="to" placeholder="Select destination" className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-600 text-slate-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-emerald-800 uppercase mb-1">Date</label>
            <input type="date" name="date" className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-600 text-slate-800" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-sm py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2">
              <Search size={16} /> Find Available Rides
            </button>
          </div>
        </form>

        {/* Transparency note */}
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-4 py-2 rounded-xl">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
          <span>Real rides. Verified people. Safer journeys.</span>
        </div>
      </section>

      {/* 2. Upcoming Commutes */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Upcoming Commutes</h2>
          {upcomingCommutes.length > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">{upcomingCommutes.length} Confirmed</span>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-sm">Loading commutes…</div>
        ) : upcomingCommutes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingCommutes.map(commute => (
              <div key={commute.id} className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{commute.origin} ➔ {commute.destination}</h3>
                    <p className="text-xs text-slate-500 mt-1">Departure: {commute.departureTime}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    ✓ Booking Confirmed
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <span>🚗 {commute.vehicle} • ₹{commute.fareAmount} ({commute.seats} {commute.seats === 1 ? 'seat' : 'seats'})</span>
                  <Link href={`/find?booking=${commute.id}`} className="text-xs font-bold text-emerald-700 hover:underline">
                    View Ride →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <Car size={32} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-slate-800 text-base">You don't have any upcoming commutes yet.</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">Find a ride or offer your own ride to start traveling with verified commuters.</p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/find" className="ride-btn ride-btn-primary text-xs py-2 px-4">
                <Search size={14} /> Find a Ride
              </Link>
              <Link href="/offer" className="ride-btn ride-btn-dark text-xs py-2 px-4">
                <PlusCircle size={14} /> Offer a Ride
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 3. Available Rides Near You */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Available Rides Near You</h2>
          <span className="text-xs font-semibold text-slate-500">Real active database listings</span>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-sm">Loading available rides…</div>
        ) : availableRides.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {availableRides.map(ride => (
              <div key={ride.id} className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-300 transition">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">{ride.origin} ➔ {ride.destination}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>🕐 Departure: {ride.departureTime}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                    <Clock size={12} className="text-emerald-600" /> {formatPostedTime(ride.postedAt)}
                  </span>
                </div>

                <div className="flex flex-wrap justify-between items-center text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl">
                  <span>₹{ride.pricePerSeat}/seat • {ride.vehicle}</span>
                  {ride.availableSeats > 0 ? (
                    <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">🟢 {ride.availableSeats} seats left</span>
                  ) : (
                    <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">Fully Booked</span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                  <div>
                    <strong className="block text-slate-800 font-bold">{ride.driver.name}</strong>
                    <span className="text-slate-500 text-[11px]">
                      {ride.driver.rating ? `⭐ ${ride.driver.rating.toFixed(1)}` : 'New Driver'} • {ride.driver.completedRides > 0 ? `${ride.driver.completedRides} completed rides` : 'No completed rides yet'}
                    </span>
                  </div>
                  {ride.driver.isDriverVerified && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Verified Driver
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {ride.availableSeats > 0 ? (
                    <Link href={`/find?ride=${ride.id}`} className="ride-btn ride-btn-primary text-xs py-2 px-3 flex-1 text-center">
                      ⚡ Book Seat • ₹{ride.pricePerSeat}
                    </Link>
                  ) : (
                    <button disabled className="ride-btn bg-slate-200 text-slate-500 text-xs py-2 px-3 flex-1 cursor-not-allowed">
                      Fully Booked
                    </button>
                  )}
                  <Link href="/find" className="ride-btn ride-btn-light text-xs p-2">
                    <MessageSquare size={16} />
                  </Link>
                  <Link href="/find" className="ride-btn ride-btn-light text-xs p-2">
                    <Phone size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <AlertCircle size={32} className="mx-auto text-amber-500" />
            <h3 className="font-bold text-slate-800 text-base">No rides available right now.</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">There are currently no genuine rides matching your search. Try changing your date, route, or filters.</p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/find" className="ride-btn ride-btn-primary text-xs py-2 px-4">
                Search Again
              </Link>
              <Link href="/offer" className="ride-btn ride-btn-dark text-xs py-2 px-4">
                Offer a Ride
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 4. Trusted Drivers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Trusted Drivers</h2>
        {loading ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-sm">Loading trusted drivers…</div>
        ) : trustedDrivers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {trustedDrivers.map(driver => (
              <div key={driver.id} className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold grid place-items-center text-sm">
                    {driver.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{driver.name}</h3>
                    <p className="text-xs text-slate-500">
                      {driver.rating ? `⭐ ${driver.rating.toFixed(1)}` : 'New Driver'} • {driver.completedRides > 0 ? `${driver.completedRides} completed rides` : 'No completed rides yet'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                  {driver.isPhoneVerified && <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Phone Verified</div>}
                  {driver.isIdentityVerified && <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Identity Verified</div>}
                  {driver.isDriverVerified && <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Driver Verified</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <UserCheck size={28} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">No verified drivers to show yet.</h3>
            <p className="text-xs text-slate-500">Verified drivers will appear here as they join Ride With Me.</p>
          </div>
        )}
      </section>

      {/* 5. Verified Partners */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Verified Partners</h2>
        {verifiedPartners.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {verifiedPartners.map(partner => (
              <div key={partner.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <Building2 size={24} className="text-emerald-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{partner.name}</h3>
                  <span className="text-[11px] text-slate-500">{partner.category || 'Organization Partner'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <Building2 size={28} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">No verified partners yet.</h3>
            <p className="text-xs text-slate-500">Institutional and business partner connections will be displayed here.</p>
          </div>
        )}
      </section>

      {/* 6. Recent Activity */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
            {recentActivity.map(act => (
              <div key={act.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-emerald-600" />
                  <span className="font-semibold text-slate-800">{act.description}</span>
                </div>
                <span className="text-slate-400 font-mono">{act.created_at}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <Activity size={28} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">No recent activity</h3>
            <p className="text-xs text-slate-500">Your bookings and ride activity will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
