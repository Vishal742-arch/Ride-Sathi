/**
 * Location Service for Ride With Me
 * Standardized module for GPS, Geocoding, Popular Locations, Google Maps Platform,
 * Nominatim/OSRM Fallbacks, Provider Abstraction, Fare Calculation, and Service Area Validation.
 */

export interface LocationPoint {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeName: string;
  city: 'Indore' | 'Dewas' | 'Ujjain' | string;
  area?: string;
  accuracy?: number; // in meters
  placeId?: string;
}

export type GPSAccuracyLevel = 'Excellent' | 'Good' | 'Approximate' | 'Low' | 'Unavailable';

export interface GPSResult {
  location: LocationPoint | null;
  accuracy: number | null;
  accuracyLevel: GPSAccuracyLevel;
  error?: string;
}

export interface RouteInfo {
  distanceKm: number;
  durationMins: number;
  formattedDistance: string;
  formattedDuration: string;
  polylineCoords: [number, number][]; // [lat, lng]
  origin: LocationPoint;
  destination: LocationPoint;
  isIntercity: boolean;
  serviceAreaValid: boolean;
  isApproximateFallback?: boolean;
  routingError?: string;
}

export interface FareCalculation {
  roadDistanceKm: number;
  vehicleType: 'BIKE' | 'CAR';
  ratePerKm: number;
  baseFare: number;
  fareAmount: number;
  formattedFare: string;
  isApproximateEstimate?: boolean;
}

/**
 * Provider Abstraction Interface
 */
export interface LocationProvider {
  name: string;
  reverseGeocode(lat: number, lng: number): Promise<LocationPoint>;
  searchLocations(query: string, currentContext?: { lat: number; lng: number }): Promise<LocationPoint[]>;
  calculateRoadRoute(origin: LocationPoint, destination: LocationPoint): Promise<RouteInfo>;
}

// Configurable vehicle rates (default Bike: ₹2.5/km, Car: ₹4.5/km)
export const VEHICLE_RATES = {
  BIKE: Number(process.env.BIKE_RATE_PER_KM || 2.5),
  CAR: Number(process.env.CAR_RATE_PER_KM || 4.5),
};

