'use client';
import { useState } from 'react';
import { KeyRound, ShieldCheck, X, CheckCircle2, AlertCircle, Banknote, Check } from 'lucide-react';

interface DriverVerifyModalProps {
  bookingId: string;
  passengerName?: string;
  routeText?: string;
  fareAmount?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DriverVerifyModal({
  bookingId,
  passengerName = 'Passenger',
  routeText,
  fareAmount = 80,
  onClose,
  onSuccess,
}: DriverVerifyModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedState, setVerifiedState] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);

  // 1. Verify Boarding PIN
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the full 6-digit boarding verification PIN.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/bookings/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid verification PIN. Please verify with passenger.');
        setLoading(false);
        return;
      }
      setVerifiedState(true);
      if (onSuccess) onSuccess();
    } catch {
      setError('Network error verifying passenger PIN.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirm Direct Cash / UPI Payment
  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'CONFIRM_PAYMENT' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentConfirmed(true);
      } else {
        alert(data.error || 'Failed to update payment status.');
      }
    } catch {
      alert('Network error confirming payment.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Mark Ride as Started
  const handleStartRide = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'START_RIDE' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRideStarted(true);
      } else {
        alert(data.error || 'Failed to start ride.');
      }
    } catch {
      alert('Network error starting ride.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div className="privacy-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, borderRadius: 24, overflow: 'hidden' }}>
        <div className="privacy-modal-header" style={{ background: '#0f172a', color: '#fff', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#087c64', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#fff' }}>Driver Pickup & Verification</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{passengerName} • {routeText || 'Trip Verification'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        </div>

        <div className="privacy-modal-body" style={{ padding: 24 }}>
          {!verifiedState ? (
            <form onSubmit={handleVerify} style={{ display: 'grid', gap: 16 }}>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                Ask <b>{passengerName}</b> for their 6-digit Boarding PIN shown on their booking confirmation:
              </p>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#087c64', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>
                  ENTER 6-DIGIT BOARDING PIN
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={20} style={{ position: 'absolute', left: 14, top: 14, color: '#087c64' }} />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 849201"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 46px',
                      fontSize: 22,
                      fontWeight: 900,
                      letterSpacing: 6,
                      border: '2px solid #cbd5e1',
                      borderRadius: 14,
                      outline: 'none',
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 12, fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="ride-btn ride-btn-primary"
                style={{ padding: '12px 0', fontSize: 14, fontWeight: 800, borderRadius: 12, width: '100%' }}
              >
                {loading ? 'Verifying PIN…' : 'Verify Boarding PIN'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Passenger Verified!</h3>
                <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>Boarding confirmed for {passengerName}.</p>
              </div>

              {/* Direct Cash / UPI Collection Notice */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 14, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Banknote size={16} /> Direct Fare to Collect:
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#166534' }}>₹{fareAmount}</span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={paymentConfirmed || loading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    background: paymentConfirmed ? '#166534' : '#22c55e',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: paymentConfirmed ? 'default' : 'pointer',
                  }}
                >
                  {paymentConfirmed ? <><Check size={14} /> Cash / UPI Payment Received</> : 'Mark Fare as Received'}
                </button>
              </div>

              {/* Start Ride Action */}
              <div style={{ display: 'grid', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleStartRide}
                  disabled={rideStarted || loading}
                  style={{
                    padding: '12px 0',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    border: 'none',
                    background: rideStarted ? '#0f172a' : '#087c64',
                    color: '#fff',
                    cursor: rideStarted ? 'default' : 'pointer',
                  }}
                >
                  {rideStarted ? '✓ Trip is In Progress' : 'Start Journey'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '8px 0', background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Close Window
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
