'use client';
import { useEffect, useRef, useState } from 'react';
import { Compass, Map, MapPin, Navigation, Sparkles, X, Check, AlertCircle } from 'lucide-react';
import {
  LocationPoint,
  GPSResult,
  POPULAR_LOCATIONS,
  getCurrentGPSLocation,
  reverseGeocode,
  searchLocations,
} from '@/lib/location-service';
import { LocationMap } from './location-map';

interface RouteLocationPickerProps {
  pickup: LocationPoint | null;
  drop: LocationPoint | null;
  onPickupChange: (loc: LocationPoint | null) => void;
  onDropChange: (loc: LocationPoint | null) => void;
  polylineCoords?: [number, number][];
  routeLoading?: boolean;
}

export function RouteLocationPicker({
  pickup,
  drop,
  onPickupChange,
  onDropChange,
  polylineCoords = [],
  routeLoading = false,
}: RouteLocationPickerProps) {
  const [activeTab, setActiveTab] = useState<'INDORE' | 'DEWAS' | 'UJJAIN'>('INDORE');
  const [gpsState, setGpsState] = useState<{
    loading: boolean;
    result: GPSResult | null;
  }>({ loading: false, result: null });

  // Autocomplete state
  const [pickupQuery, setPickupQuery] = useState('');
  const [pickupResults, setPickupResults] = useState<LocationPoint[]>([]);
  const [pickupOpen, setPickupOpen] = useState(false);

  const [dropQuery, setDropQuery] = useState('');
  const [dropResults, setDropResults] = useState<LocationPoint[]>([]);
  const [dropOpen, setDropOpen] = useState(false);

  // Map adjustment view state
  const [mapMode, setMapMode] = useState<'view' | 'pickup' | 'drop'>('view');

  const pickupRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(e.target as Node)) {
        setPickupOpen(false);
      }
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Search debounce for pickup
  useEffect(() => {
    if (!pickupQuery.trim() || !pickupOpen) {
      setPickupResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchLocations(pickupQuery);
      setPickupResults(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [pickupQuery, pickupOpen]);

  // Search debounce for drop
  useEffect(() => {
    if (!dropQuery.trim() || !dropOpen) {
      setDropResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchLocations(dropQuery);
      setDropResults(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [dropQuery, dropOpen]);

  // Handle GPS detect button
  const handleDetectGPS = async () => {
    setGpsState({ loading: true, result: null });
    const res = await getCurrentGPSLocation();
    setGpsState({ loading: false, result: res });

    if (res.location) {
      onPickupChange(res.location);
    }
  };

  // Drag handlers for Leaflet map markers
  const handlePickupMarkerDrag = async (lat: number, lng: number) => {
    const updated = await reverseGeocode(lat, lng);
    onPickupChange(updated);
  };

  const handleDropMarkerDrag = async (lat: number, lng: number) => {
    const updated = await reverseGeocode(lat, lng);
    onDropChange(updated);
  };

  const popularByCity = POPULAR_LOCATIONS.filter(
    p => p.city.toUpperCase() === activeTab
  );

  return (
    <div className="route-location-picker-container" style={{ display: 'grid', gap: 20 }}>
      {/* Pickup Location Box */}
      <div ref={pickupRef} className="picker-box" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#087c64', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} /> PICKUP LOCATION
          </label>

          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={gpsState.loading}
            style={{
              background: '#e6f7ef',
              border: '1px solid #bce6d3',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: '#087c64',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <Navigation size={13} className={gpsState.loading ? 'animate-spin' : ''} />
            {gpsState.loading ? 'Detecting GPS...' : '📍 Use My Current Location'}
          </button>
        </div>

        <div className="find-input" style={{ borderRadius: 14 }}>
          <Compass size={18} style={{ color: '#087c64' }} />
          <input
            type="text"
            value={pickup ? pickup.placeName : pickupQuery}
            onFocus={() => {
              setPickupOpen(true);
              if (pickup) setPickupQuery(pickup.placeName);
            }}
            onChange={e => {
              onPickupChange(null);
              setPickupQuery(e.target.value);
              setPickupOpen(true);
            }}
            placeholder="Search pickup area, landmark or street..."
            autoComplete="off"
            style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
          />
          {pickup && (
            <button
              type="button"
              onClick={() => {
                onPickupChange(null);
                setPickupQuery('');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* GPS Accuracy Status Badge */}
        {gpsState.result && (
          <div style={{ marginTop: 8, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
            {gpsState.result.accuracyLevel === 'Excellent' && (
              <span style={{ color: '#15803d', fontWeight: 700, background: '#f0fdf4', padding: '3px 8px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                ✓ Location accuracy: Excellent (~{gpsState.result.accuracy}m)
              </span>
            )}
            {gpsState.result.accuracyLevel === 'Approximate' && (
              <span style={{ color: '#b45309', fontWeight: 700, background: '#fffbeb', padding: '3px 8px', borderRadius: 8, border: '1px solid #fef3c7' }}>
                ⚡ Location accuracy: Approximate (~{gpsState.result.accuracy}m)
              </span>
            )}
            {gpsState.result.accuracyLevel === 'Low' && (
              <span style={{ color: '#b91c1c', fontWeight: 700, background: '#fef2f2', padding: '3px 8px', borderRadius: 8, border: '1px solid #fecaca' }}>
                ⚠️ Location accuracy is low. Please move to an open area or adjust pin on map.
              </span>
            )}
            {gpsState.result.error && (
              <span style={{ color: '#dc2626', fontWeight: 600 }}>
                {gpsState.result.error}
              </span>
            )}
          </div>
        )}

        {/* Pickup Autocomplete Results */}
        {pickupOpen && pickupQuery && (
          <div className="location-popover" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
            {pickupResults.map((loc, idx) => (
              <button
                key={`${loc.placeName}-${idx}`}
                type="button"
                onClick={() => {
                  onPickupChange(loc);
                  setPickupQuery('');
                  setPickupOpen(false);
                }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f1f5f9', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <MapPin size={16} style={{ color: '#087c64' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.placeName}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Drop Location Box */}
      <div ref={dropRef} className="picker-box" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#e11d48', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} /> DESTINATION DROP
          </label>
        </div>

        <div className="find-input" style={{ borderRadius: 14 }}>
          <Compass size={18} style={{ color: '#e11d48' }} />
          <input
            type="text"
            value={drop ? drop.placeName : dropQuery}
            onFocus={() => {
              setDropOpen(true);
              if (drop) setDropQuery(drop.placeName);
            }}
            onChange={e => {
              onDropChange(null);
              setDropQuery(e.target.value);
              setDropOpen(true);
            }}
            placeholder="Search destination, landmark or area..."
            autoComplete="off"
            style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
          />
          {drop && (
            <button
              type="button"
              onClick={() => {
                onDropChange(null);
                setDropQuery('');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Drop Autocomplete Results */}
        {dropOpen && dropQuery && (
          <div className="location-popover" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
            {dropResults.map((loc, idx) => (
              <button
                key={`${loc.placeName}-${idx}`}
                type="button"
                onClick={() => {
                  onDropChange(loc);
                  setDropQuery('');
                  setDropOpen(false);
                }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f1f5f9', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <MapPin size={16} style={{ color: '#e11d48' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.placeName}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Locations Tabs (Indore, Dewas, Ujjain) */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⭐ POPULAR SUGGESTED LOCATIONS
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['INDORE', 'DEWAS', 'UJJAIN'] as const).map(city => (
              <button
                key={city}
                type="button"
                onClick={() => setActiveTab(city)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  border: activeTab === city ? '1px solid #087c64' : '1px solid #cbd5e1',
                  background: activeTab === city ? '#087c64' : '#fff',
                  color: activeTab === city ? '#fff' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
          {popularByCity.map((loc, i) => (
            <button
              key={`${loc.placeName}-${i}`}
              type="button"
              onClick={() => {
                if (!pickup) onPickupChange(loc);
                else onDropChange(loc);
              }}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <MapPin size={12} style={{ color: '#087c64' }} /> {loc.placeName}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Leaflet Map Preview with Draggable Markers */}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Map size={16} /> Interactive Map & Route Preview
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setMapMode('pickup')}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid #087c64',
                background: mapMode === 'pickup' ? '#087c64' : '#fff',
                color: mapMode === 'pickup' ? '#fff' : '#087c64',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Adjust Pickup Pin
            </button>
            <button
              type="button"
              onClick={() => setMapMode('drop')}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid #e11d48',
                background: mapMode === 'drop' ? '#e11d48' : '#fff',
                color: mapMode === 'drop' ? '#fff' : '#e11d48',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Adjust Drop Pin
            </button>
          </div>
        </div>

        <LocationMap
          pickup={pickup}
          drop={drop}
          polylineCoords={polylineCoords}
          onPickupDragEnd={handlePickupMarkerDrag}
          onDropDragEnd={handleDropMarkerDrag}
          interactiveMode={mapMode}
          height={280}
        />
      </div>
    </div>
  );
}