// Popular locations with accurate GPS coordinates for Indore, Dewas, and Ujjain
export const POPULAR_LOCATIONS: LocationPoint[] = [
  // INDORE
  { placeName: 'Vijay Nagar Square', formattedAddress: 'Vijay Nagar Square, AB Road, Indore, MP', city: 'Indore', area: 'Vijay Nagar', latitude: 22.7533, longitude: 75.8937 },
  { placeName: 'Rajwada Palace & Sarafa', formattedAddress: 'Rajwada Palace, MG Road, Indore, MP', city: 'Indore', area: 'Rajwada', latitude: 22.7196, longitude: 75.8577 },
  { placeName: 'Palasia Square & High Court', formattedAddress: 'Palasia Square, AB Road, Indore, MP', city: 'Indore', area: 'Palasia', latitude: 22.7244, longitude: 75.8839 },
  { placeName: 'Dewas Naka / Niranjanpur', formattedAddress: 'Dewas Naka Square, MR-10, Indore, MP', city: 'Indore', area: 'Niranjanpur', latitude: 22.7758, longitude: 75.8992 },
  { placeName: 'Sukhlia & MR-10 Crossing', formattedAddress: 'Sukhlia Square, MR-10 Road, Indore, MP', city: 'Indore', area: 'Sukhlia', latitude: 22.7601, longitude: 75.8755 },
  { placeName: 'Super Corridor / ISBT', formattedAddress: 'Super Corridor ISBT Terminal, Indore, MP', city: 'Indore', area: 'Super Corridor', latitude: 22.7482, longitude: 75.8166 },
  { placeName: 'LIG Circle & Anoop Nagar', formattedAddress: 'LIG Circle, AB Road, Indore, MP', city: 'Indore', area: 'LIG Circle', latitude: 22.7341, longitude: 75.8872 },
  { placeName: 'Chappan Dukan & Janpath', formattedAddress: 'Chappan Dukan, New Palasia, Indore, MP', city: 'Indore', area: 'New Palasia', latitude: 22.7235, longitude: 75.8791 },
  { placeName: 'Sarwate Bus Stand & Railway Station', formattedAddress: 'Indore Junction Railway Station, Indore, MP', city: 'Indore', area: 'Sarwate', latitude: 22.7153, longitude: 75.8654 },
  { placeName: 'Bada Ganpati & Krishnapura', formattedAddress: 'Bada Ganpati Circle, Airport Road, Indore, MP', city: 'Indore', area: 'Bada Ganpati', latitude: 22.7230, longitude: 75.8458 },
  { placeName: 'Gulawat Lotus Valley', formattedAddress: 'Gulawat Lotus Valley, Hatod, Indore, MP', city: 'Indore', area: 'Gulawat', latitude: 22.8423, longitude: 75.7481 },
  { placeName: 'Pipliyapala Regional Park', formattedAddress: 'Regional Park, Ring Road, Indore, MP', city: 'Indore', area: 'Pipliyapala', latitude: 22.6841, longitude: 75.8624 },
  { placeName: 'Rau Circle & IPS Academy', formattedAddress: 'Rau Circle, AB Road, Indore, MP', city: 'Indore', area: 'Rau', latitude: 22.6378, longitude: 75.8239 },

  // DEWAS
  { placeName: 'Mata Tekri & Ropeway Station', formattedAddress: 'Chamunda Mata Tekri, Dewas, MP', city: 'Dewas', area: 'Tekri', latitude: 22.9698, longitude: 76.0601 },
  { placeName: 'Dewas Bus Stand & Station', formattedAddress: 'Dewas Main Bus Stand, Station Road, Dewas, MP', city: 'Dewas', area: 'Station Area', latitude: 22.9612, longitude: 76.0520 },
  { placeName: 'Industrial Area Phase 1 & 2', formattedAddress: 'Industrial Area, AB Road, Dewas, MP', city: 'Dewas', area: 'Industrial Area', latitude: 22.9430, longitude: 76.0400 },
  { placeName: 'Nagda Hills & Observatory', formattedAddress: 'Nagda Hills View Point, Dewas, MP', city: 'Dewas', area: 'Nagda Hills', latitude: 22.9850, longitude: 76.0820 },
  { placeName: 'Shankargarh Hills Eco Park', formattedAddress: 'Shankargarh Hills, Dewas, MP', city: 'Dewas', area: 'Shankargarh', latitude: 22.9310, longitude: 76.0850 },
  { placeName: 'Bank Note Press (BNP) Colony', formattedAddress: 'BNP Campus, Station Road, Dewas, MP', city: 'Dewas', area: 'BNP Colony', latitude: 22.9730, longitude: 76.0450 },
  { placeName: 'Sayaji Gate & Lal Gate', formattedAddress: 'Sayaji Gate Circle, Dewas, MP', city: 'Dewas', area: 'City Center', latitude: 22.9645, longitude: 76.0585 },
  { placeName: 'Kshipra Dam & Ghats', formattedAddress: 'Kshipra River Ghats, Dewas Bypass, Dewas, MP', city: 'Dewas', area: 'Kshipra', latitude: 22.9150, longitude: 75.9890 },

  // UJJAIN
  { placeName: 'Mahakaleshwar Jyotirlinga (Mahakal Lok)', formattedAddress: 'Mahakaleshwar Temple Corridor, Ujjain, MP', city: 'Ujjain', area: 'Mahakal Lok', latitude: 23.1827, longitude: 75.7682 },
  { placeName: 'Ram Ghat & Kshipra River', formattedAddress: 'Ram Ghat, Kshipra River, Ujjain, MP', city: 'Ujjain', area: 'Ram Ghat', latitude: 23.1848, longitude: 75.7634 },
  { placeName: 'Ujjain Junction Railway Station', formattedAddress: 'Ujjain Junction Railway Station, Ujjain, MP', city: 'Ujjain', area: 'Station Road', latitude: 23.1802, longitude: 75.7865 },
  { placeName: 'Kal Bhairav Temple', formattedAddress: 'Kal Bhairav Temple, Bhairavgarh, Ujjain, MP', city: 'Ujjain', area: 'Bhairavgarh', latitude: 23.2140, longitude: 75.7628 },
  { placeName: 'Freeganj & Tower Square', formattedAddress: 'Tower Square, Freeganj, Ujjain, MP', city: 'Ujjain', area: 'Freeganj', latitude: 23.1745, longitude: 75.7891 },
  { placeName: 'Nanakheda Bus Stand', formattedAddress: 'Nanakheda Bus Stand, Indore Road, Ujjain, MP', city: 'Ujjain', area: 'Nanakheda', latitude: 23.1530, longitude: 75.7840 },
  { placeName: 'Sandipani Ashram', formattedAddress: 'Sandipani Ashram, Mangalnath Road, Ujjain, MP', city: 'Ujjain', area: 'Ankapat', latitude: 23.2045, longitude: 75.7812 },
  { placeName: 'Vikram University Campus', formattedAddress: 'Vikram University, Dewas Road, Ujjain, MP', city: 'Ujjain', area: 'University Area', latitude: 23.1650, longitude: 75.7980 },
];

function getGoogleMapsApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.MAPS_API_KEY ||
    ''
  );
}

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function extractCityFromAddressComponents(components: any[]): string | null {
  if (!components) return null;
  for (const comp of components) {
    if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')) {
      if (comp.long_name.toLowerCase().includes('indore')) return 'Indore';
      if (comp.long_name.toLowerCase().includes('dewas')) return 'Dewas';
      if (comp.long_name.toLowerCase().includes('ujjain')) return 'Ujjain';
      return comp.long_name;
    }
  }
  return null;
}

function detectCityFromText(text: string): 'Indore' | 'Dewas' | 'Ujjain' {
  const t = text.toLowerCase();
  if (t.includes('dewas')) return 'Dewas';
  if (t.includes('ujjain')) return 'Ujjain';
  return 'Indore';
}

/**
 * Fetch precise place details (lat/lng) for a Google place_id
 */
async function fetchGooglePlaceDetails(placeId: string, apiKey: string): Promise<{ lat: number; lng: number; formatted_address?: string } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && data.result?.geometry?.location) {
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
          formatted_address: data.result.formatted_address,
        };
      }
    }
  } catch (err) {
    console.warn('Place details fetch error:', err);
  }
  return null;
}

/**
 * OpenStreetMap / Nominatim + OSRM Provider for high accuracy without Google API key requirement
 */
export const NominatimProvider: LocationProvider = {
  name: 'OpenStreetMap Nominatim + OSRM Routing',
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationPoint> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'RideWithMe-CarpoolApp/1.0' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.county || detectCityFromCoords(latitude, longitude);
          const placeName = addr.amenity || addr.building || addr.road || addr.suburb || addr.neighbourhood || addr.amenity || data.display_name.split(',')[0] || `Location near ${city}`;

          return {
            latitude,
            longitude,
            placeName,
            formattedAddress: data.display_name,
            city: detectCityFromText(`${city} ${data.display_name}`),
          };
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocode error:', err);
    }

    const city = detectCityFromCoords(latitude, longitude);
    return {
      latitude,
      longitude,
      placeName: `Point (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
      formattedAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}, ${city}`,
      city,
    };
  },

  async searchLocations(query: string, currentContext?: { lat: number; lng: number }): Promise<LocationPoint[]> {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const presetMatches = POPULAR_LOCATIONS.filter(
      loc =>
        loc.placeName.toLowerCase().includes(q) ||
        loc.formattedAddress.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        (loc.area && loc.area.toLowerCase().includes(q))
    );

    try {
      // Priority search bounded around MP region (Indore/Dewas/Ujjain box: 75.0,22.0 to 76.5,23.5)
      const searchQuery = q.includes('indore') || q.includes('dewas') || q.includes('ujjain') || q.includes('mp') || q.includes('madhya pradesh')
        ? q
        : `${q}, Madhya Pradesh, India`;

      const viewbox = currentContext
        ? `&viewbox=${currentContext.lng - 0.5},${currentContext.lat - 0.5},${currentContext.lng + 0.5},${currentContext.lat + 0.5}`
        : '&viewbox=75.0,22.0,76.5,23.5';

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=8&addressdetails=1${viewbox}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'RideWithMe-CarpoolApp/1.0' },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const apiResults: LocationPoint[] = data.map((item: any) => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.county || detectCityFromCoords(parseFloat(item.lat), parseFloat(item.lon));
            const placeName = item.display_name.split(',')[0];
            return {
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              placeName,
              formattedAddress: item.display_name,
              city: detectCityFromText(`${city} ${item.display_name}`),
            };
          });

          const combined = [...presetMatches];
          for (const item of apiResults) {
            if (!combined.some(c => c.placeName.toLowerCase() === item.placeName.toLowerCase())) {
              combined.push(item);
            }
          }
          return combined.slice(0, 10);
        }
      }
    } catch (err) {
      console.warn('Nominatim search error:', err);
    }

    return presetMatches;
  },

  async calculateRoadRoute(origin: LocationPoint, destination: LocationPoint): Promise<RouteInfo> {
    const isIntercity = origin.city.toLowerCase() !== destination.city.toLowerCase();
    const serviceAreaValid = validateServiceArea(origin, destination);

    try {
      // OSRM public routing engine for road distance
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = Math.max(0.5, Math.round((route.distance / 1000) * 10) / 10);
          const durationMins = Math.max(2, Math.round(route.duration / 60));
          const polylineCoords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] // convert [lng, lat] to [lat, lng]
          );

          return {
            distanceKm,
            durationMins,
            formattedDistance: `${distanceKm} km`,
            formattedDuration: `${durationMins} min`,
            polylineCoords,
            origin,
            destination,
            isIntercity,
            serviceAreaValid,
            isApproximateFallback: false,
          };
        }
      }
    } catch (err) {
      console.warn('OSRM routing error:', err);
    }

    // Fallback haversine route with road factor (1.25x)
    const haversineDist = computeHaversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    const distanceKm = Math.max(0.5, Math.round(haversineDist * 1.25 * 10) / 10);
    const durationMins = Math.max(3, Math.round((distanceKm / 35) * 60));

    return {
      distanceKm,
      durationMins,
      formattedDistance: `~${distanceKm} km (Approximate)`,
      formattedDuration: `~${durationMins} min`,
      polylineCoords: [
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude],
      ],
      origin,
      destination,
      isIntercity,
      serviceAreaValid,
      isApproximateFallback: true,
      routingError: 'Using estimated road route.',
    };
  },
};

