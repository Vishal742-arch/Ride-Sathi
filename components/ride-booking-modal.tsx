'use client';
import { CheckCircle2, CreditCard, ExternalLink, KeyRound, QrCode, ShieldCheck, Sparkles, X } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD'>('UPI');
  const [passengerName, setPassengerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    tripPin: string;
    fareAmount: number;
    checkoutUrl?: string;
    isMockPayment?: boolean;
    paymentId?: string;
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
          paymentMethod,
          passengerName: passengerName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to initialize payment. Please try again.');
        setLoading(false);
        return;
      }
      
      if (data.success && data.checkoutUrl) {
        // Prevent duplicate clicks and redirect to official payment provider checkout
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'Payment link could not be generated.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
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
              {/* Ride Summary */}
              <div className="booking-summary-box" style={{ background: '#f6fbf8', border: '1px solid #dbece2', padding: 16, borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#617d72', fontWeight: 600 }}>DRIVER</span>
                  <strong style={{ fontSize: 13, color: '#173e34' }}>{ride.driver_name} (✓ Verified)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#617d72', fontWeight: 600 }}>DEPARTURE</span>
                  <strong style={{ fontSize: 13, color: '#173e34' }}>{ride.departure_time}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#617d72', fontWeight: 600 }}>PRICE / SEAT</span>
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

              {/* Payment Method */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#617d72', display: 'block', marginBottom: 8 }}>
                  PAYMENT METHOD
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: paymentMethod === 'UPI' ? '2px solid #087c64' : '1px solid #dcece2',
                      background: paymentMethod === 'UPI' ? '#e6f7ef' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 700,
                      color: paymentMethod === 'UPI' ? '#087c64' : '#3c6155',
                      cursor: 'pointer',
                    }}
                  >
                    <QrCode size={18} /> Instant UPI / GPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: paymentMethod === 'CARD' ? '2px solid #087c64' : '1px solid #dcece2',
                      background: paymentMethod === 'CARD' ? '#e6f7ef' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 700,
                      color: paymentMethod === 'CARD' ? '#087c64' : '#3c6155',
                      cursor: 'pointer',
                    }}
                  >
                    <CreditCard size={18} /> Card / Netbanking
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ background: '#edf7f2', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#164d3f' }}>
                <ShieldCheck size={16} /> Contact privacy & SOS protection included automatically. Powered by Dodo Payments.
              </div>
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
                {loading ? 'Processing…' : `Pay ₹${totalFare} & Confirm`}
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
                <p>Your Trip PIN has been generated</p>
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

              {/* Payment details */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', margin: '12px 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>BOOKING ID</span>
                  <span style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>{bookingResult.bookingId.slice(0, 20)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>FARE PAID</span>
                  <span style={{ fontSize: 12, color: '#087c64', fontWeight: 700 }}>₹{bookingResult.fareAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>PAYMENT</span>
                  <span style={{ fontSize: 12, color: '#374151' }}>
                    {bookingResult.isMockPayment ? '🔵 Dev/Preview Mode' : '✅ Dodo Payments Live'}
                  </span>
                </div>
              </div>

              {/* Complete payment link if Dodo returned one */}
              {bookingResult.checkoutUrl && (
                <a
                  href={bookingResult.checkoutUrl}
                  target="_self"
                  className="ride-btn ride-btn-dark"
                  style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', marginTop: 12, padding: '14px', fontSize: 15, background: '#087c64', color: '#fff', fontWeight: 700 }}
                >
                  <ExternalLink size={18} style={{ marginRight: 8 }} />
                  Proceed to Dodo Payment Gateway (UPI / Card)
                </a>
              )}
            </div>

            <div className="privacy-modal-footer">
              <button className="ride-btn ride-btn-primary" onClick={onClose} style={{ width: '100%' }}>
                Done & View Active Ride
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
