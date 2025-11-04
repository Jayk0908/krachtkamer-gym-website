import { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CancelBookingPage({ token }) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Geen annuleerlink gevonden');
      setLoading(false);
      return;
    }

    // Fetch booking details
    fetch(`${API_BASE}/public/bookings/lookup/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBooking(data);
        } else {
          setError(data.error || 'Boeking niet gevonden');
        }
      })
      .catch(err => {
        setError('Kon boekinggegevens niet laden');
        console.error('Lookup error:', err);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!booking?.booking?.canCancel) {
      return;
    }

    setCancelling(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/public/bookings/cancel/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || null }),
      });

      const data = await response.json();

      if (data.success) {
        setCancelled(true);
      } else {
        setError(data.error || 'Annulering mislukt');
      }
    } catch (err) {
      setError('Er ging iets mis bij het annuleren');
      console.error('Cancel error:', err);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6b7280' }}>Laden...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          textAlign: 'center',
        }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            Boeking niet gevonden
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            De annuleerlink is mogelijk ongeldig of verlopen.
          </p>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          textAlign: 'center',
        }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            Boeking geannuleerd
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Je afspraak is succesvol geannuleerd. Je ontvangt een bevestiging per e-mail.
          </p>
        </div>
      </div>
    );
  }

  const { booking: bookingData, client } = booking || {};
  const canCancel = bookingData?.canCancel ?? false;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#111827',
        }}>
          Afspraak Annuleren
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          {client?.name || 'Het bedrijf'}
        </p>

        {bookingData && (
          <div style={{
            background: '#f9fafb',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '32px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <Calendar size={20} color="#6b7280" />
              <span style={{ fontWeight: '600', color: '#111827' }}>
                {formatDate(bookingData.booking_date)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <Clock size={20} color="#6b7280" />
              <span style={{ color: '#111827' }}>
                {bookingData.start_time}
                {bookingData.end_time && ` - ${bookingData.end_time}`}
              </span>
            </div>
            {bookingData.resource_name && (
              <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                {bookingData.resource_name}
              </div>
            )}
          </div>
        )}

        {!canCancel && bookingData && (
          <div style={{
            background: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              <AlertTriangle size={20} color="#92400e" />
              <span style={{ fontWeight: '600', color: '#92400e' }}>
                Annulering niet mogelijk
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#78350f', margin: 0 }}>
              {bookingData.status === 'cancelled'
                ? 'Deze afspraak is al geannuleerd.'
                : bookingData.hoursUntilBooking < bookingData.cancellationWindow
                ? `Je kunt alleen annuleren als de afspraak minimaal ${bookingData.cancellationWindow} uur in de toekomst ligt. Je afspraak begint over ${bookingData.hoursUntilBooking} uur.`
                : 'Deze afspraak kan niet meer geannuleerd worden.'}
            </p>
          </div>
        )}

        {canCancel && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Reden voor annulering (optioneel)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Laat ons weten waarom je annuleert..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: cancelling ? '#9ca3af' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: cancelling ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!cancelling) e.currentTarget.style.background = '#dc2626';
              }}
              onMouseLeave={(e) => {
                if (!cancelling) e.currentTarget.style.background = '#ef4444';
              }}
            >
              {cancelling ? 'Bezig met annuleren...' : 'Afspraak Annuleren'}
            </button>
          </>
        )}

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fef2f2',
            borderLeft: '4px solid #ef4444',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}


