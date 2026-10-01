'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Car,
  Clock,
  CheckCircle2,
  MessageSquare,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  UserCheck,
  Building2,
  Activity,
  AlertCircle,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { formatPostedTime } from '@/lib/utils/format-posted-time';
import { DashboardLocationPicker } from '@/components/dashboard-location-picker';
import { DriverVerifyModal } from '@/components/driver-verify-modal';

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
  bookingOtp?: string;
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
  const dashDateInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingCommutes, setUpcomingCommutes] = useState<UpcomingCommute[]>([]);
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>([]);
  const [trustedDrivers, setTrustedDrivers] = useState<TrustedDriver[]>([]);
  const [verifiedPartners, setVerifiedPartners] = useState<VerifiedPartner[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [verifyingBooking, setVerifyingBooking] = useState<{ id: string; route: string } | null>(null);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => setNow(Date.now()), 60000);
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

  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  return (
    <main className="shell py-8 space-y-10">
      {/* 1. Dashboard Greeting & Quick Search Form */}
      <section className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">RIDE WITH ME</span>
            <h1 className="mt-1 text-3xl sm:text-4xl font-black text-slate-900">Your next ride starts here.</h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600">Find genuine rides from real commuters across Indore, Dewas & Ujjain.</p>
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
          <DashboardLocationPicker
            label="From"
            name="from"
            placeholder="Select pickup location"
            value={fromLocation}
            onChange={setFromLocation}
          />
          <DashboardLocationPicker
            label="To"
            name="to"
            placeholder="Select destination"
            value={toLocation}
            onChange={setToLocation}
          />
          <div
            onMouseEnter={() => { try { dashDateInputRef.current?.showPicker?.(); } catch {} }}
            onFocus={() => { try { dashDateInputRef.current?.showPicker?.(); } catch {} }}
          >
            <label className="block text-[10px] font-bold tracking-wider text-emerald-800 uppercase mb-1">Date</label>
            <input
              ref={dashDateInputRef}
              type="date"
              name="date"
              className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-600 text-slate-800 font-medium cursor-pointer"
              onClick={e => { try { (e.target as HTMLInputElement).showPicker?.(); } catch {} }}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-sm py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
              <Search size={16} /> Search Rides
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-4 py-2 rounded-xl">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
          <span>Real rides. 6-digit Boarding PIN verification. Transparent pricing.</span>
        </div>
      </section>

      {/* 2. Upcoming Commutes & Verification PINs */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Upcoming Commutes</h2>
          {upcomingCommutes.length > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">{upcomingCommutes.length} Active</span>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-sm">Loading commutes…</div>
        ) : upcomingCommutes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingCommutes.map(commute => (
              <div key={commute.id} className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{commute.origin} ➔ {commute.destination}</h3>
                    <p className="text-xs text-slate-500 mt-1">Departure: {commute.departureTime}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    commute.status === 'VERIFIED'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : commute.status === 'CANCELLED'
                      ? 'text-red-700 bg-red-50 border-red-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {commute.status === 'VERIFIED' ? '✓ Boarded & Verified' : commute.status === 'CANCELLED' ? 'Cancelled' : '✓ Confirmed'}
                  </span>
                </div>

                {/* Boarding Verification PIN Box */}
                {(commute.bookingOtp || commute.tripPin) && commute.status !== 'CANCELLED' && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-800 tracking-wider uppercase block">Boarding Verification PIN</span>
                      <span className="text-xl font-black text-slate-900 font-mono tracking-widest flex items-center gap-1.5 mt-0.5">
                        <KeyRound size={16} className="text-emerald-600" /> {commute.bookingOtp || commute.tripPin}
                      </span>
                    </div>
                    <button
                      onClick={() => setVerifyingBooking({ id: commute.id, route: `${commute.origin} ➔ ${commute.destination}` })}
                      className="text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded-lg transition"
                    >
                      Driver Verify
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <span>🚗 {commute.vehicle} • ₹{commute.fareAmount} ({commute.seats} {commute.seats === 1 ? 'seat' : 'seats'})</span>
                  <Link href={`/find?booking=${commute.id}`} className="text-xs font-bold text-emerald-700 hover:underline">
                    View Details →
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
          <div className="grid gap-4 sm:grid-cols-2">
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
                      {ride.driver.rating ? `⭐ ${ride.driver.rating.toFixed(1)}` : 'New Driver'}
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
                    <Link href={`/find?from=${encodeURIComponent(ride.origin)}&to=${encodeURIComponent(ride.destination)}`} className="ride-btn ride-btn-primary text-xs py-2 px-3 flex-1 text-center">
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

      {/* Driver Verification Modal Popup */}
      {verifyingBooking && (
        <DriverVerifyModal
          bookingId={verifyingBooking.id}
          routeText={verifyingBooking.route}
          onClose={() => setVerifyingBooking(null)}
          onSuccess={() => fetchDashboardData()}
        />
      )}
    </main>
  );
}
