'use client';
import { CalendarDays, Car, ChevronDown, Clock, MapPin, MessageSquare, Navigation, Phone, Search, ShieldCheck, Users, X, Info, Route, AlertCircle } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RideChat } from '@/components/ride-chat';
import { RideBookingModal } from '@/components/ride-booking-modal';
import { RouteLocationPicker } from '@/components/route-location-picker';
import { LocationPoint, RouteInfo, FareCalculation, calculateRoadRoute, calculateFare, resolveLocationString } from '@/lib/location-service';
import { formatPostedTime } from '@/lib/utils/format-posted-time';

type RideItem = {
  id: string;
  driver_name: string;
  driver_rating: number;
  vehicle: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  is_verified: boolean;
  postedAt?: string;
  created_at?: string;
};

function FindRideContent() {
  const searchParams = useSearchParams();
  const [vehicle, setVehicle] = useState<'BIKE' | 'CAR'>('CAR');
  const [message, setMessage] = useState('');
  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [drop, setDrop] = useState<LocationPoint | null>(null);
  const [travelDate, setTravelDate] = useState('');

  // Route & Fare calculation state
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [fareInfo, setFareInfo] = useState<FareCalculation | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const [activeChatRideId, setActiveChatRideId] = useState<string | null>(null);
  const [bookingRide, setBookingRide] = useState<RideItem | null>(null);
  const [rides, setRides] = useState<RideItem[]>([]);
  const [, setNow] = useState(Date.now());

  // Handle incoming query params (from, to, date)
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const dateParam = searchParams.get('date');

    if (dateParam) {
      setTravelDate(dateParam);
    }

    async function initFromParams() {
      let pPoint: LocationPoint | null = null;
      let dPoint: LocationPoint | null = null;

      if (fromParam) {
        pPoint = await resolveLocationString(fromParam);
        if (pPoint) setPickup(pPoint);
      }
      if (toParam) {
        dPoint = await resolveLocationString(toParam);
        if (dPoint) setDrop(dPoint);
      }

      fetchRides(fromParam || '', toParam || '');
      if (fromParam && toParam) {
        setMessage(`Showing matches from ${fromParam} to ${toParam}.`);
      }
    }

    initFromParams();

    // Live runtime ticker for relative timestamps
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, [searchParams]);

  // Recalculate route & fare whenever pickup, drop or vehicle type changes
  useEffect(() => {
    if (!pickup || !drop) {
      setRouteInfo(null);
      setFareInfo(null);
      return;
    }

    async function updateRoute() {
      setRouteLoading(true);
      try {
        const info = await calculateRoadRoute(pickup!, drop!);
        const fare = calculateFare(info.distanceKm, vehicle);
        setRouteInfo(info);
        setFareInfo(fare);
      } catch (err) {
        console.error('Route calculation error:', err);
      } finally {
        setRouteLoading(false);
      }
    }

    updateRoute();
  }, [pickup, drop, vehicle]);

  const fetchRides = async (fromQuery?: string, toQuery?: string) => {
    try {
      const url = `/api/rides/search?from=${encodeURIComponent(fromQuery || '')}&to=${encodeURIComponent(toQuery || '')}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.rides) setRides(data.rides);
    } catch {
      // Fallback handled by API
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !drop) {
      setMessage('Please select both a pickup location and destination.');
      return;
    }
    setMessage(`Showing matches from ${pickup.placeName} to ${drop.placeName}.`);
    fetchRides(pickup.placeName, drop.placeName);
  };

  return (
    <main className="finder-page">
      <section className="shell finder">
        <span className="kicker">RIDE SATHI CARPOOLING</span>
        <h1>Find a ride</h1>
        <p>Choose your pickup and destination. Search across Indore, Dewas, and Ujjain location network. Pay the driver directly after your ride.</p>

        <form onSubmit={handleSearch} className="find-card" style={{ gap: 20 }}>
          {/* Dual Location & Interactive Route Map Component */}
          <RouteLocationPicker
            pickup={pickup}
            drop={drop}
            onPickupChange={setPickup}
            onDropChange={setDrop}
            polylineCoords={routeInfo?.polylineCoords || []}
            routeLoading={routeLoading}
          />

          {/* Road Distance, ETA & Estimated Fare Card */}
          {pickup && drop && (
            <div className="route-calculation-breakdown" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 16, padding: 16, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Route size={16} /> ROUTE & FARE ESTIMATE
                </span>
                {routeLoading && <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>Calculating road route...</span>}
              </div>

              {routeInfo && fareInfo && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #dcfce7' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>ROAD DISTANCE</span>
                    <strong style={{ fontSize: 15, color: '#0f172a' }}>{routeInfo.formattedDistance}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>ESTIMATED TIME</span>
                    <strong style={{ fontSize: 15, color: '#0f172a' }}>{routeInfo.formattedDuration}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>ESTIMATED FARE</span>
                    <strong style={{ fontSize: 16, color: '#087c64', fontWeight: 900 }}>{fareInfo.formattedFare}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>MODE</span>
                    <strong style={{ fontSize: 13, color: routeInfo.isIntercity ? '#c2410c' : '#047857' }}>
                      {routeInfo.isIntercity ? 'Intercity Trip' : 'Local City Trip'}
                    </strong>
                  </div>
                </div>
              )}

              {!routeInfo?.serviceAreaValid && (
                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '8px 12px', borderRadius: 10, fontSize: 12, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} />
                  <span>This location is currently outside the core Indore/Dewas/Ujjain service area. Intercity corridors are supported.</span>
                </div>
              )}
            </div>
          )}

          <div className="find-options">
            <label><span>DATE</span><div className="find-input"><CalendarDays/><input type="date" aria-label="Travel date" value={travelDate} onChange={e => setTravelDate(e.target.value)} /></div></label>
            <label><span>PASSENGERS</span><div className="find-input"><Users/><select aria-label="Passengers" defaultValue="1"><option>1</option><option>2</option><option>3</option></select><ChevronDown size={15}/></div></label>
          </div>

          <fieldset><legend>VEHICLE</legend><div className="vehicle-options"><button type="button" className={vehicle==='BIKE'?'selected':''} onClick={()=>setVehicle('BIKE')}>🏍️ Bike (₹2.5/km)</button><button type="button" className={vehicle==='CAR'?'selected':''} onClick={()=>setVehicle('CAR')}><Car size={18}/> Car (₹4.5/km)</button></div></fieldset>

          <button className="search-button"><Search size={18}/> Find available rides</button>
          {message&&<p className="form-note" role="status">{message}</p>}
        </form>

        <div className="featured-rides-preview">
          <div className="preview-heading">
            <h2>Available Live Commutes</h2>
            <span className="privacy-chip"><ShieldCheck size={14}/> Phone Numbers Protected</span>
          </div>

          {rides.length === 0 ? (
            <div style={{ background: '#fff', border: '1px dashed #cbd5e1', padding: '32px 20px', borderRadius: 16, textAlign: 'center', margin: '20px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Car size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#334155', margin: '0 0 6px' }}>No upcoming rides available yet</h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Be the first to offer a ride or check back soon for new commuters.</p>
            </div>
          ) : (
            rides.map(ride => (
              <div key={ride.id} className="ride-card-item">
                <div className="ride-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, width: '100%' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <h3>{ride.origin} ➔ {ride.destination}</h3>
                    <p>Departure: {ride.departure_time} • ₹{ride.price_per_seat}/seat • {ride.vehicle}</p>
                  </div>
                  <div className="ride-header-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#617d72', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0f7f4', padding: '3px 8px', borderRadius: 8, border: '1px solid #dcece2', whiteSpace: 'nowrap' }}>
                      <Clock size={12} style={{ color: '#087c64' }} /> {formatPostedTime(ride.postedAt || ride.created_at || '')}
                    </span>
                    <span className="driver-verified-tag">✓ {ride.driver_name} ({ride.driver_rating} ★)</span>
                  </div>
                </div>
                <div className="ride-actions">
                  <button className="ride-btn ride-btn-primary" onClick={() => setBookingRide(ride)}>
                    ⚡ Book Ride
                  </button>
                  <button className="ride-btn ride-btn-light" onClick={() => setActiveChatRideId(ride.id)}>
                    <MessageSquare size={16}/> In-App Chat
                  </button>
                  <button className="ride-btn ride-btn-light" onClick={() => setActiveChatRideId(ride.id)}>
                    <Phone size={16}/> Privacy Call
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {bookingRide && (
        <RideBookingModal ride={bookingRide} onClose={() => setBookingRide(null)} />
      )}

      {activeChatRideId && (
        <RideChat
          rideId={activeChatRideId}
          driverName="Rahul Sharma"
          driverRole="Verified Driver"
          isVerified={true}
          onClose={() => setActiveChatRideId(null)}
        />
      )}
    </main>
  );
}

export default function FindRide() {
  return (
    <Suspense fallback={
      <div className="shell finder" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p>Loading ride search...</p>
      </div>
    }>
      <FindRideContent />
    </Suspense>
  );
}

