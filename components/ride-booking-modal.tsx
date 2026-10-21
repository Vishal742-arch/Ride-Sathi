'use client';
import {
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  X,
  Banknote,
  AlertCircle,
  Mail,
  ArrowRight,
  Phone,
  MessageSquare,
  Home,
  Calendar,
  MapPin,
  Car,
  Star,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { PassengerSelector } from '@/components/passenger-selector';
import { RideChat } from '@/components/ride-chat';

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
  const isBike = ride.vehicle?.toLowerCase().includes('bike');
  const maxSeats = isBike ? 1 : Math.max(1, ride.available_seats || 4);
  const [seats, setSeats] = useState(Math.min(initialSeats, maxSeats));
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');

  // Email OTP state
  const [step, setStep] = useState<'DETAILS' | 'EMAIL_OTP' | 'SUCCESS'>('DETAILS');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  // Booking Result
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    bookingReference: string;
    boardingPin: string;
    fareAmount: number;
    seats: number;
    status: string;
    passengerName: string;
    passengerEmail: string;
    paymentMethod: string;
    paymentStatus: string;
  } | null>(null);

  // Rating State
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Cooldown countdown
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => setOtpCooldown(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  useEffect(() => {
    trackEvent('booking_started', {
      origin_city: ride.origin,
      destination_city: ride.destination,
      number_of_seats: seats,
    });
  }, [ride.origin, ride.destination]);

  const totalFare = ride.price_per_seat * seats;

  // Step 1: Send Email OTP
  const handleRequestEmailOtp = async () => {
    if (!passengerName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!passengerEmail.trim() || !passengerEmail.includes('@')) {
      setError('Please enter a valid email address to receive your verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passengerEmail.trim().toLowerCase(),
          passengerName: passengerName.trim(),
          purpose: 'BOOKING_VERIFICATION',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        setLoading(false);
        return;
      }
      setOtpCooldown(60);
      setStep('EMAIL_OTP');
    } catch {
      setError('Network error sending verification code. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Email OTP and confirm booking
  const handleVerifyOtpAndBook = async () => {
    if (!emailOtp || emailOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Verify OTP
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passengerEmail.trim().toLowerCase(),
          otp: emailOtp.trim(),
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || 'Invalid or expired verification code.');
        setLoading(false);
        return;
      }

      setIsEmailVerified(true);

      // 2. Persist booking to database atomically
      await executeBookingPersistence();
    } catch {
      setError('Error verifying code. Please try again.');
      setLoading(false);
    }
  };

  // Execute database booking persistence
  const executeBookingPersistence = async () => {
    try {
      const bookRes = await fetch('/api/rides/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: ride.id,
          seats,
          passengerName: passengerName.trim(),
          passengerEmail: passengerEmail.trim().toLowerCase(),
          passengerPhone: passengerPhone.trim() || undefined,
        }),
      });

      const data = await bookRes.json();
      if (!bookRes.ok || !data.success) {
        setError(data.error || 'Failed to complete booking. Please try again.');
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
        bookingReference: data.bookingReference || `RWM-${data.bookingId.slice(0, 8).toUpperCase()}`,
        boardingPin: data.boardingPin || data.bookingOtp,
        fareAmount: data.fareAmount,
        seats,
        status: data.status || 'CONFIRMED',
        passengerName: passengerName.trim(),
        passengerEmail: passengerEmail.trim().toLowerCase(),
        paymentMethod: data.paymentMethod || 'Direct Cash / UPI at Pickup',
        paymentStatus: data.paymentStatus || 'NOT_PAID',
      });

      setStep('SUCCESS');
    } catch {
      setError('Network error during booking confirmation. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Handle direct confirm if user bypasses or already verified
  const handleDirectConfirm = async () => {
    if (!passengerName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!passengerEmail.trim() || !passengerEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isEmailVerified) {
      // Direct user to Email OTP verification first
      await handleRequestEmailOtp();
      return;
    }

    setLoading(true);
    await executeBookingPersistence();
  };

  const handleCancelBooking = async () => {
    if (!bookingResult) return;
    if (!confirm('Are you sure you want to cancel this booking? This will immediately release your reserved seats.')) return;
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

  const handleRating = async (ratingVal: number) => {
    if (!bookingResult) return;
    setUserRating(ratingVal);
    try {
      await fetch('/api/bookings/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingResult.bookingId,
          action: 'SUBMIT_RATING',
          rating: ratingVal,
        }),
      });
      setRatingSubmitted(true);
    } catch {
      // Ignore rating error
    }
  };

  return (
    <>
      <div className="privacy-modal-backdrop" onClick={onClose}>
        <div
          className="privacy-modal"
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: 540, borderRadius: 24, overflow: 'hidden' }}
        >
          {/* STEP 1: RIDE DETAILS & PASSENGER INPUT */}
          {step === 'DETAILS' && (
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
                {/* Route Summary */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
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

                {/* Passenger Form */}
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                      PASSENGER NAME <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arjun Singh"
                      value={passengerName}
                      onChange={e => setPassengerName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, outline: 'none' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        EMAIL ADDRESS <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={passengerEmail}
                        onChange={e => setPassengerEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 13, outline: 'none' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                        PHONE NUMBER (OPTIONAL)
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
                </div>

                {/* Seats to book */}
                <div>
                  <PassengerSelector
                    value={seats}
                    onChange={setSeats}
                    max={maxSeats}
                    label={isBike ? 'Seat to Book (Bike max 1)' : 'Seats to Book'}
                  />
                </div>

                {/* Direct payment note */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534' }}>
                  <Banknote size={20} style={{ flexShrink: 0, color: '#087c64' }} />
                  <span>
                    <strong>Pay ₹{totalFare} directly to driver at pickup.</strong> No online gateway deduction. A 6-digit Boarding PIN will be provided upon booking.
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
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <strong style={{ fontSize: 20, color: '#087c64', fontWeight: 900 }}>₹{totalFare}</strong>
                    {seats > 1 && (
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                        (₹{ride.price_per_seat} × {seats} seats)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="ride-btn ride-btn-primary"
                  onClick={handleDirectConfirm}
                  disabled={loading}
                  style={{ padding: '12px 24px', fontSize: 14, fontWeight: 800 }}
                >
                  {loading ? 'Processing…' : 'Confirm Booking'}
                </button>
              </div>
            </>
          )}

          {/* STEP 2: EMAIL OTP VERIFICATION */}
          {step === 'EMAIL_OTP' && (
            <>
              <div className="privacy-modal-header" style={{ background: '#087c64', color: '#fff', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', color: '#087c64', display: 'grid', placeItems: 'center' }}>
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>Verify Your Email</h3>
                    <p style={{ fontSize: 13, color: '#e6f4f1', margin: 0 }}>Code sent to {passengerEmail}</p>
                  </div>
                </div>
                <button onClick={() => setStep('DETAILS')} style={{ background: 'none', border: 'none', color: '#e6f4f1', cursor: 'pointer', marginLeft: 'auto' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="privacy-modal-body" style={{ padding: 24, display: 'grid', gap: 16 }}>
                <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                  Enter the 6-digit verification code sent to <b>{passengerEmail}</b> to confirm ownership and finalize your seat reservation.
                </p>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#087c64', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>
                    ENTER 6-DIGIT EMAIL CODE
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 529148"
                    value={emailOtp}
                    onChange={e => setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: 6,
                      textAlign: 'center',
                      border: '2px solid #cbd5e1',
                      borderRadius: 14,
                      outline: 'none',
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Code valid for 5 minutes</span>
                  <button
                    type="button"
                    onClick={handleRequestEmailOtp}
                    disabled={otpCooldown > 0 || loading}
                    style={{ background: 'none', border: 'none', color: otpCooldown > 0 ? '#94a3b8' : '#087c64', fontWeight: 700, cursor: otpCooldown > 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 12, fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="privacy-modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  className="ride-btn ride-btn-primary"
                  onClick={handleVerifyOtpAndBook}
                  disabled={loading || emailOtp.length !== 6}
                  style={{ padding: '12px 24px', fontSize: 14, fontWeight: 800 }}
                >
                  {loading ? 'Verifying…' : 'Verify & Book'}
                </button>
              </div>
            </>
          )}

          {/* STEP 3: BOOKING SUCCESS SCREEN */}
          {step === 'SUCCESS' && bookingResult && (
            <>
              <div
                className="privacy-modal-header"
                style={{
                  background: bookingResult.status === 'CANCELLED' ? '#991b1b' : '#087c64',
                  color: '#fff',
                  padding: '20px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#fff',
                      color: bookingResult.status === 'CANCELLED' ? '#991b1b' : '#087c64',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                      {bookingResult.status === 'CANCELLED' ? 'Booking Cancelled' : 'Booking Confirmed!'}
                    </h3>
                    <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0 }}>
                      Reference: <b>{bookingResult.bookingReference}</b>
                    </p>
                  </div>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', marginLeft: 'auto' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="privacy-modal-body" style={{ padding: 24, textAlign: 'center' }}>
                {bookingResult.status !== 'CANCELLED' && (
                  <div style={{ background: '#f0fdf4', border: '2px dashed #86efac', borderRadius: 20, padding: 20, margin: '0 0 18px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#166534', textTransform: 'uppercase' }}>
                      YOUR 6-DIGIT BOARDING PIN
                    </span>
                    <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 8, color: '#0f172a', margin: '8px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                      <KeyRound size={28} style={{ color: '#087c64' }} /> {bookingResult.boardingPin}
                    </div>
                    <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                      Share this PIN only with <b>{ride.driver_name}</b> upon meeting at pickup.
                    </p>
                  </div>
                )}

                {/* Details Table */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, textAlign: 'left', display: 'grid', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>STATUS</span>
                    <span style={{ color: bookingResult.status === 'CANCELLED' ? '#dc2626' : '#087c64', fontWeight: 800 }}>
                      {bookingResult.status === 'VERIFIED' ? '✓ BOARDED & VERIFIED' : '✓ CONFIRMED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>PASSENGER</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{bookingResult.passengerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>DRIVER</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>
                      {ride.driver_name} <span style={{ color: '#087c64', fontWeight: 800 }}>✓ Verified</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>VEHICLE</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{ride.vehicle || 'Car'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>ROUTE</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{ride.origin} ➔ {ride.destination}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>SEATS BOOKED</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>{bookingResult.seats} seat(s)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>PAYMENT METHOD</span>
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>Pay Driver Directly at Pickup</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>TOTAL PAYABLE</span>
                    <span style={{ color: '#087c64', fontSize: 16, fontWeight: 900 }}>₹{bookingResult.fareAmount}</span>
                  </div>
                </div>

                {/* Rating Driver if completed */}
                {bookingResult.status === 'COMPLETED' && (
                  <div style={{ marginTop: 16, padding: 14, background: '#fefce8', border: '1px solid #fef08a', borderRadius: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', display: 'block', marginBottom: 6 }}>
                      Rate your experience with {ride.driver_name}:
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: (userRating || 0) >= star ? '#eab308' : '#cbd5e1' }}
                        >
                          <Star size={24} fill={(userRating || 0) >= star ? '#eab308' : 'none'} />
                        </button>
                      ))}
                    </div>
                    {ratingSubmitted && <span style={{ fontSize: 11, color: '#166534', fontWeight: 700, display: 'block', marginTop: 4 }}>✓ Rating submitted!</span>}
                  </div>
                )}
              </div>

              <div className="privacy-modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {bookingResult.status !== 'CANCELLED' && (
                  <>
                    <button
                      onClick={() => setShowChat(true)}
                      style={{ padding: '10px 14px', background: '#0f172a', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', border: 'none' }}
                    >
                      <MessageSquare size={16} /> Contact Driver
                    </button>
                    <button
                      onClick={handleCancelBooking}
                      disabled={loading}
                      style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
                <Link
                  href="/dashboard"
                  style={{ gridColumn: 'span 2', padding: '12px 0', background: '#087c64', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 800, textAlign: 'center', textDecoration: 'none' }}
                >
                  View My Bookings & Dashboard →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Driver Contact Chat Modal */}
      {showChat && (
        <RideChat
          rideId={ride.id}
          driverName={ride.driver_name}
          driverRole="Verified Driver"
          isVerified={true}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}