/**
 * Google Maps Platform Provider Implementation
 */
export const GoogleMapsProvider: LocationProvider = {
  name: 'Google Maps Platform (Places + Geocoding + Directions)',
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationPoint> {
    const apiKey = getGoogleMapsApiKey();
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const first = data.results[0];
            const city = extractCityFromAddressComponents(first.address_components) || detectCityFromCoords(latitude, longitude);
            const placeName = first.address_components[0]?.long_name || `Location near ${city}`;

            return {
              latitude,
              longitude,
              placeName,
              formattedAddress: first.formatted_address || `${placeName}, ${city}`,
              city,
              placeId: first.place_id,
            };
          }
        }
      } catch (err) {
        console.warn('Google reverse geocoding network warning:', err);
      }
    }

    // Fall back to Nominatim provider for reverse geocoding if Google API key is missing or fails
    return NominatimProvider.reverseGeocode(latitude, longitude);
  },

  async searchLocations(query: string, currentContext?: { lat: number; lng: number }): Promise<LocationPoint[]> {
    const q = query.toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const presetMatches = POPULAR_LOCATIONS.filter(
      loc =>
        loc.placeName.toLowerCase().includes(q) ||
        loc.formattedAddress.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        (loc.area && loc.area.toLowerCase().includes(q))
    );

    const apiKey = getGoogleMapsApiKey();
    if (apiKey) {
      try {
        const locationBias = currentContext
          ? `&location=${currentContext.lat},${currentContext.lng}&radius=50000`
          : '&location=22.7196,75.8577&radius=60000'; // Default bias around Indore region

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&components=country:in${locationBias}&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'OK' && data.predictions) {
            // For top Google place predictions, fetch real details for exact lat/lng
            const topPredictions = data.predictions.slice(0, 6);
            const apiResults: LocationPoint[] = [];

            for (const p of topPredictions) {
              const placeName = p.structured_formatting?.main_text || p.description.split(',')[0];
              const city = detectCityFromText(p.description);
              
              // Fetch real coordinates via Place Details
              const details = await fetchGooglePlaceDetails(p.place_id, apiKey);
              if (details) {
                apiResults.push({
                  latitude: details.lat,
                  longitude: details.lng,
                  placeName,
                  formattedAddress: details.formatted_address || p.description,
                  city,
                  placeId: p.place_id,
                });
              } else {
                // Fallback to preset if close, or search Nominatim for this item
                const preset = POPULAR_LOCATIONS.find(pl => pl.placeName.toLowerCase() === placeName.toLowerCase());
                apiResults.push({
                  latitude: preset ? preset.latitude : 22.7196,
                  longitude: preset ? preset.longitude : 75.8577,
                  placeName,
                  formattedAddress: p.description,
                  city,
                  placeId: p.place_id,
                });
              }
            }

            const combined = [...presetMatches];
            for (const item of apiResults) {
              if (!combined.some(c => c.placeName.toLowerCase() === item.placeName.toLowerCase())) {
                combined.push(item);
              }
            }
            return combined.slice(0, 10);
          }
        }
      } catch (err) {
        console.warn('Google Places autocomplete search warning:', err);
      }
    }

    // Fall back to Nominatim provider if Google key not set
    return NominatimProvider.searchLocations(query, currentContext);
  },

  async calculateRoadRoute(origin: LocationPoint, destination: LocationPoint): Promise<RouteInfo> {
    const isIntercity = origin.city.toLowerCase() !== destination.city.toLowerCase();
    const serviceAreaValid = validateServiceArea(origin, destination);

    const apiKey = getGoogleMapsApiKey();
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'OK' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const leg = route.legs[0];
            const distanceKm = Math.max(0.5, Math.round((leg.distance.value / 1000) * 10) / 10);
            const durationMins = Math.max(2, Math.round(leg.duration.value / 60));
            const polylineCoords = decodePolyline(route.overview_polyline.points);

            return {
              distanceKm,
              durationMins,
              formattedDistance: leg.distance.text || `${distanceKm} km`,
              formattedDuration: leg.duration.text || `${durationMins} min`,
              polylineCoords,
              origin,
              destination,
              isIntercity,
              serviceAreaValid,
              isApproximateFallback: false,
            };
          }
        }
      } catch (err: any) {
        console.warn('Google Directions API routing warning:', err?.message || err);
      }
    }

    // Fall back to OSRM / Nominatim provider routing
    return NominatimProvider.calculateRoadRoute(origin, destination);
  },
};

