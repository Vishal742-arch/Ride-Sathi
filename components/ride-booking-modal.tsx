'use client';
import { CheckCircle2, KeyRound, Sparkles, X, Banknote, Route } from 'lucide-react';
import { useState } from 'react';

interface RideBookingModalProps {
  ride: {
    id: string;
    driver_name: string;
    origin: string;
    destination: string;
    departure_time: string;
    price_per_seat: number;
  };
  onClose: () => void;
}

export function RideBookingModal({ ride, onClose }: RideBookingModalProps) {
  const [seats, setSeats] = useState(1);
  const [passengerName, setPassengerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    tripPin: string;
    fareAmount: number;
  } | null>(null);
  const [error, setError] = useState('');

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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to confirm booking. Please try again.');
        setLoading(false);
        return;
      }
      setBookingResult({
        bookingId: data.bookingId,
        tripPin: data.tripPin,
        fareAmount: data.fareAmount,
      });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div className="privacy-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        {!bookingResult ? (
          <>
            <div className="privacy-modal-header">
              <div className="shield-icon">
                <Sparkles size={24} />
              </div>
              <div>
                <h3>Book Your Ride Sathi Seat</h3>
                <p>{ride.origin} ➔ {ride.destination}</p>
              </div>
              <button className="close-btn" onClick={onClose} style={{ marginLeft: 'auto', color: '#fff' }}>
                <X size={18} />
              </button>
            </div>

            <div className="privacy-modal-body" style={{ display: 'grid', gap: 18 }}>
              {/* Ride Summary & Location Confirmation */}
              <div className="booking-summary-box" style={{ background: '#f6fbf8', border: '1px solid #dbece2', padding: 16, borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px dashed #cde2d6' }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#617d72', fontWeight: 600, display: 'block' }}>ROUTE CONFIRMATION</span>
                    <strong style={{ fontSize: 13, color: '#087c64' }}>📍 {ride.origin} ➔ 🏁 {ride.destination}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ fontSize: 11, color: '#087c64', fontWeight: 700, background: '#e6f7ef', border: '1px solid #bce6d3', borderRadius: 8, padding: '2px 8px', cursor: 'pointer', height: 'fit-content' }}
                  >
                    Change Location
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#617d72', fontWeight: 600 }}>DRIVER</span>
                  <strong style={{ fontSize: 13, color: '#173e34' }}>{ride.driver_name} (✓ Verified)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#617d72', fontWeight: 600 }}>DEPARTURE</span>
                  <strong style={{ fontSize: 13, color: '#173e34' }}>{ride.departure_time}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#617d72', fontWeight: 600 }}>FARE / SEAT</span>
                  <strong style={{ fontSize: 14, color: '#087c64', fontWeight: 800 }}>₹{ride.price_per_seat}</strong>
                </div>
              </div>

              {/* Passenger Name */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#617d72', display: 'block', marginBottom: 8 }}>
                  YOUR NAME (OPTIONAL)
                </label>
                <div className="find-input" style={{ borderRadius: 12 }}>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Singh"
                    value={passengerName}
                    onChange={e => setPassengerName(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>

              {/* Seat Selector */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#617d72', display: 'block', marginBottom: 8 }}>
                  SELECT SEATS
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[1, 2, 3].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSeats(num)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 12,
                        border: seats === num ? '2px solid #087c64' : '1px solid #dcece2',
                        background: seats === num ? '#e6f7ef' : '#fff',
                        color: seats === num ? '#087c64' : '#45685d',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {num} {num === 1 ? 'Seat' : 'Seats'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Payment Notice */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#166534' }}>
                <Banknote size={18} style={{ flexShrink: 0, marginTop: 1, color: '#087c64' }} />
                <span>
                  <strong>Pay the driver directly</strong> at the end of your ride according to the calculated fare. Ride Sathi shows you the exact fare — no online payment required.
                </span>
              </div>

              {error && (
                <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            <div className="privacy-modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#617d72', display: 'block' }}>TOTAL FARE</span>
                <strong style={{ fontSize: 18, color: '#087c64' }}>₹{totalFare}</strong>
              </div>
              <button
                className="ride-btn ride-btn-primary"
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? 'Confirming…' : `Confirm Booking`}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="privacy-modal-header" style={{ background: '#087c64' }}>
              <div className="shield-icon" style={{ background: '#129a7c', color: '#fff' }}>
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3>Booking Confirmed!</h3>
                <p>Meet your driver at the pickup point</p>
              </div>
            </div>

            <div className="privacy-modal-body" style={{ textAlign: 'center' }}>
              {/* Trip PIN */}
              <div style={{ background: '#f3faf6', border: '2px solid #d1fae5', borderRadius: 20, padding: 24, margin: '10px 0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#087c64' }}>
                  YOUR TRIP BOARDING PIN
                </span>
                <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 8, color: '#173e34', margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <KeyRound size={32} style={{ color: '#087c64' }} /> {bookingResult.tripPin}
                </div>
                <p style={{ fontSize: 12, color: '#617d72', margin: 0 }}>
                  Share this 4-digit PIN with <b>{ride.driver_name}</b> at pickup to start the ride safely.
                </p>
              </div>

              {/* Booking details */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', margin: '12px 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>BOOKING ID</span>
                  <span style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>{bookingResult.bookingId.slice(0, 20)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>ROUTE</span>
                  <span style={{ fontSize: 12, color: '#374151' }}>{ride.origin} ➔ {ride.destination}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>DRIVER</span>
                  <span style={{ fontSize: 12, color: '#374151' }}>{ride.driver_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>DEPARTURE</span>
                  <span style={{ fontSize: 12, color: '#374151' }}>{ride.departure_time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>FARE TO PAY DRIVER</span>
                  <span style={{ fontSize: 14, color: '#087c64', fontWeight: 800 }}>₹{bookingResult.fareAmount}</span>
                </div>
              </div>

              {/* Pay driver directly reminder */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#92400e', textAlign: 'left' }}>
                <Route size={16} style={{ flexShrink: 0, marginTop: 2, color: '#b45309' }} />
                <span>
                  After the ride, <strong>pay ₹{bookingResult.fareAmount} directly to {ride.driver_name}.</strong> Ride Sathi calculates the fare — payment is handled between you and the driver.
                </span>
              </div>
            </div>

            <div className="privacy-modal-footer">
              <button className="ride-btn ride-btn-primary" onClick={onClose} style={{ width: '100%' }}>
                Done — View Active Ride
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
