import { useState } from 'react';
import emailjs from '@emailjs/browser';

// 🛡️ Rate Limiter Instance: Max 2 feedback emails per 3 minutes (180,000ms)
class RateLimiter {
  constructor(maxCalls = 2, windowMs = 180000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.calls = [];
  }

  canMakeCall() {
    const now = Date.now();
    this.calls = this.calls.filter((timestamp) => now - timestamp < this.windowMs);
    if (this.calls.length >= this.maxCalls) return false;
    this.calls.push(now);
    return true;
  }
}

const feedbackLimiter = new RateLimiter();

export default function Feedback({ userEmail, isOpen, onClose }) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setStatus({ type: 'error', text: 'Please enter a short message or suggestion.' });
      return;
    }

    // 🛡️ Check Rate Limit
    if (!feedbackLimiter.canMakeCall()) {
      setStatus({
        type: 'error',
        text: 'You are submitting feedback too quickly. Please wait a few minutes before trying again.'
      });
      return;
    }

    setIsSending(true);
    setStatus({ type: '', text: '' });

    // 🔑 EmailJS Credentials
    const SERVICE_ID = 'service_288rngi';
    const TEMPLATE_ID = 'template_rteybp5';
    const PUBLIC_KEY = 'TD3T9_8GJLmrIuupa';

    const templateParams = {
      user_email: userEmail || 'Anonymous User',
      rating: rating,
      message: message,
    };

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      setStatus({ type: 'success', text: 'Thank you! Your feedback has been sent directly.' });
      setMessage('');
      setTimeout(() => {
        setStatus({ type: '', text: '' });
        onClose();
      }, 2000);
    } catch (error) {
      console.error('EmailJS Error:', error);
      setStatus({ type: 'error', text: 'Failed to send feedback. Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '1.75rem',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E2E8F0',
        fontFamily: 'sans-serif'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
            💬 Share Feedback
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94A3B8' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', marginTop: 0, marginBottom: '1.25rem' }}>
          Help us improve weStudy! Tell us what features you love or what needs fixing.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Star Rating Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Rating
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    opacity: star <= rating ? 1 : 0.3,
                    transition: 'transform 0.1s'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text Input */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Your Message
            </label>
            <textarea
              rows={4}
              placeholder="What do you think about weStudy?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Status Alert Banner */}
          {status.text && (
            <p style={{
              fontSize: '12px',
              fontWeight: '600',
              margin: 0,
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: status.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: status.type === 'success' ? '#047857' : '#B91C1C',
              border: `1px solid ${status.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`
            }}>
              {status.text}
            </p>
          )}

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: 'white',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4F46E5',
                color: 'white',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isSending ? 'not-allowed' : 'pointer',
                opacity: isSending ? 0.7 : 1
              }}
            >
              {isSending ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}