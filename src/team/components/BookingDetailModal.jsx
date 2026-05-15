import { useState } from 'react';
import { X, CalendarClock, Mail, Phone, Video, MapPin, Globe } from 'lucide-react';
import { teamCalendarAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont } from '../theme';

const WEEKDAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fromMin = (min) => `${String(Math.floor(((min % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((min % 1440) + 1440) % 1440 % 60).padStart(2, '0')}`;
const addMinStr = (hhmm, mins) => fromMin(toMin(hhmm) + mins);
const fmt12 = (hhmm) => {
  let [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};
const locationIcon = (loc) =>
  loc === 'Google Meet' ? Video : loc === 'Phone call' ? Phone : loc === 'In person' ? MapPin : Globe;

export default function BookingDetailModal({ booking, palette, onClose, onCancelled, openTask }) {
  const [busy, setBusy] = useState(false);
  if (!booking) return null;

  const LIcon = locationIcon(booking.location);
  const dObj = new Date(`${booking.dateKey}T00:00:00`);
  const isCancelled = booking.status === 'cancelled';

  const cancel = async () => {
    if (!window.confirm('Cancel this call? The client will need to be notified separately.')) return;
    setBusy(true);
    try {
      const res = await teamCalendarAPI.cancelBooking(booking._id);
      onCancelled(res.data.booking);
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not cancel. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
          borderRadius: 14, padding: 24, width: '100%', maxWidth: 460,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em' }}>
              {booking.eventTypeName.toUpperCase()} · {booking.duration} MIN
              {isCancelled && ' · CANCELLED'}
            </div>
            <h3 style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 500, color: palette.text, marginTop: 4, marginBottom: 0 }}>
              {booking.clientName}
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ color: palette.textMute, border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ borderRadius: 10, padding: 16, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarClock size={14} color={palette.textDim} />
            <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.text }}>
              {WEEKDAY_FULL[(dObj.getDay() + 6) % 7]}, {dObj.getDate()} {MONTH_LABELS[dObj.getMonth()]} ·{' '}
              <span style={{ fontFamily: monoFont }}>{fmt12(booking.start)} – {fmt12(addMinStr(booking.start, booking.duration))} IST</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LIcon size={14} color={palette.textDim} />
            <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.text }}>{booking.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={14} color={palette.textDim} />
            <span style={{ fontFamily: monoFont, fontSize: 12, color: palette.text }}>{booking.clientEmail}</span>
          </div>
          {booking.clientPhone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Phone size={14} color={palette.textDim} />
              <span style={{ fontFamily: monoFont, fontSize: 12, color: palette.text }}>{booking.clientPhone}</span>
            </div>
          )}
        </div>

        {booking.note && (
          <div style={{ borderRadius: 10, padding: 12, marginBottom: 14, backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}` }}>
            <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 4 }}>
              CLIENT NOTE
            </div>
            <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, lineHeight: 1.5 }}>
              {booking.note}
            </div>
          </div>
        )}

        {booking.meetingLink && (
          <a
            href={booking.meetingLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '8px 12px',
              borderRadius: 8, backgroundColor: palette.accentBg, textDecoration: 'none',
            }}
          >
            <Video size={13} color={palette.accent} />
            <span style={{ fontFamily: monoFont, fontSize: 11.5, color: palette.accent, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {booking.meetingLink}
            </span>
          </a>
        )}

        {!isCancelled && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                backgroundColor: 'transparent', color: palette.danger,
                border: `1px solid ${palette.border}`,
                fontFamily: baseFont, fontSize: 12.5, fontWeight: 500,
                opacity: busy ? 0.5 : 1,
              }}
            >
              {busy ? 'Cancelling…' : 'Cancel call'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