/**
 * Get active provider — returns GoogleMapsProvider if API key present, else NominatimProvider
 */
export function getActiveLocationProvider(): LocationProvider {
  return getGoogleMapsApiKey() ? GoogleMapsProvider : NominatimProvider;
}

/**
 * Requirement 2: Accuracy Level Classification
 * - ≤ 30 m: Excellent
 * - 31–50 m: Good
 * - 51–100 m: Approximate
 * - > 100 m: Low accuracy
 */
export function getAccuracyLevel(accuracyInMeters?: number | null): GPSAccuracyLevel {
  if (accuracyInMeters === undefined || accuracyInMeters === null) return 'Unavailable';
  if (accuracyInMeters <= 30) return 'Excellent';
  if (accuracyInMeters <= 50) return 'Good';
  if (accuracyInMeters <= 100) return 'Approximate';
  return 'Low';
}

/**
 * Requirement 1: Improved GPS Location Detection
 * Multi-sample GPS watching: Continues watching position for 4 seconds or until accuracy <= 30m,
 * selecting the result with lowest accuracy radius (most precise).
 */
export async function getCurrentGPSLocation(): Promise<GPSResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      location: null,
      accuracy: null,
      accuracyLevel: 'Unavailable',
      error: 'Geolocation is not supported by your browser or device.',
    };
  }

  return new Promise(resolve => {
    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;

    const stopWatchingAndResolve = async (positionToUse: GeolocationPosition | null, errorMsg?: string) => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }

      if (!positionToUse) {
        resolve({
          location: null,
          accuracy: null,
          accuracyLevel: 'Unavailable',
          error: errorMsg || 'Unable to detect accurate GPS location.',
        });
        return;
      }

      const { latitude, longitude, accuracy } = positionToUse.coords;
      const accuracyLevel = getAccuracyLevel(accuracy);
      const location = await reverseGeocode(latitude, longitude);
      location.accuracy = Math.round(accuracy);

      resolve({
        location,
        accuracy: Math.round(accuracy),
        accuracyLevel,
      });
    };

    // Watch position for 4 seconds to get the best accuracy sample
    const maxWatchTimeTimer = setTimeout(() => {
      stopWatchingAndResolve(bestPosition);
    }, 4000);

    watchId = navigator.geolocation.watchPosition(
      position => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        // If accuracy is Excellent (<= 30 meters), resolve immediately
        if (position.coords.accuracy <= 30) {
          clearTimeout(maxWatchTimeTimer);
          stopWatchingAndResolve(position);
        }
      },
      error => {
        let msg = 'Unable to detect location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please select your location on the map or search above.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS signal is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }

        if (bestPosition) {
          clearTimeout(maxWatchTimeTimer);
          stopWatchingAndResolve(bestPosition);
        } else {
          clearTimeout(maxWatchTimeTimer);
          stopWatchingAndResolve(null, msg);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0, // Fresh coordinates only
      }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<LocationPoint> {
  const provider = getActiveLocationProvider();
  return provider.reverseGeocode(lat, lng);
}

export async function searchLocations(query: string, currentContext?: { lat: number; lng: number }): Promise<LocationPoint[]> {
  const provider = getActiveLocationProvider();
  return provider.searchLocations(query, currentContext);
}

export async function calculateRoadRoute(origin: LocationPoint, destination: LocationPoint): Promise<RouteInfo> {
  const provider = getActiveLocationProvider();
  return provider.calculateRoadRoute(origin, destination);
}

export function calculateFare(roadDistanceKm: number, vehicleType: 'BIKE' | 'CAR', isApproximate?: boolean): FareCalculation {
  const ratePerKm = vehicleType === 'BIKE' ? VEHICLE_RATES.BIKE : VEHICLE_RATES.CAR;
  const baseFare = vehicleType === 'BIKE' ? 10 : 20;

  const rawFare = Math.max(baseFare, roadDistanceKm * ratePerKm);
  const fareAmount = Math.round(rawFare * 10) / 10;

  return {
    roadDistanceKm,
    vehicleType,
    ratePerKm,
    baseFare,
    fareAmount,
    formattedFare: `₹${fareAmount.toFixed(2)}${isApproximate ? ' (Est.)' : ''}`,
    isApproximateEstimate: isApproximate,
  };
}

export function validateServiceArea(origin: LocationPoint, destination: LocationPoint): boolean {
  const allowedCities = ['indore', 'dewas', 'ujjain'];
  const originCity = (origin.city || detectCityFromCoords(origin.latitude, origin.longitude)).toLowerCase();
  const destCity = (destination.city || detectCityFromCoords(destination.latitude, destination.longitude)).toLowerCase();

  const isOriginAllowed = allowedCities.some(c => originCity.includes(c));
  const isDestAllowed = allowedCities.some(c => destCity.includes(c));

  return isOriginAllowed && isDestAllowed;
}

export function detectCityFromCoords(lat: number, lng: number): 'Indore' | 'Dewas' | 'Ujjain' {
  if (lat >= 22.88 && lat <= 23.05 && lng >= 75.98 && lng <= 76.15) return 'Dewas';
  if (lat >= 23.10 && lat <= 23.28 && lng >= 75.70 && lng <= 75.85) return 'Ujjain';
  return 'Indore';
}

export async function resolveLocationString(locationStr: string): Promise<LocationPoint | null> {
  if (!locationStr || !locationStr.trim()) return null;
  const q = locationStr.trim().toLowerCase();
  
  const preset = POPULAR_LOCATIONS.find(
    p => p.placeName.toLowerCase() === q || p.formattedAddress.toLowerCase().includes(q) || p.placeName.toLowerCase().includes(q)
  );
  if (preset) return preset;

  const results = await searchLocations(locationStr);
  if (results.length > 0) return results[0];

  return {
    latitude: 22.7196,
    longitude: 75.8577,
    placeName: locationStr,
    formattedAddress: `${locationStr}, MP`,
    city: 'Indore',
  };
}

function computeHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findClosestPreset(lat: number, lng: number) {
  let minDistance = Infinity;
  let closest: LocationPoint | null = null;
  for (const preset of POPULAR_LOCATIONS) {
    const dist = computeHaversineDistance(lat, lng, preset.latitude, preset.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = preset;
    }
  }
  return closest ? { location: closest, distanceKm: minDistance } : null;
}

