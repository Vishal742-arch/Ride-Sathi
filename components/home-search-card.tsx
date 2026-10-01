'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, X, ArrowRight, Search, Calendar } from 'lucide-react';
import { PassengerSelector } from '@/components/passenger-selector';
import {
  LocationPoint,
  POPULAR_LOCATIONS,
  getCurrentGPSLocation,
  searchLocations,
} from '@/lib/location-service';
import { trackEvent } from '@/lib/analytics';

interface HomeSearchCardProps {
  initialFrom?: string;
  initialTo?: string;
}

export function HomeSearchCard({ initialFrom, initialTo }: HomeSearchCardProps) {
  const router = useRouter();

  const [from, setFrom] = useState<LocationPoint | null>(null);
  const [to, setTo] = useState<LocationPoint | null>(null);
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const [fromQuery, setFromQuery] = useState('');
  const [fromResults, setFromResults] = useState<LocationPoint[]>([]);
  const [fromOpen, setFromOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [toQuery, setToQuery] = useState('');
  const [toResults, setToResults] = useState<LocationPoint[]>([]);
  const [toOpen, setToOpen] = useState(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Popular locations presets
  const popularPresets = POPULAR_LOCATIONS.slice(0, 8);

  // Handle external route preset updates
  useEffect(() => {
    if (initialFrom) {
      const matched = POPULAR_LOCATIONS.find(p => p.placeName.toLowerCase().includes(initialFrom.toLowerCase()) || p.city.toLowerCase() === initialFrom.toLowerCase());
      if (matched) { setFrom(matched); setFromQuery(''); }
      else { setFromQuery(initialFrom); }
    }
    if (initialTo) {
      const matched = POPULAR_LOCATIONS.find(p => p.placeName.toLowerCase().includes(initialTo.toLowerCase()) || p.city.toLowerCase() === initialTo.toLowerCase());
      if (matched) { setTo(matched); setToQuery(''); }
      else { setToQuery(initialTo); }
    }
  }, [initialFrom, initialTo]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setFromOpen(false);
      if (toRef.current && !toRef.current.contains(e.target as Node)) setToOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search debounce — From
  useEffect(() => {
    if (!fromQuery.trim() || !fromOpen) { setFromResults([]); return; }
    const t = setTimeout(async () => setFromResults(await searchLocations(fromQuery)), 220);
    return () => clearTimeout(t);
  }, [fromQuery, fromOpen]);

  // Search debounce — To
  useEffect(() => {
    if (!toQuery.trim() || !toOpen) { setToResults([]); return; }
    const t = setTimeout(async () => setToResults(await searchLocations(toQuery)), 220);
    return () => clearTimeout(t);
  }, [toQuery, toOpen]);

  const handleGPS = async () => {
    setGpsLoading(true);
    const res = await getCurrentGPSLocation();
    setGpsLoading(false);
    if (res.location) { setFrom(res.location); setFromQuery(''); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('find_ride_clicked');
    trackEvent('ride_search_started', {
      origin_city: from?.city || from?.placeName || fromQuery,
      destination_city: to?.city || to?.placeName || toQuery,
      trip_type: from?.city && to?.city && from.city !== to.city ? 'intercity' : 'local',
    });
    const params = new URLSearchParams();
    if (from) params.set('from', from.placeName);
    else if (fromQuery) params.set('from', fromQuery);

    if (to) params.set('to', to.placeName);
    else if (toQuery) params.set('to', toQuery);

    if (date) params.set('date', date);
    if (passengers > 1) params.set('seats', String(passengers));
    router.push(`/find?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="route-card" style={{ padding: '24px 26px', display: 'grid', gap: 16 }}>
      {/* Header */}
      <div className="route-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#163d32', letterSpacing: '-0.02em' }}>
          Where are you going?
        </h3>
        <div className="people" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: 20, color: '#087c64', fontWeight: 700, fontSize: 11 }}>
          <Search size={12} /> Find available rides
        </div>
      </div>

      {/* FROM field */}
      <div ref={fromRef} style={{ position: 'relative' }}>
        <small style={{ display: 'block', color: '#087c64', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 5 }}>PICKUP LOCATION</small>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          {/* Input */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            border: '1.5px solid', borderColor: fromOpen ? '#087c64' : '#dbe8e0',
            borderRadius: 14, padding: '0 14px', minHeight: 48, background: '#fff',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}>
            <span className="pin pin-from" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={from ? from.placeName : fromQuery}
              onFocus={() => { setFromOpen(true); if (from) setFromQuery(from.placeName); }}
              onChange={e => { setFrom(null); setFromQuery(e.target.value); setFromOpen(true); }}
              placeholder="Search pickup area or landmark..."
              autoComplete="off"
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 14, color: '#244d41', fontWeight: 600 }}
            />
            {from && (
              <button type="button" onClick={() => { setFrom(null); setFromQuery(''); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, padding: 0 }}>
                <X size={15} />
              </button>
            )}
          </div>

          {/* GPS Button */}
          <button
            type="button" onClick={handleGPS} disabled={gpsLoading}
            title="Use my current location"
            style={{
              background: '#e6f7ef', border: '1.5px solid #bce6d3', borderRadius: 14,
              padding: '0 14px', fontSize: 12, fontWeight: 700, color: '#087c64',
              display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <Navigation size={14} style={{ animation: gpsLoading ? 'spin 1s linear infinite' : 'none' }} />
            {gpsLoading ? '...' : '📍 My Location'}
          </button>
        </div>

        {/* From dropdown */}
        {fromOpen && (fromQuery || !from) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
            background: '#fff', borderRadius: 14, marginTop: 4,
            boxShadow: '0 12px 36px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0',
            maxHeight: 260, overflowY: 'auto',
          }}>
            {!fromQuery.trim() && (
              <div>
                <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.07em' }}>
                  ⭐ POPULAR SUGGESTED LOCATIONS
                </div>
                {popularPresets.map((loc, i) => (
                  <button key={i} type="button"
                    onClick={() => { setFrom(loc); setFromQuery(''); setFromOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                      borderBottom: '1px solid #f8f8f8', background: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                    <MapPin size={14} style={{ color: '#0da171', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.placeName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{loc.city}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {fromQuery.trim() && fromResults.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>Searching places in MP...</div>
            )}
            {fromResults.map((loc, i) => (
              <button key={i} type="button"
                onClick={() => { setFrom(loc); setFromQuery(''); setFromOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                  borderBottom: '1px solid #f8f8f8', background: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <MapPin size={14} style={{ color: '#0da171', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.placeName}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TO field */}
      <div ref={toRef} style={{ position: 'relative' }}>
        <small style={{ display: 'block', color: '#e11d48', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 5 }}>DESTINATION / DROP</small>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1.5px solid', borderColor: toOpen ? '#e11d48' : '#dbe8e0',
          borderRadius: 14, padding: '0 14px', minHeight: 48, background: '#fff',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
          <span className="pin pin-to" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={to ? to.placeName : toQuery}
            onFocus={() => { setToOpen(true); if (to) setToQuery(to.placeName); }}
            onChange={e => { setTo(null); setToQuery(e.target.value); setToOpen(true); }}
            placeholder="Search destination, area or landmark..."
            autoComplete="off"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 14, color: '#244d41', fontWeight: 600 }}
          />
          {to && (
            <button type="button" onClick={() => { setTo(null); setToQuery(''); }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, padding: 0 }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* To dropdown */}
        {toOpen && (toQuery || !to) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
            background: '#fff', borderRadius: 14, marginTop: 4,
            boxShadow: '0 12px 36px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0',
            maxHeight: 260, overflowY: 'auto',
          }}>
            {!toQuery.trim() && (
              <div>
                <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.07em' }}>
                  ⭐ POPULAR DESTINATIONS
                </div>
                {popularPresets.map((loc, i) => (
                  <button key={i} type="button"
                    onClick={() => { setTo(loc); setToQuery(''); setToOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                      borderBottom: '1px solid #f8f8f8', background: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                    <MapPin size={14} style={{ color: '#ef7665', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.placeName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{loc.city}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {toQuery.trim() && toResults.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>Searching places in MP...</div>
            )}
            {toResults.map((loc, i) => (
              <button key={i} type="button"
                onClick={() => { setTo(loc); setToQuery(''); setToOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                  borderBottom: '1px solid #f8f8f8', background: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <MapPin size={14} style={{ color: '#ef7665', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.placeName}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DATE & PASSENGERS fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <small style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 5 }}>SELECT DATE</small>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1.5px solid #dbe8e0', borderRadius: 14, padding: '0 12px', minHeight: 46, background: '#fff',
          }}>
            <Calendar size={15} style={{ color: '#087c64', flexShrink: 0 }} />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 13, color: '#244d41', fontWeight: 600 }}
            />
          </div>
        </div>

        <div>
          <small style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 5 }}>PASSENGERS</small>
          <PassengerSelector
            value={passengers}
            onChange={setPassengers}
            min={1}
            max={4}
            label="Passenger"
          />
        </div>
      </div>

      {/* Search Button */}
      <button type="submit" className="route-search" style={{ marginTop: 6, gap: 10, minHeight: 52 }}>
        Search available rides <ArrowRight size={18} />
      </button>

      <p className="route-caption" style={{ margin: '4px 0 0', fontSize: 12 }}>
        <span>🛡️</span> Real rides. Verified people. Shared journeys.
      </p>
    </form>
  );
}

