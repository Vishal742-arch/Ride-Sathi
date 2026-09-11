'use client';
import { useEffect, useRef } from 'react';
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
  const pickupMarkerRef = useRef<any>(null);
  const dropMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    let isSubscribed = true;

    // Dynamically load Leaflet JS & CSS
    import('leaflet').then(L => {
      if (!isSubscribed || !containerRef.current) return;

      // Fix Leaflet marker icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Custom SVG Pin Icons for Pickup (Emerald/Green) and Drop (Rose/Red)
      const greenIcon = L.divIcon({
        className: 'custom-map-pin pickup-pin',
        html: `<div style="background:#087c64;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(8,124,100,0.4);border:2px solid #fff;font-weight:bold;font-size:14px;">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const redIcon = L.divIcon({
        className: 'custom-map-pin drop-pin',
        html: `<div style="background:#e11d48;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(225,29,72,0.4);border:2px solid #fff;font-weight:bold;font-size:14px;">🏁</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Initialize map instance if not existing
      if (!mapRef.current) {
        const defaultCenter: [number, number] = pickup
          ? [pickup.latitude, pickup.longitude]
          : drop
          ? [drop.latitude, drop.longitude]
          : [22.7196, 75.8577]; // Indore default center

        const map = L.map(containerRef.current, {
          center: defaultCenter,
          zoom: 13,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        map.on('click', (e: any) => {
          if (onMapClick) {
            onMapClick(e.latlng.lat, e.latlng.lng);
          }
        });

        mapRef.current = map;
      }

      const map = mapRef.current;

      // Update Pickup Marker
      if (pickup) {
        if (!pickupMarkerRef.current) {
          const marker = L.marker([pickup.latitude, pickup.longitude], {
            icon: greenIcon,
            draggable: Boolean(onPickupDragEnd),
          }).addTo(map);

          marker.bindTooltip(`<b>Pickup:</b> ${pickup.placeName}`, { permanent: false });

          marker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            if (onPickupDragEnd) onPickupDragEnd(lat, lng);
          });

          pickupMarkerRef.current = marker;
        } else {
          pickupMarkerRef.current.setLatLng([pickup.latitude, pickup.longitude]);
          pickupMarkerRef.current.setDragging(Boolean(onPickupDragEnd));
        }
      } else if (pickupMarkerRef.current) {
        map.removeLayer(pickupMarkerRef.current);
        pickupMarkerRef.current = null;
      }

      // Update Drop Marker
      if (drop) {
        if (!dropMarkerRef.current) {
          const marker = L.marker([drop.latitude, drop.longitude], {
            icon: redIcon,
            draggable: Boolean(onDropDragEnd),
          }).addTo(map);

          marker.bindTooltip(`<b>Drop:</b> ${drop.placeName}`, { permanent: false });

          marker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            if (onDropDragEnd) onDropDragEnd(lat, lng);
          });

          dropMarkerRef.current = marker;
        } else {
          dropMarkerRef.current.setLatLng([drop.latitude, drop.longitude]);
          dropMarkerRef.current.setDragging(Boolean(onDropDragEnd));
        }
      } else if (dropMarkerRef.current) {
        map.removeLayer(dropMarkerRef.current);
        dropMarkerRef.current = null;
      }

      // Update Route Polyline
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (polylineCoords.length > 0) {
        const polyline = L.polyline(polylineCoords, {
          color: '#087c64',
          weight: 5,
          opacity: 0.85,
          dashArray: '2, 6',
        }).addTo(map);

        polylineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      } else if (pickup && drop) {
        const bounds = L.latLngBounds(
          [pickup.latitude, pickup.longitude],
          [drop.latitude, drop.longitude]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (pickup) {
        map.setView([pickup.latitude, pickup.longitude], 14);
      } else if (drop) {
        map.setView([drop.latitude, drop.longitude], 14);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [pickup, drop, polylineCoords, onPickupDragEnd, onDropDragEnd, onMapClick]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="location-map-container" style={{ position: 'relative', width: '100%', height, borderRadius: 16, overflow: 'hidden', border: '1px solid #dcece2', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      {/* Import Leaflet CSS via standard CDN tag */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      {interactiveMode !== 'view' && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 999, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#087c64', border: '1px solid #c3e6d8' }}>
          {interactiveMode === 'pickup' ? '📍 Drag green pin to adjust pickup' : '🏁 Drag red pin to adjust drop location'}
        </div>
      )}
    </div>
  );
}
