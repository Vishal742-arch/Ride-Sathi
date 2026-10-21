'use client';
import { CalendarDays, Car, ChevronDown, CheckCircle2, MapPin, Plus, ShieldCheck, Users, X, Route } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { RouteLocationPicker } from '@/components/route-location-picker';
import { LocationPoint, RouteInfo, FareCalculation, calculateRoadRoute, calculateFare } from '@/lib/location-service';

import { trackEvent } from '@/lib/analytics';
import { PageViewTracker } from '@/components/analytics-tracker';

export default function OfferRide() {
  const dateInputRef = useRef<HTMLInputElement>(null);
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

  const handleVehicleChange = (newVehicle: 'BIKE' | 'CAR') => {
    setVehicle(newVehicle);
    const newSeats = newVehicle === 'BIKE' ? '1' : (seats === '1' ? '3' : seats);
    setSeats(newSeats);
    if (from && to && routeInfo) {
      const fare = calculateFare(routeInfo.distanceKm, newVehicle, Number(newSeats));
      setFareInfo(fare);
      setPrice(String(Math.round(fare.perSeatFare)));
    }
  };

  const handleSeatsChange = (newSeats: string) => {
    setSeats(newSeats);
    if (routeInfo) {
      const fare = calculateFare(routeInfo.distanceKm, vehicle, Number(newSeats));
      setFareInfo(fare);
    }
  };

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
        const currentSeats = vehicle === 'BIKE' ? 1 : (Number(seats) || 1);
        const fare = calculateFare(info.distanceKm, vehicle, currentSeats);
        setRouteInfo(info);
        setFareInfo(fare);
        setPrice(String(Math.round(fare.perSeatFare)));
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

    trackEvent('offer_ride_started', {
      origin_city: from.city || from.placeName,
      destination_city: to.city || to.placeName,
      vehicle_type: vehicle.toLowerCase(),
      number_of_seats: Number(seats),
    });

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
        trackEvent('offer_ride_completed', {
          origin_city: from.city || from.placeName,
          destination_city: to.city || to.placeName,
          vehicle_type: vehicle.toLowerCase(),
          number_of_seats: Number(seats),
        });
        trackEvent('ride_posted', {
          origin_city: from.city || from.placeName,
          destination_city: to.city || to.placeName,
          vehicle_type: vehicle.toLowerCase(),
          number_of_seats: Number(seats),
        });
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
      <PageViewTracker pageName="offer_ride" />
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Route size={16} /> ROUTE DISTANCE & SUGGESTED FARE RATE
                  </span>
                  <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                    {vehicle === 'BIKE' ? '🏍️ ₹2.5/km (Bike max 1 seat)' : '🚗 ₹4.5/km (Car per-seat rate)'}
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
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>SUGGESTED / SEAT</span>
                    <strong style={{ fontSize: 16, color: '#087c64', fontWeight: 900 }}>₹{fareInfo.perSeatFare} / seat</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>
                      TOTAL TRIP FARE ({seats} {Number(seats) === 1 ? 'SEAT' : 'SEATS'})
                    </span>
                    <strong style={{ fontSize: 16, color: '#047857', fontWeight: 900 }}>
                      ₹{Math.round(fareInfo.perSeatFare * Number(seats))}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="find-options">
              <label>
                <span>DEPARTURE DATE & TIME</span>
                <div
                  className="find-input cursor-pointer"
                  onMouseEnter={() => { try { dateInputRef.current?.showPicker?.(); } catch {} }}
                  onFocus={() => { try { dateInputRef.current?.showPicker?.(); } catch {} }}
                >
                  <CalendarDays />
                  <input
                    ref={dateInputRef}
                    type="datetime-local"
                    value={departureDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    onClick={e => { try { (e.target as HTMLInputElement).showPicker?.(); } catch {} }}
                    required
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </label>
              <label>
                <span>AVAILABLE SEATS</span>
                <div className="find-input">
                  <Users />
                  <select
                    value={seats}
                    onChange={e => handleSeatsChange(e.target.value)}
                    disabled={vehicle === 'BIKE'}
                  >
                    <option value="1">1 Seat {vehicle === 'BIKE' ? '(Bike Max)' : ''}</option>
                    {vehicle !== 'BIKE' && (
                      <>
                        <option value="2">2 Seats</option>
                        <option value="3">3 Seats</option>
                        <option value="4">4 Seats</option>
                      </>
                    )}
                  </select>
                  <ChevronDown size={15} />
                </div>
                {vehicle === 'BIKE' ? (
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                    🏍️ Bike rides only allow 1 passenger seat for safety and compliance.
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Offering {seats} seats • Total fare: ₹{Math.round((Number(price) || 0) * Number(seats))}
                  </span>
                )}
              </label>
            </div>

            <div className="mt-4">
              <label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
                  <span>PRICE PER SEAT (₹)</span>
                  <span style={{ fontSize: 12, color: '#087c64', fontWeight: 700 }}>
                    {Number(seats) > 1
                      ? `Total Potential: ₹${Math.round((Number(price) || 0) * Number(seats))} (${seats} seats × ₹${price || 0})`
                      : `Total Potential: ₹${price || 0} (1 seat)`}
                  </span>
                </div>
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
                  onClick={() => handleVehicleChange('BIKE')}
                >
                  🏍️ Bike (₹2.5/km • 1 Seat)
                </button>
                <button
                  type="button"
                  className={vehicle === 'CAR' ? 'selected' : ''}
                  onClick={() => handleVehicleChange('CAR')}
                >
                  <Car size={18} /> Car (₹4.5/km • Up to 4 Seats)
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
                View Listed Ride
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
