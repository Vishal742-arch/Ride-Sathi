'use client';
import { useEffect, useRef, useState } from 'react';
import { LocationPoint } from '@/lib/location-service';

interface LocationMapProps {
  pickup: LocationPoint | null;
  drop: LocationPoint | null;
  polylineCoords?: [number, number][];
  onPickupDragEnd?: (lat: number, lng: number) => void;
  onDropDragEnd?: (lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  interactiveMode?: 'pickup' | 'drop' | 'view';
  height?: string | number;
}

declare global {
  interface Window {
    google?: any;
    L?: any;
  }
}

export function LocationMap({
  pickup,
  drop,
  polylineCoords = [],
  onPickupDragEnd,
  onDropDragEnd,
  onMapClick,
  interactiveMode = 'view',
  height = 320,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);

  const pickupMarkerRef = useRef<any>(null);
  const dropMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.MAPS_API_KEY ||
    '';

  // Load Google Maps SDK or Leaflet fallback SDK
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    if (window.google?.maps && apiKey) {
      setMapEngine('google');
      setMapLoaded(true);
      return;
    }

    if (apiKey) {
      const scriptId = 'google-maps-js-sdk';
      let existingScript = document.getElementById(scriptId) as HTMLScriptElement;

      if (!existingScript) {
        existingScript = document.createElement('script');
        existingScript.id = scriptId;
        existingScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        existingScript.async = true;
        existingScript.defer = true;
        document.head.appendChild(existingScript);
      }

      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          setMapEngine('google');
          setMapLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);

      return () => clearInterval(checkLoaded);
    }

    // Leaflet fallback setup when Google API key is missing
    setMapEngine('leaflet');
    if (window.L) {
      setMapLoaded(true);
      return;
    }

    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-js';
    let leafletScript = document.getElementById(scriptId) as HTMLScriptElement;
    if (!leafletScript) {
      leafletScript = document.createElement('script');
      leafletScript.id = scriptId;
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.async = true;
      document.head.appendChild(leafletScript);
    }

    const checkLeaflet = setInterval(() => {
      if (window.L) {
        setMapLoaded(true);
        clearInterval(checkLeaflet);
      }
    }, 100);

