'use client';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, X } from 'lucide-react';
import {
  LocationPoint,
  POPULAR_LOCATIONS,
  getCurrentGPSLocation,
  searchLocations,
} from '@/lib/location-service';

interface DashboardLocationPickerProps {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onLocationSelect?: (loc: LocationPoint) => void;
}

export function DashboardLocationPicker({
  label,
  name,
  placeholder,
  value,
  onChange,
  onLocationSelect,
}: DashboardLocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<LocationPoint[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!open || !value.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchLocations(value);
      setResults(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [value, open]);

  const handleDetectGPS = async () => {
    setGpsLoading(true);
    const res = await getCurrentGPSLocation();
    setGpsLoading(false);
    if (res.location) {
      onChange(res.location.placeName);
      if (onLocationSelect) onLocationSelect(res.location);
      setOpen(false);
    }
  };

  const popularPresets = POPULAR_LOCATIONS.slice(0, 6);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <label className="block text-[10px] font-bold tracking-wider text-emerald-800 uppercase mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          name={name}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={e => {
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 pr-8 text-sm outline-none focus:border-emerald-600 text-slate-800 font-medium"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 text-slate-400 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        ) : (
          <MapPin size={15} className="absolute right-2.5 text-emerald-600 pointer-events-none" />
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            border: '1px solid #e2e8f0',
            marginTop: 4,
            maxHeight: 260,
            overflowY: 'auto',
            padding: 8,
          }}
        >
          {label.toLowerCase().includes('from') && (
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={gpsLoading}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 10,
                background: '#e6f7ef',
                border: '1px solid #bce6d3',
                color: '#087c64',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <Navigation size={14} className={gpsLoading ? 'animate-spin' : ''} />
              {gpsLoading ? 'Detecting GPS...' : '📍 Use My Current Location'}
            </button>
          )}

          {value.trim() && results.length > 0 ? (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', padding: '4px 8px', letterSpacing: '0.05em' }}>
                MATCHING LOCATIONS
              </div>
              {results.map((loc, idx) => (
                <button
                  key={`${loc.placeName}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(loc.placeName);
                    if (onLocationSelect) onLocationSelect(loc);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <MapPin size={14} style={{ color: '#087c64', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{loc.placeName}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{loc.formattedAddress}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', padding: '4px 8px', letterSpacing: '0.05em' }}>
                ⭐ POPULAR LOCATIONS
              </div>
              {popularPresets.map((loc, idx) => (
                <button
                  key={`${loc.placeName}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(loc.placeName);
                    if (onLocationSelect) onLocationSelect(loc);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#334155',
                    fontWeight: 600,
                  }}
                >
                  <Compass size={14} style={{ color: '#087c64' }} />
                  <span>{loc.placeName} <small style={{ color: '#94a3b8' }}>({loc.city})</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
