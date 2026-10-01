export interface PublishedRide {
  id: string;
  driver_id?: string;
  driver_name: string;
  driver_rating: number;
  vehicle: string;
  vehicle_number?: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  is_verified: boolean;
  status?: 'PUBLISHED' | 'FULL' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  postedAt?: string;
}

export interface BookingRecord {
  id: string;
  ride_id: string;
  passenger_id?: string;
  passenger_name: string;
  passenger_phone?: string;
  seats: number;
  fareAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  booking_otp: string;
  booking_otp_expires_at: string;
  verified_at?: string;
  created_at: string;
  origin: string;
  destination: string;
  departure_time: string;
  driver_name: string;
  driver_phone?: string;
  vehicle: string;
}

export interface AuthOtpRecord {
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  verified: boolean;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING_CONFIRMED' | 'PASSENGER_VERIFIED' | 'RIDE_STATUS' | 'OTP_SENT' | 'CANCELLATION';
  read: boolean;
  createdAt: string;
}

// Global in-memory storage singletons (fallback and instant runtime cache)
export const publishedRidesStore: PublishedRide[] = [];
export const bookingsStore: BookingRecord[] = [];
export const authOtpStore: Record<string, AuthOtpRecord> = {};
export const notificationsStore: NotificationRecord[] = [];

// Helper functions for atomic store manipulation
export function getRideById(id: string): PublishedRide | undefined {
  return publishedRidesStore.find(r => r.id === id);
}

export function createBooking(params: {
  rideId: string;
  seats: number;
  passengerName: string;
  passengerPhone?: string;
  passengerId?: string;
  fareAmount: number;
}): { success: boolean; booking?: BookingRecord; error?: string } {
  const ride = publishedRidesStore.find(r => r.id === params.rideId);
  if (!ride) {
    return { success: false, error: 'Ride not found.' };
  }

  if (ride.status === 'CANCELLED' || ride.status === 'COMPLETED') {
    return { success: false, error: 'This ride is no longer active.' };
  }

  if (ride.available_seats < params.seats) {
    return { success: false, error: `Only ${ride.available_seats} seat(s) available.` };
  }

  // Generate 6-digit secure booking OTP
  const bookingOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const bookingId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Atomically reduce available seats
  ride.available_seats -= params.seats;
  if (ride.available_seats <= 0) {
    ride.status = 'FULL';
  }

  const newBooking: BookingRecord = {
    id: bookingId,
    ride_id: ride.id,
    passenger_id: params.passengerId || 'anon_passenger',
    passenger_name: params.passengerName,
    passenger_phone: params.passengerPhone || '+91 98765 43210',
    seats: params.seats,
    fareAmount: params.fareAmount,
    status: 'CONFIRMED',
    booking_otp: bookingOtp,
    booking_otp_expires_at: expiresAt,
    created_at: new Date().toISOString(),
    origin: ride.origin,
    destination: ride.destination,
    departure_time: ride.departure_time,
    driver_name: ride.driver_name,
    driver_phone: '+91 99887 76655',
    vehicle: ride.vehicle,
  };

  bookingsStore.unshift(newBooking);

  // Add notifications
  notificationsStore.unshift({
    id: `notif_${Date.now()}_1`,
    userId: params.passengerId || 'anon_passenger',
    title: 'Booking Confirmed!',
    message: `Your ride from ${ride.origin} to ${ride.destination} is confirmed. Boarding PIN: ${bookingOtp}`,
    type: 'BOOKING_CONFIRMED',
    read: false,
    createdAt: new Date().toISOString(),
  });

  return { success: true, booking: newBooking };
}

export function verifyBookingOtp(bookingId: string, inputOtp: string): { success: boolean; message: string } {
  const booking = bookingsStore.find(b => b.id === bookingId);
  if (!booking) {
    return { success: false, message: 'Booking not found.' };
  }

  if (booking.status === 'CANCELLED') {
    return { success: false, message: 'This booking has been cancelled and cannot be verified.' };
  }

  if (booking.status === 'VERIFIED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
    return { success: false, message: 'This passenger has already been verified.' };
  }

  if (new Date(booking.booking_otp_expires_at).getTime() < Date.now()) {
    return { success: false, message: 'Booking OTP has expired.' };
  }

  if (booking.booking_otp !== inputOtp.trim()) {
    return { success: false, message: 'Invalid OTP entered. Please check the passenger PIN.' };
  }

  // Update status to VERIFIED
  booking.status = 'VERIFIED';
  booking.verified_at = new Date().toISOString();

  // Add notification
  notificationsStore.unshift({
    id: `notif_${Date.now()}_2`,
    userId: booking.passenger_id || 'anon_passenger',
    title: 'Passenger Verified ✓',
    message: `Driver ${booking.driver_name} verified your boarding PIN. Have a safe journey!`,
    type: 'PASSENGER_VERIFIED',
    read: false,
    createdAt: new Date().toISOString(),
  });

  return { success: true, message: 'Passenger verified successfully! Boarding confirmed.' };
}

export function cancelBooking(bookingId: string): { success: boolean; message: string } {
  const booking = bookingsStore.find(b => b.id === bookingId);
  if (!booking) {
    return { success: false, message: 'Booking not found.' };
  }

  if (booking.status === 'CANCELLED') {
    return { success: false, message: 'Booking is already cancelled.' };
  }

  if (booking.status === 'COMPLETED') {
    return { success: false, message: 'Completed bookings cannot be cancelled.' };
  }

  booking.status = 'CANCELLED';

  // Restore available seats on ride
  const ride = publishedRidesStore.find(r => r.id === booking.ride_id);
  if (ride) {
    ride.available_seats += booking.seats;
    if (ride.status === 'FULL') {
      ride.status = 'PUBLISHED';
    }
  }

  notificationsStore.unshift({
    id: `notif_${Date.now()}_3`,
    userId: booking.passenger_id || 'anon_passenger',
    title: 'Booking Cancelled',
    message: `Your booking for ${booking.origin} to ${booking.destination} has been cancelled.`,
    type: 'CANCELLATION',
    read: false,
    createdAt: new Date().toISOString(),
  });

  return { success: true, message: 'Booking cancelled successfully.' };
}
