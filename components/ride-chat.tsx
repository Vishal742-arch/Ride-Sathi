'use client';
import { AlertTriangle, Check, CheckCheck, MessageSquare, Phone, Send, ShieldAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChatMessage } from '@/lib/chat';
import { PrivacyCallModal } from './privacy-call-modal';

interface RideChatProps {
  rideId: string;
  driverName?: string;
  driverRole?: string;
  isVerified?: boolean;
  onClose: () => void;
}

export function RideChat({
  rideId,
  driverName = 'Rahul Sharma',
  driverRole = 'Verified Driver',
  isVerified = true,
  onClose,
}: RideChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, 5000);
    return () => clearInterval(timer);
  }, [rideId]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/rides/${rideId}/messages`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {
      // Ignore network errors in polling
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const content = input.trim();
    setInput('');
    setLoading(true);

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      ride_id: rideId,
      sender_id: 'current-user',
      recipient_id: 'driver-id',
      content,
      read_at: null,
      created_at: new Date().toISOString(),
      sender_name: 'You (Passenger)',
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await fetch(`/api/rides/${rideId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          recipientId: 'driver-id',
          senderName: 'You (Passenger)',
        }),
      });
      fetchMessages();
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (confirm(`Are you sure you want to block ${driverName}? Future ride matching will be restricted.`)) {
      await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: 'driver-id', reason: 'User requested block' }),
      });
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 4000);
    }
  };

  return (
    <>
      <div className="chat-drawer-backdrop" onClick={onClose}>
        <div className="chat-drawer" onClick={e => e.stopPropagation()}>
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3>
                  {driverName} {isVerified && <span className="verified-badge">✓ Verified</span>}
                </h3>
                <p className="chat-subtitle">Trip #{rideId.slice(0, 8).toUpperCase()} • Contact Protected</p>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                className="privacy-call-btn"
                onClick={() => setShowCallModal(true)}
                title="Privacy Protected Call"
              >
                <Phone size={17} /> Privacy Call
              </button>
              <button className="close-btn" onClick={onClose} aria-label="Close chat">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="privacy-banner">
            <ShieldAlert size={15} />
            <span>
              Phone numbers & emails are kept hidden. Communicate safely inside Ride With Me.
            </span>
          </div>

          {reportSuccess && (
            <div className="report-alert">
              <Check size={16} /> User action logged. Moderation review in progress.
            </div>
          )}

          <div className="chat-messages">
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === 'current-user' || msg.sender_name?.startsWith('You');
              return (
                <div key={msg.id || idx} className={`message-bubble ${isMe ? 'outgoing' : 'incoming'}`}>
                  <span className="msg-sender">{msg.sender_name || (isMe ? 'You' : driverName)}</span>
                  <p className="msg-content">{msg.content}</p>
                  <div className="msg-meta">
                    <small>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                    {isMe && (
                      <span className="read-status">
                        {msg.read_at ? <CheckCheck size={13} className="text-emerald-500" /> : <Check size={13} />}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type in-app message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || loading}>
              <Send size={16} />
            </button>
          </form>

          <div className="chat-footer-options">
            <button type="button" onClick={handleBlockUser}>
              <AlertTriangle size={13} /> Report or Block User
            </button>
          </div>
        </div>
      </div>

      {showCallModal && (
        <PrivacyCallModal
          rideId={rideId}
          recipientName={driverName}
          recipientRole={driverRole}
          onClose={() => setShowCallModal(false)}
        />
      )}
    </>
  );
}
