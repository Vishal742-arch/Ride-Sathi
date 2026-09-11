'use client';
import { useEffect, useRef, useState } from 'react';
import { Compass, Map, MapPin, Navigation, X, ChevronDown } from 'lucide-react';
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

  const [pickupQuery, setPickupQuery] = useState('');
  const [pickupResults, setPickupResults] = useState<LocationPoint[]>([]);
  const [pickupOpen, setPickupOpen] = useState(false);

  const [dropQuery, setDropQuery] = useState('');
  const [dropResults, setDropResults] = useState<LocationPoint[]>([]);
  const [dropOpen, setDropOpen] = useState(false);

  const [popularExpanded, setPopularExpanded] = useState(true);
  const [mapMode, setMapMode] = useState<'view' | 'pickup' | 'drop'>('view');
  const [showMap, setShowMap] = useState(true);

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

  const handleDetectGPS = async () => {
    setGpsState({ loading: true, result: null });
    const res = await getCurrentGPSLocation();
    setGpsState({ loading: false, result: res });
    if (res.location) {
      onPickupChange(res.location);
    }
  };

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

  const handlePopularSelect = (loc: LocationPoint) => {
    if (!pickup) {
      onPickupChange(loc);
    } else if (!drop) {
      onDropChange(loc);
    } else {
      onDropChange(loc);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* ── Pickup Input ── */}
      <div ref={pickupRef} style={{ position: 'relative' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
          color: '#087c64', marginBottom: 6, textTransform: 'uppercase',
        }}>
          <MapPin size={14} /> Pickup Location
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div className="find-input" style={{ borderRadius: 14, flex: 1 }}>
            <Compass size={17} style={{ color: '#087c64', flexShrink: 0 }} />
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
              placeholder="Search pickup area or landmark..."
              autoComplete="off"
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
            />
            {pickup && (
              <button
                type="button"
                onClick={() => { onPickupChange(null); setPickupQuery(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* GPS Button */}
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={gpsState.loading}
            title="Use my current location"
            style={{
              background: '#e6f7ef',
              border: '1.5px solid #bce6d3',
              borderRadius: 14,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#087c64',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Navigation size={14} className={gpsState.loading ? 'animate-spin' : ''} />
            {gpsState.loading ? 'Finding...' : '📍 My Location'}
          </button>
        </div>

        {/* GPS accuracy badge */}
        {gpsState.result && !gpsState.result.error && (
          <div style={{ marginTop: 5, fontSize: 11 }}>
            <span style={{
              color: gpsState.result.accuracyLevel === 'Excellent' ? '#15803d'
                : gpsState.result.accuracyLevel === 'Approximate' ? '#b45309' : '#b91c1c',
              fontWeight: 700,
              background: gpsState.result.accuracyLevel === 'Excellent' ? '#f0fdf4'
                : gpsState.result.accuracyLevel === 'Approximate' ? '#fffbeb' : '#fef2f2',
              padding: '2px 8px', borderRadius: 8,
            }}>
              {gpsState.result.accuracyLevel === 'Excellent' && `✓ GPS Excellent (~${gpsState.result.accuracy}m)`}
              {gpsState.result.accuracyLevel === 'Approximate' && `⚡ GPS Approximate (~${gpsState.result.accuracy}m) — fine-tune pin on map`}
              {gpsState.result.accuracyLevel === 'Low' && `⚠️ GPS low accuracy — drag pin on map to correct`}
            </span>
          </div>
        )}
        {gpsState.result?.error && (
          <div style={{ marginTop: 5, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
            {gpsState.result.error}
          </div>
        )}

        {/* Pickup Autocomplete Dropdown */}
        {pickupOpen && pickupQuery && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: '#fff', borderRadius: 14, marginTop: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0',
            maxHeight: 240, overflowY: 'auto',
          }}>
            {pickupResults.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                Searching...
              </div>
            ) : pickupResults.map((loc, idx) => (
              <button
                key={`${loc.placeName}-${idx}`}
                type="button"
                onClick={() => { onPickupChange(loc); setPickupQuery(''); setPickupOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  border: 'none', borderBottom: '1px solid #f1f5f9',
                  background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <MapPin size={15} style={{ color: '#087c64', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.placeName}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Route Visual Connector ── */}
      {(pickup || drop) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#087c64', border: '2px solid #fff', boxShadow: '0 0 0 2px #087c64' }} />
            <div style={{ width: 2, height: 18, background: 'linear-gradient(#087c64, #e11d48)', borderRadius: 2 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e11d48', border: '2px solid #fff', boxShadow: '0 0 0 2px #e11d48' }} />
          </div>
          <div style={{ flex: 1, fontSize: 12, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#087c64', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pickup ? pickup.placeName : <span style={{ color: '#94a3b8', fontWeight: 400 }}>Pickup not set</span>}
            </div>
            <div style={{ fontWeight: 700, color: '#e11d48', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {drop ? drop.placeName : <span style={{ color: '#94a3b8', fontWeight: 400 }}>Destination not set</span>}
            </div>
          </div>
          {routeLoading && (
            <span style={{ fontSize: 11, color: '#087c64', fontWeight: 700, flexShrink: 0 }}>Calculating...</span>
          )}
          {pickup && drop && !routeLoading && (
            <span style={{ fontSize: 11, fontWeight: 800, color: '#087c64', background: '#f0fdf4', padding: '3px 10px', borderRadius: 20, border: '1px solid #bbf7d0', flexShrink: 0 }}>
              Route set ✓
            </span>
          )}
        </div>
      )}

      {/* ── Drop Input ── */}
      <div ref={dropRef} style={{ position: 'relative' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
          color: '#e11d48', marginBottom: 6, textTransform: 'uppercase',
        }}>
          <MapPin size={14} /> Destination / Drop
        </label>

        <div className="find-input" style={{ borderRadius: 14 }}>
          <Compass size={17} style={{ color: '#e11d48', flexShrink: 0 }} />
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
            placeholder="Search destination, area or landmark..."
            autoComplete="off"
            style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: 14 }}
          />
          {drop && (
            <button
              type="button"
              onClick={() => { onDropChange(null); setDropQuery(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Drop Autocomplete Dropdown */}
        {dropOpen && dropQuery && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: '#fff', borderRadius: 14, marginTop: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0',
            maxHeight: 240, overflowY: 'auto',
          }}>
            {dropResults.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                Searching...
              </div>
            ) : dropResults.map((loc, idx) => (
              <button
                key={`${loc.placeName}-${idx}`}
                type="button"
                onClick={() => { onDropChange(loc); setDropQuery(''); setDropOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  border: 'none', borderBottom: '1px solid #f1f5f9',
                  background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <MapPin size={15} style={{ color: '#e11d48', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{loc.placeName}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Popular Locations Panel ── */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={() => setPopularExpanded(v => !v)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⭐ POPULAR SUGGESTED LOCATIONS
          </span>
          <ChevronDown
            size={16}
            style={{
              color: '#475569',
              transform: popularExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {popularExpanded && (
          <div style={{ padding: '0 14px 14px' }}>
            {/* City Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {(['INDORE', 'DEWAS', 'UJJAIN'] as const).map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setActiveTab(city)}
                  style={{
                    padding: '5px 14px', borderRadius: 20,
                    fontSize: 12, fontWeight: 700,
                    border: activeTab === city ? '1.5px solid #087c64' : '1.5px solid #cbd5e1',
                    background: activeTab === city ? '#087c64' : '#fff',
                    color: activeTab === city ? '#fff' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Location chips — larger, grid layout for easy tapping */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {popularByCity.map((loc, i) => (
                <button
                  key={`${loc.placeName}-${i}`}
                  type="button"
                  onClick={() => handlePopularSelect(loc)}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '9px 12px',
                    fontSize: 12, fontWeight: 600,
                    color: '#334155', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#087c64';
                    (e.currentTarget as HTMLButtonElement).style.background = '#f0fdf4';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#cbd5e1';
                    (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                  }}
                >
                  <MapPin size={13} style={{ color: '#087c64', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loc.placeName}
                  </span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8, marginBottom: 0 }}>
              Tap a chip → sets pickup first, then destination automatically.
            </p>
          </div>
        )}
      </div>

      {/* ── Interactive Map Section ── */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
        {/* Map Header */}
        <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowMap(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Map size={15} style={{ color: '#334155' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
              Interactive Map & Route Preview
            </span>
            <ChevronDown
              size={14}
              style={{
                color: '#64748b',
                transform: showMap ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {showMap && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setMapMode(mapMode === 'pickup' ? 'view' : 'pickup')}
                style={{
                  fontSize: 11, padding: '5px 10px', borderRadius: 8,
                  border: '1.5px solid #087c64',
                  background: mapMode === 'pickup' ? '#087c64' : '#fff',
                  color: mapMode === 'pickup' ? '#fff' : '#087c64',
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                📍 Adjust Pickup Pin
              </button>
              <button
                type="button"
                onClick={() => setMapMode(mapMode === 'drop' ? 'view' : 'drop')}
                style={{
                  fontSize: 11, padding: '5px 10px', borderRadius: 8,
                  border: '1.5px solid #e11d48',
                  background: mapMode === 'drop' ? '#e11d48' : '#fff',
                  color: mapMode === 'drop' ? '#fff' : '#e11d48',
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                🏁 Adjust Drop Pin
              </button>
            </div>
          )}
        </div>

        {/* Map Body */}
        {showMap && (
          <div style={{ borderTop: '1px solid #e2e8f0' }}>
            {/* Hint banner when a mode is active */}
            {mapMode !== 'view' && (
              <div style={{
                padding: '8px 14px', fontSize: 12, fontWeight: 700,
                color: mapMode === 'pickup' ? '#087c64' : '#e11d48',
                background: mapMode === 'pickup' ? '#f0fdf4' : '#fff1f2',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {mapMode === 'pickup'
                  ? '📍 Drag the green pin to fine-tune your pickup location'
                  : '🏁 Drag the red pin to fine-tune your drop location'}
                <button
                  type="button"
                  onClick={() => setMapMode('view')}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
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
        )}
      </div>

    </div>
  );
}
