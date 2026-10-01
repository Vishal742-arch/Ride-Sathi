import { track } from '@vercel/analytics';

export type EventName =
  // Acquisition
  | 'page_view'
  | 'landing_page_view'
  | 'referral_visit'
  // Authentication
  | 'signup_started'
  | 'signup_completed'
  | 'login_started'
  | 'login_completed'
  | 'logout'
  // Main Actions
  | 'find_ride_clicked'
  | 'offer_ride_clicked'
  | 'ride_search_started'
  | 'ride_search_completed'
  | 'ride_details_viewed'
  // Ride Offering
  | 'offer_ride_started'
  | 'offer_ride_completed'
  | 'ride_posted'
  // Booking
  | 'booking_started'
  | 'booking_completed'
  | 'booking_cancelled'
  // Communication
  | 'contact_partner_clicked'
  | 'communication_started'
  // Ride Completion
  | 'ride_started'
  | 'ride_completed'
  | 'ride_cancelled';

export interface EventProperties {
  vehicle_type?: 'bike' | 'car' | string;
  trip_type?: 'local' | 'intercity' | string;
  origin_city?: string;
  destination_city?: string;
  approximate_route?: string;
  number_of_seats?: number;
  ride_status?: string;
  search_result_count?: number;
  [key: string]: any;
}

// Allowed safe property keys (STRICT PII Guard)
const SAFE_PROPERTY_KEYS = new Set([
  'vehicle_type',
  'trip_type',
  'origin_city',
  'destination_city',
  'approximate_route',
  'number_of_seats',
  'ride_status',
  'search_result_count',
]);

// Memory map for deduplication within the current browser session
const firedEvents = new Set<string>();

/**
 * Sanitizes properties to strictly ensure no PII or sensitive data is logged.
 */
function sanitizeProperties(props?: EventProperties): Record<string, string | number | boolean> {
  if (!props || typeof props !== 'object') return {};

  const clean: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(props)) {
    if (!SAFE_PROPERTY_KEYS.has(key)) continue;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Central event tracking function.
 * Safely dispatches events to Vercel Analytics and Microsoft Clarity.
 */
export function trackEvent(
  eventName: EventName,
  properties?: EventProperties,
  options: { deduplicate?: boolean; dedupeKey?: string } = {}
): void {
  try {
    if (typeof window === 'undefined') return;

    // Handle deduplication if specified
    if (options.deduplicate) {
      const key = options.dedupeKey || eventName;
      if (firedEvents.has(key)) return;
      firedEvents.add(key);
    }

    const sanitizedProps = sanitizeProperties(properties);

    // 1. Vercel Analytics track
    try {
      track(eventName, sanitizedProps);
    } catch {
      // Ignore Vercel Analytics dispatch errors silently
    }

    // 2. Microsoft Clarity event trigger
    try {
      const clarity = (window as any).clarity;
      if (typeof clarity === 'function') {
        clarity('event', eventName);
      }
    } catch {
      // Ignore Clarity dispatch errors silently
    }
  } catch {
    // Fail gracefully: Analytics errors MUST NEVER break the application
  }
}
