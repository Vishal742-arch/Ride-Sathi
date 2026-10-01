'use client';
import { useState } from 'react';
import { KeyRound, ShieldCheck, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface DriverVerifyModalProps {
  bookingId: string;
  passengerName?: string;
  routeText?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DriverVerifyModal({ bookingId, passengerName = 'Passenger', routeText, onClose, onSuccess }: DriverVerifyModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
        setError(data.error || 'Invalid verification PIN. Please check with the passenger.');
        setLoading(false);
        return;
      }
      setSuccessMessage(data.message || 'Passenger verified successfully!');
      if (onSuccess) onSuccess();
    } catch {
      setError('Network error verifying passenger PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div className="privacy-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, borderRadius: 24, overflow: 'hidden' }}>
        <div className="privacy-modal-header" style={{ background: '#0f172a', color: '#fff', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#087c64', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#fff' }}>Verify Passenger Boarding</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{passengerName} • {routeText || 'Ride Verification'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        </div>

        <div className="privacy-modal-body" style={{ padding: 24 }}>
          {!successMessage ? (
            <form onSubmit={handleVerify} style={{ display: 'grid', gap: 16 }}>
              <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
                Ask <b>{passengerName}</b> for their 6-digit Boarding Verification PIN shown on their booking screen:
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
                {loading ? 'Verifying…' : 'Verify Boarding PIN'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Passenger Verified!</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px' }}>{successMessage}</p>
              <button className="ride-btn ride-btn-primary" onClick={onClose} style={{ width: '100%', padding: '10px 0', fontSize: 14 }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
