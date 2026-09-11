/**
 * Location Service for Ride With Me
 * Standardized module for GPS, Geocoding, Popular Locations, OSRM Road Distance,
 * Provider Abstraction, Fare Calculation, and Service Area Validation.
 */

export interface LocationPoint {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeName: string;
  city: 'Indore' | 'Dewas' | 'Ujjain' | string;
  area?: string;
  accuracy?: number; // in meters
}

export type GPSAccuracyLevel = 'Excellent' | 'Approximate' | 'Low' | 'Unavailable';

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
  searchLocations(query: string): Promise<LocationPoint[]>;
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

/**
 * OpenStreetMap + OSRM Provider Implementation
 */
export const OpenStreetMapProvider: LocationProvider = {
  name: 'OpenStreetMap + Leaflet + OSRM',
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationPoint> {
    const matchedPreset = findClosestPreset(latitude, longitude);
    if (matchedPreset && matchedPreset.distanceKm < 0.8) {
      return { ...matchedPreset.location, latitude, longitude };
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RideWithMe-App/1.0' } });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || detectCityFromCoords(latitude, longitude);
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
        const placeName = suburb ? `${suburb}, ${city}` : data.display_name.split(',')[0] || `${city} Area`;

        return {
          latitude,
          longitude,
          placeName,
          formattedAddress: data.display_name || `${placeName}, ${city}`,
          city,
          area: suburb || city,
        };
      }
    } catch {
      // Fallback handled below
    }

    const city = detectCityFromCoords(latitude, longitude);
    return {
      latitude,
      longitude,
      placeName: `Location near ${city}`,
      formattedAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}, ${city}`,
      city,
    };
  },

  async searchLocations(query: string): Promise<LocationPoint[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const presetMatches = POPULAR_LOCATIONS.filter(
      loc =>
        loc.placeName.toLowerCase().includes(q) ||
        loc.formattedAddress.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        (loc.area && loc.area.toLowerCase().includes(q))
    );

    if (presetMatches.length >= 4) return presetMatches;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ' Madhya Pradesh India'
      )}&limit=6&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'RideWithMe-App/1.0' } });
      if (res.ok) {
        const items = await res.json();
        const apiResults: LocationPoint[] = items.map((item: any) => {
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.village || detectCityFromCoords(parseFloat(item.lat), parseFloat(item.lon));
          const placeName = item.display_name.split(',')[0];
          return {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            placeName,
            formattedAddress: item.display_name,
            city,
            area: addr.suburb || addr.neighbourhood || city,
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
    } catch {
      // Return matching presets if network fails
    }

    return presetMatches;
  },

  async calculateRoadRoute(origin: LocationPoint, destination: LocationPoint): Promise<RouteInfo> {
    const isIntercity = origin.city.toLowerCase() !== destination.city.toLowerCase();
    const serviceAreaValid = validateServiceArea(origin, destination);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = Math.max(0.5, Math.round((route.distance / 1000) * 10) / 10);
          const durationMins = Math.max(2, Math.round(route.duration / 60));
          const polylineCoords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );

          return {
            distanceKm,
            durationMins,
            formattedDistance: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`,
            formattedDuration: durationMins >= 60 ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` : `${durationMins} min`,
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
      console.warn('OSRM routing network error:', err?.message || err);
    }

    // Explicit Fallback labeled as Approximate
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
      routingError: 'Unable to calculate precise road route right now. Displaying approximate distance.',
    };
  },
};

/**
 * Provider Manager configured via LOCATION_PROVIDER env var
 */
export function getActiveLocationProvider(): LocationProvider {
  const providerType = process.env.LOCATION_PROVIDER || 'osm';
  if (providerType === 'osm') {
    return OpenStreetMapProvider;
  }
  return OpenStreetMapProvider;
}

export function getAccuracyLevel(accuracyInMeters?: number | null): GPSAccuracyLevel {
  if (accuracyInMeters === undefined || accuracyInMeters === null) return 'Unavailable';
  if (accuracyInMeters <= 30) return 'Excellent';
  if (accuracyInMeters <= 100) return 'Approximate';
  return 'Low';
}

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
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude, accuracy } = position.coords;
        const accuracyLevel = getAccuracyLevel(accuracy);
        const location = await reverseGeocode(latitude, longitude);
        location.accuracy = Math.round(accuracy);

        resolve({
          location,
          accuracy: Math.round(accuracy),
          accuracyLevel,
        });
      },
      error => {
        let msg = 'Unable to detect location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can search for your pickup location or select it manually on the map.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again or select manually.';
        }
        resolve({
          location: null,
          accuracy: null,
          accuracyLevel: 'Unavailable',
          error: msg,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<LocationPoint> {
  const provider = getActiveLocationProvider();
  return provider.reverseGeocode(lat, lng);
}

export async function searchLocations(query: string): Promise<LocationPoint[]> {
  const provider = getActiveLocationProvider();
  return provider.searchLocations(query);
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

