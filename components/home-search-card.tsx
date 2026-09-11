'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, X, ArrowRight, Search } from 'lucide-react';
import {
  LocationPoint,
  POPULAR_LOCATIONS,
  getCurrentGPSLocation,
  searchLocations,
} from '@/lib/location-service';

export function HomeSearchCard() {
  const router = useRouter();

  const [from, setFrom] = useState<LocationPoint | null>(null);
  const [to, setTo] = useState<LocationPoint | null>(null);
  const [date, setDate] = useState('');

  const [fromQuery, setFromQuery] = useState('');
  const [fromResults, setFromResults] = useState<LocationPoint[]>([]);
  const [fromOpen, setFromOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [toQuery, setToQuery] = useState('');
  const [toResults, setToResults] = useState<LocationPoint[]>([]);
  const [toOpen, setToOpen] = useState(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Popular locations — show top picks from Indore by default
  const popularPresets = POPULAR_LOCATIONS.slice(0, 8);

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
    const params = new URLSearchParams();
    if (from) params.set('from', from.placeName);
    if (to) params.set('to', to.placeName);
    if (date) params.set('date', date);
    router.push(`/find?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="route-card" style={{ padding: 20, display: 'grid', gap: 14 }}>
      {/* Header */}
      <div className="route-card-top">
        <span>PLAN A RIDE</span>
        <div className="people">
          <Search size={13} /> Find available rides
        </div>
      </div>

      {/* FROM field */}
      <div ref={fromRef} style={{ position: 'relative' }}>
        <small style={{ display: 'block', color: '#719088', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>FROM</small>
        <div style={{ display: 'flex', gap: 7, alignItems: 'stretch' }}>
          {/* Input */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            border: '1.5px solid', borderColor: fromOpen ? '#087c64' : '#dbe8e0',
            borderRadius: 12, padding: '0 12px', minHeight: 46, background: '#fff',
            transition: 'border-color 0.15s',
          }}>
            <span className="pin pin-from" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={from ? from.placeName : fromQuery}
              onFocus={() => { setFromOpen(true); if (from) setFromQuery(from.placeName); }}
              onChange={e => { setFrom(null); setFromQuery(e.target.value); setFromOpen(true); }}
              placeholder="Select pickup location"
              autoComplete="off"
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 13, color: '#244d41', fontWeight: 600 }}
            />
            {from && (
              <button type="button" onClick={() => { setFrom(null); setFromQuery(''); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* GPS Button */}
          <button
            type="button" onClick={handleGPS} disabled={gpsLoading}
            title="Use my current location"
            style={{
              background: '#e6f7ef', border: '1.5px solid #bce6d3', borderRadius: 12,
              padding: '0 12px', fontSize: 11, fontWeight: 700, color: '#087c64',
              display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Navigation size={13} style={{ animation: gpsLoading ? 'spin 1s linear infinite' : 'none' }} />
            {gpsLoading ? '...' : '📍 Me'}
          </button>
        </div>

        {/* From dropdown */}
        {fromOpen && (fromQuery || !from) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
            background: '#fff', borderRadius: 14, marginTop: 4,
            boxShadow: '0 10px 36px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0',
            maxHeight: 260, overflowY: 'auto',
          }}>
            {/* Popular presets when no query */}
            {!fromQuery.trim() && (
              <div>
                <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.07em' }}>
                  ⭐ POPULAR LOCATIONS
                </div>
                {popularPresets.map((loc, i) => (
                  <button key={i} type="button"
                    onClick={() => { setFrom(loc); setFromQuery(''); setFromOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none',
                      borderBottom: '1px solid #f8f8f8', background: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 9,
                    }}>
                    <MapPin size={13} style={{ color: '#0da171', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{loc.placeName}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{loc.city}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Search results */}
            {fromQuery.trim() && fromResults.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>Searching...</div>
            )}
            {fromResults.map((loc, i) => (
              <button key={i} type="button"
                onClick={() => { setFrom(loc); setFromQuery(''); setFromOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none',
                  borderBottom: '1px solid #f8f8f8', background: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 9,
                }}>
                <MapPin size={13} style={{ color: '#0da171', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{loc.placeName}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Connector line */}
      <div className="route-line" style={{ margin: '-6px 0 -6px 6px' }} />

      {/* TO field */}
      <div ref={toRef} style={{ position: 'relative' }}>
        <small style={{ display: 'block', color: '#719088', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>TO</small>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1.5px solid', borderColor: toOpen ? '#087c64' : '#dbe8e0',
          borderRadius: 12, padding: '0 12px', minHeight: 46, background: '#fff',
          transition: 'border-color 0.15s',
        }}>
          <span className="pin pin-to" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={to ? to.placeName : toQuery}
            onFocus={() => { setToOpen(true); if (to) setToQuery(to.placeName); }}
            onChange={e => { setTo(null); setToQuery(e.target.value); setToOpen(true); }}
            placeholder="Select destination"
            autoComplete="off"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 13, color: '#244d41', fontWeight: 600 }}
          />
          {to && (
            <button type="button" onClick={() => { setTo(null); setToQuery(''); }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* To dropdown */}
        {toOpen && (toQuery || !to) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300,
            background: '#fff', borderRadius: 14, marginTop: 4,
            boxShadow: '0 10px 36px rgba(0,0,0,0.13)', border: '1px solid #e2e8f0',
            maxHeight: 260, overflowY: 'auto',
          }}>
            {!toQuery.trim() && (
              <div>
                <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.07em' }}>
                  ⭐ POPULAR DESTINATIONS
                </div>
                {popularPresets.map((loc, i) => (
                  <button key={i} type="button"
                    onClick={() => { setTo(loc); setToQuery(''); setToOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none',
                      borderBottom: '1px solid #f8f8f8', background: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 9,
                    }}>
                    <MapPin size={13} style={{ color: '#ef7665', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{loc.placeName}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{loc.city}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {toQuery.trim() && toResults.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>Searching...</div>
            )}
            {toResults.map((loc, i) => (
              <button key={i} type="button"
                onClick={() => { setTo(loc); setToQuery(''); setToOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none',
                  borderBottom: '1px solid #f8f8f8', background: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 9,
                }}>
                <MapPin size={13} style={{ color: '#ef7665', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{loc.placeName}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DATE field */}
      <div>
        <small style={{ display: 'block', color: '#719088', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>DATE</small>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1.5px solid #dbe8e0', borderRadius: 12, padding: '0 12px', minHeight: 46, background: '#fff',
        }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 13, color: '#244d41', fontWeight: 600 }}
          />
        </div>
      </div>

      {/* Search Button */}
      <button type="submit" className="route-search" style={{ marginTop: 4, gap: 9 }}>
        Search available rides <ArrowRight size={18} />
      </button>

      <p className="route-caption">
        <span>🛡️</span> Real rides. Verified people. Safer journeys.
      </p>
    </form>
  );
}
