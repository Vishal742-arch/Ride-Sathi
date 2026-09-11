'use client';
import { CalendarDays, Car, ChevronDown, CheckCircle2, MapPin, Plus, ShieldCheck, Users, X, Route } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RouteLocationPicker } from '@/components/route-location-picker';
import { LocationPoint, RouteInfo, FareCalculation, calculateRoadRoute, calculateFare } from '@/lib/location-service';

export default function OfferRide() {
  const [vehicle, setVehicle] = useState<'BIKE' | 'CAR'>('CAR');
  const [from, setFrom] = useState<LocationPoint | null>(null);
  const [to, setTo] = useState<LocationPoint | null>(null);

  // Route & price calculation state
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [fareInfo, setFareInfo] = useState<FareCalculation | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const [departureDate, setDepartureDate] = useState('');
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('80');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ rideId: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Update route info and suggested price when locations or vehicle change
  useEffect(() => {
    if (!from || !to) {
      setRouteInfo(null);
      setFareInfo(null);
      return;
    }

    async function updateRoute() {
      setRouteLoading(true);
      try {
        const info = await calculateRoadRoute(from!, to!);
        const fare = calculateFare(info.distanceKm, vehicle);
        setRouteInfo(info);
        setFareInfo(fare);
        setPrice(String(Math.round(fare.fareAmount)));
      } catch (err) {
        console.error('Route calculation error:', err);
      } finally {
        setRouteLoading(false);
      }
    }

    updateRoute();
  }, [from, to, vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) {
      setErrorMessage('Please select both a pickup and destination location.');
      return;
    }
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/rides/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromLocation: from.placeName,
          toLocation: to.placeName,
          pickupLatitude: from.latitude,
          pickupLongitude: from.longitude,
          dropLatitude: to.latitude,
          dropLongitude: to.longitude,
          distanceKm: routeInfo?.distanceKm,
          departureTime: departureDate || new Date().toISOString(),
          vehicleKind: vehicle,
          seatsAvailable: Number(seats),
          pricePerSeat: Number(price),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ rideId: data.rideId, message: data.message });
      } else {
        setErrorMessage(data.error || 'Failed to offer ride');
      }
    } catch {
      setErrorMessage('Network error publishing ride.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="finder-page">
      <section className="shell finder">
        <span className="kicker font-bold tracking-wider text-emerald-700">DRIVER SPACE • RIDE SATHI</span>
        <h1 className="text-4xl font-extrabold text-slate-900 mt-1">Offer a Ride</h1>
        <p className="text-slate-600 mt-2">
          Publish your empty seats for commuters in Indore, Dewas, and Ujjain. Your contact information remains 100% private.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="find-card mt-6" style={{ gap: 20 }}>
            {/* Route Location Picker & Interactive Leaflet Map */}
            <RouteLocationPicker
              pickup={from}
              drop={to}
              onPickupChange={setFrom}
              onDropChange={setTo}
              polylineCoords={routeInfo?.polylineCoords || []}
              routeLoading={routeLoading}
            />

            {/* Calculated Road Distance & Recommended Price */}
            {from && to && routeInfo && fareInfo && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 16, padding: 14, display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Route size={16} /> ROUTE DISTANCE & SUGGESTED SEAT RATE
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, background: '#fff', padding: 12, borderRadius: 12, border: '1px solid #dcfce7' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>ROAD DISTANCE</span>
                    <strong style={{ fontSize: 15, color: '#0f172a' }}>{routeInfo.formattedDistance}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>ESTIMATED TIME</span>
                    <strong style={{ fontSize: 15, color: '#0f172a' }}>{routeInfo.formattedDuration}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>SUGGESTED PRICE</span>
                    <strong style={{ fontSize: 16, color: '#087c64', fontWeight: 900 }}>₹{fareInfo.fareAmount} / seat</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="find-options">
              <label>
                <span>DEPARTURE DATE & TIME</span>
                <div className="find-input">
                  <CalendarDays />
                  <input
                    type="datetime-local"
                    value={departureDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    required
                  />
                </div>
              </label>
              <label>
                <span>AVAILABLE SEATS</span>
                <div className="find-input">
                  <Users />
                  <select value={seats} onChange={e => setSeats(e.target.value)}>
                    <option value="1">1 Seat</option>
                    <option value="2">2 Seats</option>
                    <option value="3">3 Seats</option>
                    <option value="4">4 Seats</option>
                  </select>
                  <ChevronDown size={15} />
                </div>
              </label>
            </div>

            <div className="mt-4">
              <label>
                <span>PRICE PER SEAT (₹)</span>
                <div className="find-input">
                  <span className="font-extrabold text-emerald-700">₹</span>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                  />
                </div>
              </label>
            </div>

            <fieldset className="mt-4">
              <legend>VEHICLE TYPE</legend>
              <div className="vehicle-options">
                <button
                  type="button"
                  className={vehicle === 'BIKE' ? 'selected' : ''}
                  onClick={() => setVehicle('BIKE')}
                >
                  🏍️ Bike (₹2.5/km)
                </button>
                <button
                  type="button"
                  className={vehicle === 'CAR' ? 'selected' : ''}
                  onClick={() => setVehicle('CAR')}
                >
                  <Car size={18} /> Car (₹4.5/km)
                </button>
              </div>
            </fieldset>

            <button type="submit" className="search-button cursor-pointer" disabled={loading}>
              <Plus size={18} /> {loading ? 'Publishing Ride...' : 'Publish Offered Ride'}
            </button>

            {errorMessage && <p className="form-note text-red-600 font-semibold">{errorMessage}</p>}
          </form>
        ) : (
          <div className="find-card mt-6 text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Ride Offered Successfully!</h2>
            <p className="text-slate-600 mt-2 max-w-md mx-auto">{result.message}</p>
            <div className="mt-6 flex justify-center gap-4">
              <a href={`/find?ride=${result.rideId}`} className="ride-btn ride-btn-primary">
                View & Test Payment Checkout
              </a>
              <a href="/dashboard" className="ride-btn ride-btn-dark">
                View My Dashboard
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
          <ShieldCheck size={20} className="text-emerald-700 flex-shrink-0" />
          <span>Ride Sathi Contact Privacy Shield is enabled. Your personal phone number and email remain completely hidden.</span>
        </div>
      </section>
    </main>
  );
}
