'use client';
import { CheckCircle2, KeyRound, ShieldCheck, X, Banknote, AlertCircle, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';
import { PassengerSelector } from '@/components/passenger-selector';

interface RideBookingModalProps {
  ride: {
    id: string;
    driver_name: string;
    origin: string;
    destination: string;
    departure_time: string;
    price_per_seat: number;
    available_seats?: number;
    vehicle?: string;
  };
  initialSeats?: number;
  onClose: () => void;
}

export function RideBookingModal({ ride, initialSeats = 1, onClose }: RideBookingModalProps) {
  const [seats, setSeats] = useState(Math.min(initialSeats, ride.available_seats || 4));
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    bookingOtp: string;
    fareAmount: number;
    seats: number;
    status: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    trackEvent('booking_started', {
      origin_city: ride.origin,
      destination_city: ride.destination,
      number_of_seats: seats,
    });
  }, [ride.origin, ride.destination]);

  const totalFare = ride.price_per_seat * seats;

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rides/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: ride.id,
          seats,
          passengerName: passengerName.trim() || undefined,
          passengerPhone: passengerPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to confirm booking. Please try again.');
        setLoading(false);
        return;
      }
      trackEvent('booking_completed', {
        origin_city: ride.origin,
        destination_city: ride.destination,
        number_of_seats: seats,
      });
      setBookingResult({
        bookingId: data.bookingId,
        bookingOtp: data.bookingOtp || data.tripPin,
        fareAmount: data.fareAmount,
        seats,
        status: data.status || 'CONFIRMED',
      });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingResult) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingResult.bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookingResult(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      } else {
        alert(data.error || 'Failed to cancel booking.');
      }
    } catch {
      alert('Network error canceling booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div className="privacy-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, borderRadius: 24, overflow: 'hidden' }}>
        {!bookingResult ? (
          <>
            <div className="privacy-modal-header" style={{ background: '#0f172a', color: '#fff', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#087c64', display: 'grid', placeItems: 'center', color: '#fff' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>Book Your Ride Seat</h3>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{ride.origin} ➔ {ride.destination}</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto' }}>
                <X size={20} />
              </button>
            </div>

            <div className="privacy-modal-body" style={{ padding: 24, display: 'grid', gap: 18 }}>
              {/* Ride Summary & Location Confirmation */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px border #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, display: 'block' }}>ROUTE</span>
                    <strong style={{ fontSize: 14, color: '#0f172a' }}>📍 {ride.origin} ➔ 🏁 {ride.destination}</strong>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>DRIVER</span>
                    <strong style={{ color: '#0f172a' }}>{ride.driver_name} <span style={{ color: '#087c64', fontWeight: 800 }}>✓ Verified</span></strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>DEPARTURE</span>
                    <strong style={{ color: '#0f172a' }}>{ride.departure_time}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>VEHICLE</span>
                    <strong style={{ color: '#0f172a' }}>{ride.vehicle || 'Car'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, display: 'block' }}>FARE / SEAT</span>
                    <strong style={{ color: '#087c64', fontSize: 15, fontWeight: 900 }}>₹{ride.price_per_seat}</strong>
                  </div>
                </div>
              </div>

              {/* Passenger Name & Mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                    PASSENGER NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Singh"
                    value={passengerName}
                    onChange={e => setPassengerName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                    MOBILE NUMBER (OPTIONAL)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={passengerPhone}
                    onChange={e => setPassengerPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Passenger Selector */}
              <div>
                <PassengerSelector
                  value={seats}
                  onChange={setSeats}
                  max={ride.available_seats || 4}
                  label="Seats to Book"
                />
              </div>

              {/* Transparent Direct Payment Notice */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534' }}>
                <Banknote size={20} style={{ flexShrink: 0, color: '#087c64' }} />
                <span>
                  <strong>Pay ₹{totalFare} directly to driver</strong> upon meeting at pickup. Rides are verified using your 6-digit Boarding PIN.
                </span>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 12, fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="privacy-modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block', fontWeight: 600 }}>TOTAL FARE</span>
                <strong style={{ fontSize: 20, color: '#087c64', fontWeight: 900 }}>₹{totalFare}</strong>
              </div>
              <button
                className="ride-btn ride-btn-primary"
                onClick={handleConfirmBooking}
                disabled={loading}
                style={{ padding: '12px 24px', fontSize: 14, fontWeight: 800 }}
              >
                {loading ? 'Confirming…' : 'Confirm Booking'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="privacy-modal-header" style={{ background: bookingResult.status === 'CANCELLED' ? '#991b1b' : '#087c64', color: '#fff', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', color: bookingResult.status === 'CANCELLED' ? '#991b1b' : '#087c64', display: 'grid', placeItems: 'center' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                    {bookingResult.status === 'CANCELLED' ? 'Booking Cancelled' : 'Booking Confirmed!'}
                  </h3>
                  <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0 }}>
                    {bookingResult.status === 'CANCELLED' ? 'This seat reservation has been cancelled.' : 'Show your boarding PIN to driver at pickup'}
                  </p>
                </div>
              </div>
            </div>

            <div className="privacy-modal-body" style={{ padding: 24, textAlign: 'center' }}>
              {bookingResult.status !== 'CANCELLED' && (
                <div style={{ background: '#f0fdf4', border: '2px dashed #86efac', borderRadius: 20, padding: 20, margin: '8px 0 18px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#166534', textTransform: 'uppercase' }}>
                    YOUR 6-DIGIT BOARDING VERIFICATION PIN
                  </span>
                  <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 8, color: '#0f172a', margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <KeyRound size={30} style={{ color: '#087c64' }} /> {bookingResult.bookingOtp}
                  </div>
                  <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                    Provide this PIN to <b>{ride.driver_name}</b> before boarding. Driver verifies it on their app to confirm your ride.
                  </p>
                </div>
              )}

              {/* Details table */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, textAlign: 'left', display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>BOOKING ID</span>
                  <span style={{ color: '#0f172a', fontFamily: 'monospace', fontWeight: 700 }}>{bookingResult.bookingId.slice(0, 18)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>STATUS</span>
                  <span style={{ color: bookingResult.status === 'CANCELLED' ? '#dc2626' : '#087c64', fontWeight: 800 }}>
                    {bookingResult.status === 'VERIFIED' ? '✓ VERIFIED BOARDED' : bookingResult.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>ROUTE</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{ride.origin} ➔ {ride.destination}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>DRIVER</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{ride.driver_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>FARE TO PAY DRIVER</span>
                  <span style={{ color: '#087c64', fontSize: 15, fontWeight: 900 }}>₹{bookingResult.fareAmount}</span>
                </div>
              </div>
            </div>

            <div className="privacy-modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12 }}>
              {bookingResult.status !== 'CANCELLED' && (
                <button
                  onClick={handleCancelBooking}
                  disabled={loading}
                  style={{ padding: '10px 16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel Booking
                </button>
              )}
              <button className="ride-btn ride-btn-primary" onClick={onClose} style={{ flex: 1, padding: '10px 0', fontSize: 14, fontWeight: 800 }}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