    return () => clearInterval(checkLeaflet);
  }, [apiKey]);

  // Google Maps rendering logic
  useEffect(() => {
    if (!mapLoaded || mapEngine !== 'google' || !window.google?.maps || !containerRef.current) return;

    const google = window.google;
    const defaultCenter = pickup
      ? { lat: pickup.latitude, lng: pickup.longitude }
      : drop
      ? { lat: drop.latitude, lng: drop.longitude }
      : { lat: 22.7196, lng: 75.8577 }; // Indore default

    if (!mapRef.current) {
      const map = new google.maps.Map(containerRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });

      if (onMapClick) {
        map.addListener('click', (e: any) => {
          onMapClick(e.latLng.lat(), e.latLng.lng());
        });
      }

      mapRef.current = map;
    }

    const map = mapRef.current;
    const bounds = new google.maps.LatLngBounds();

    // Pickup Marker
    if (pickup) {
      const pickupPos = { lat: pickup.latitude, lng: pickup.longitude };
      bounds.extend(pickupPos);

      if (!pickupMarkerRef.current) {
        const marker = new google.maps.Marker({
          position: pickupPos,
          map,
          title: `Pickup: ${pickup.placeName}`,
          draggable: Boolean(onPickupDragEnd),
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#087c64',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 1.8,
            anchor: new google.maps.Point(12, 22),
          },
        });

        if (onPickupDragEnd) {
          marker.addListener('dragend', (e: any) => {
            onPickupDragEnd(e.latLng.lat(), e.latLng.lng());
          });
        }
        pickupMarkerRef.current = marker;
      } else {
        pickupMarkerRef.current.setPosition(pickupPos);
        pickupMarkerRef.current.setDraggable(Boolean(onPickupDragEnd));
      }

      // Render Accuracy Circle if accuracy > 0
      if (pickup.accuracy && pickup.accuracy > 0) {
        if (accuracyCircleRef.current) accuracyCircleRef.current.setMap(null);
        accuracyCircleRef.current = new google.maps.Circle({
          strokeColor: '#087c64',
          strokeOpacity: 0.5,
          strokeWeight: 1.5,
          fillColor: '#087c64',
          fillOpacity: 0.15,
          map,
          center: pickupPos,
          radius: pickup.accuracy,
        });
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }

    // Drop Marker
    if (drop) {
      const dropPos = { lat: drop.latitude, lng: drop.longitude };
      bounds.extend(dropPos);

      if (!dropMarkerRef.current) {
        const marker = new google.maps.Marker({
          position: dropPos,
          map,
          title: `Drop: ${drop.placeName}`,
          draggable: Boolean(onDropDragEnd),
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#e11d48',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 1.8,
            anchor: new google.maps.Point(12, 22),
          },
        });

        if (onDropDragEnd) {
          marker.addListener('dragend', (e: any) => {
            onDropDragEnd(e.latLng.lat(), e.latLng.lng());
          });
        }
        dropMarkerRef.current = marker;
      } else {
        dropMarkerRef.current.setPosition(dropPos);
        dropMarkerRef.current.setDraggable(Boolean(onDropDragEnd));
      }
    } else if (dropMarkerRef.current) {
      dropMarkerRef.current.setMap(null);
      dropMarkerRef.current = null;
    }

    // Polyline Route Rendering
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (polylineCoords.length > 0) {
      const googlePath = polylineCoords.map(c => ({ lat: c[0], lng: c[1] }));
      googlePath.forEach(pt => bounds.extend(pt));

      const polyline = new google.maps.Polyline({
        path: googlePath,
        geodesic: true,
        strokeColor: '#087c64',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map,
      });

      polylineRef.current = polyline;
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    } else if (pickup && drop) {
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } else if (pickup) {
      map.setCenter({ lat: pickup.latitude, lng: pickup.longitude });
      map.setZoom(14);
    } else if (drop) {
      map.setCenter({ lat: drop.latitude, lng: drop.longitude });
      map.setZoom(14);
    }
  }, [mapLoaded, mapEngine, pickup, drop, polylineCoords, onPickupDragEnd, onDropDragEnd, onMapClick]);

  // Leaflet rendering logic (Fallback)
  useEffect(() => {
    if (!mapLoaded || mapEngine !== 'leaflet' || !window.L || !containerRef.current) return;

    const L = window.L;
    const defaultCenter = pickup
      ? [pickup.latitude, pickup.longitude]
      : drop
      ? [drop.latitude, drop.longitude]
      : [22.7196, 75.8577];

    if (!leafletMapRef.current) {
      const map = L.map(containerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      if (onMapClick) {
        map.on('click', (e: any) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Clear existing leaflet layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    const boundsGroup: any[] = [];

    // Leaflet Pickup Marker
    if (pickup) {
      const greenIcon = L.divIcon({
        className: 'custom-pickup-pin',
        html: `<div style="background: #087c64; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([pickup.latitude, pickup.longitude], {
        icon: greenIcon,
        draggable: Boolean(onPickupDragEnd),
      }).addTo(map);

      marker.bindTooltip(`📍 Pickup: ${pickup.placeName}`, { permanent: false, direction: 'top' });

      if (onPickupDragEnd) {
        marker.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          onPickupDragEnd(lat, lng);
        });
      }
      boundsGroup.push([pickup.latitude, pickup.longitude]);

      if (pickup.accuracy && pickup.accuracy > 0) {
        L.circle([pickup.latitude, pickup.longitude], {
          radius: pickup.accuracy,
          color: '#087c64',
          fillColor: '#087c64',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(map);
      }
    }

    // Leaflet Drop Marker
    if (drop) {
      const redIcon = L.divIcon({
        className: 'custom-drop-pin',
        html: `<div style="background: #e11d48; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([drop.latitude, drop.longitude], {
        icon: redIcon,
        draggable: Boolean(onDropDragEnd),
      }).addTo(map);

      marker.bindTooltip(`🏁 Drop: ${drop.placeName}`, { permanent: false, direction: 'top' });

      if (onDropDragEnd) {
        marker.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          onDropDragEnd(lat, lng);
        });
      }
      boundsGroup.push([drop.latitude, drop.longitude]);
    }

    // Leaflet Polyline Route
    if (polylineCoords.length > 0) {
      const polyline = L.polyline(polylineCoords, {
        color: '#087c64',
        weight: 5,
        opacity: 0.85,
      }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (boundsGroup.length > 1) {
      map.fitBounds(boundsGroup, { padding: [50, 50] });
    } else if (boundsGroup.length === 1) {
      map.setView(boundsGroup[0], 14);
    }
  }, [mapLoaded, mapEngine, pickup, drop, polylineCoords, onPickupDragEnd, onDropDragEnd, onMapClick]);

  return (
    <div
      className="location-map-container"
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #dcece2',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        background: '#f8faf9',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {!mapLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e6f7ef 100%)',
            padding: 20,
            textAlign: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 24 }}>🗺️</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#087c64' }}>
            Loading Interactive Route Map...
          </div>
          {pickup && (
            <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>
              📍 <b>Pickup:</b> {pickup.placeName} ({pickup.city})
            </div>
          )}
          {drop && (
            <div style={{ fontSize: 11, color: '#9f1239', fontWeight: 600 }}>
              🏁 <b>Drop:</b> {drop.placeName} ({drop.city})
            </div>
          )}
        </div>
      )}

      {interactiveMode !== 'view' && mapLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 999,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            color: interactiveMode === 'pickup' ? '#087c64' : '#e11d48',
            border: '1px solid #c3e6d8',
          }}
        >
          {interactiveMode === 'pickup'
            ? '📍 Tap map or drag green pin to move pickup location'
            : '🏁 Tap map or drag red pin to move drop location'}
        </div>
      )}
    </div>
  );
}

