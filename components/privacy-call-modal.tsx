'use client';
import { Phone, Shield, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { CallSession } from '@/lib/calling';

interface PrivacyCallModalProps {
  rideId: string;
  recipientName: string;
  recipientRole: string;
  onClose: () => void;
}

export function PrivacyCallModal({ rideId, recipientName, recipientRole, onClose }: PrivacyCallModalProps) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const startCall = async () => {
    setLoading(true);
    setStatusText('Connecting to Ride With Me Secure Proxy...');
    try {
      const res = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, callerRole: 'PASSENGER' }),
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        setStatusText('Proxy Connected! Dialing recipient through masked bridge...');
      } else {
        setStatusText('Could not initiate call service.');
      }
    } catch {
      setStatusText('Network error initiating privacy call.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-modal-backdrop" onClick={onClose}>
      <div className="privacy-modal" onClick={e => e.stopPropagation()}>
        <div className="privacy-modal-header">
          <div className="shield-icon">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3>Ride With Me Privacy Call</h3>
            <p>Your personal phone number is 100% hidden</p>
          </div>
        </div>

        <div className="privacy-modal-body">
          <div className="call-flow-diagram">
            <div className="flow-node">
              <span>You</span>
              <small>Passenger</small>
            </div>
            <div className="flow-arrow">➔</div>
            <div className="flow-node highlight">
              <Shield size={16} />
              <span>Proxy Bridge</span>
              <small>Ride With Me</small>
            </div>
            <div className="flow-arrow">➔</div>
            <div className="flow-node">
              <span>{recipientName}</span>
              <small>{recipientRole}</small>
            </div>
          </div>

          {!session ? (
            <div className="call-initiate-box">
              <p className="privacy-notice">
                Calling through Ride With Me proxies your connection via <b>{statusText || 'a secure server toll-free line'}</b>. Neither party will ever see the other’s real phone number.
              </p>
              <button
                className="ride-btn ride-btn-primary full-width"
                onClick={startCall}
                disabled={loading}
              >
                <Phone size={18} /> {loading ? 'Connecting Proxy...' : `Call ${recipientName} Privately`}
              </button>
            </div>
          ) : (
            <div className="call-active-box">
              <div className="status-badge">
                <span className="live-dot" /> Live Secure Call Bridge
              </div>
              <div className="proxy-details">
                <label>PROXY TOLL-FREE NUMBER</label>
                <strong>{session.proxyNumber}</strong>
                <label>RECIPIENT MASKED ID</label>
                <strong>{session.maskedRecipientNumber}</strong>
              </div>
              <p className="mock-call-note">
                ✓ Call line connected securely via server proxy.
              </p>
            </div>
          )}
        </div>

        <div className="privacy-modal-footer">
          <button className="ride-btn ride-btn-light" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
