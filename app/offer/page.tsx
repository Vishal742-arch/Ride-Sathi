'use client';
import { CalendarDays, Car, ChevronDown, CheckCircle2, MapPin, Plus, ShieldCheck, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Location = { id: string; name: string; city: string };

function LocationPicker({
  label,
  value,
  onSelect,
  exclude,
}: {
  label: string;
  value: Location | null;
  onSelect: (location: Location | null) => void;
  exclude?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!area.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      setStatus('');
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setResults(body.filter((item: Location) => item.id !== exclude));
        setStatus(body.length ? '' : 'No matching locations yet.');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setStatus('Connect Supabase to search location network.');
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, exclude]);

  return (
    <div className="location-picker" ref={area}>
      <span>{label}</span>
      <div className="find-input">
        <MapPin />
        <input
          value={value?.name ?? query}
          onFocus={() => {
            setOpen(true);
            if (value) setQuery(value.name);
          }}
          onChange={event => {
            onSelect(null);
            setQuery(event.target.value);
            setOpen(true);
          }}
          placeholder={label === 'FROM PICKUP' ? 'Select pickup zone' : 'Select destination zone'}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="clear-location"
            onClick={() => {
              onSelect(null);
              setQuery('');
              setOpen(false);
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>
      {open && query && (
        <div className="location-popover" role="listbox">
          {results.map(location => (
            <button
              type="button"
              role="option"
              key={location.id}
              onClick={() => {
                onSelect(location);
                setQuery('');
                setOpen(false);
              }}
            >
              <MapPin size={16} />
              <span>
                <b>{location.name}</b>
                <small>{location.city}</small>
              </span>
            </button>
          ))}
          {status && <p>{status}</p>}
        </div>
      )}
    </div>
  );
}

export default function OfferRide() {
  const [vehicle, setVehicle] = useState('CAR');
  const [from, setFrom] = useState<Location | null>(null);
  const [to, setTo] = useState<Location | null>(null);
  const [departureDate, setDepartureDate] = useState('');
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('80');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ rideId: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) {
      setErrorMessage('Please select both a pickup and destination location from the dropdown.');
      return;
    }
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/rides/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromLocation: from.name,
          toLocation: to.name,
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
          <form onSubmit={handleSubmit} className="find-card mt-6">
            <LocationPicker label="FROM PICKUP" value={from} onSelect={setFrom} exclude={to?.id} />
            <div className="finder-line" />
            <LocationPicker label="TO DESTINATION" value={to} onSelect={setTo} exclude={from?.id} />

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
                  🏍️ Bike
                </button>
                <button
                  type="button"
                  className={vehicle === 'CAR' ? 'selected' : ''}
                  onClick={() => setVehicle('CAR')}
                >
                  <Car size={18} /> Car
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
              <button
                type="button"
                className="ride-btn ride-btn-primary"
                onClick={() => {
                  setResult(null);
                  setFrom(null);
                  setTo(null);
                }}
              >
                Offer Another Ride
              </button>
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
