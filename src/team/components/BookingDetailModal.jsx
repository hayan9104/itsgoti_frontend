import { useState } from 'react';
import { X, CalendarClock, Mail, Phone, Video, MapPin, Globe, Users, User, Copy, Check } from 'lucide-react';
import { teamCalendarAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont } from '../theme';
import { Avatar } from './Primitives';

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

const meetingTypeMeta = {
  one_on_one: { label: 'One-on-one', icon: User },
  team: { label: 'Team meeting', icon: Users },
  public: { label: null, icon: null }, // external booking — no badge
};

export default function BookingDetailModal({ booking, palette, onClose, onCancelled, openTask }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!booking) return null;

  const LIcon = locationIcon(booking.location);
  const dObj = new Date(`${booking.dateKey}T00:00:00`);
  const isCancelled = booking.status === 'cancelled';
  const typeMeta = meetingTypeMeta[booking.meetingType || 'public'] || meetingTypeMeta.public;
  const isInternal = booking.meetingType === 'one_on_one' || booking.meetingType === 'team';
  const participants = Array.isArray(booking.participants) ? booking.participants : [];
  const bookedByEmployee = booking.bookedByEmployee || null;

  const cancel = async () => {
    setBusy(true);
    try {
      const res = await teamCalendarAPI.cancelBooking(booking._id);
      onCancelled(res.data.booking);
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not cancel. Try again.');
    } finally {
      setBusy(false);
      setConfirming(false);
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
            <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span>{booking.eventTypeName.toUpperCase()} · {booking.duration} MIN</span>
              {typeMeta.label && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '1px 8px', borderRadius: 999, backgroundColor: palette.accentBg, color: palette.accent,
                  fontFamily: monoFont, fontSize: 9.5, letterSpacing: '0.06em', fontWeight: 500, textTransform: 'uppercase',
                }}>
                  {typeMeta.icon && <typeMeta.icon size={10} />} {typeMeta.label}
                </span>
              )}
              {isCancelled && <span style={{ color: palette.danger }}>· CANCELLED</span>}
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
          {!isInternal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color={palette.textDim} />
              <span style={{ fontFamily: monoFont, fontSize: 12, color: palette.text }}>{booking.clientEmail}</span>
            </div>
          )}
          {booking.clientPhone && !isInternal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Phone size={14} color={palette.textDim} />
              <span style={{ fontFamily: monoFont, fontSize: 12, color: booking.clientPhone }}>{booking.clientPhone}</span>
            </div>
          )}
        </div>

        {/* Participants list for team meetings */}
        {booking.meetingType === 'team' && participants.length > 0 && (
          <div style={{ borderRadius: 10, padding: 12, marginBottom: 14, backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}` }}>
            <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 8 }}>
              PARTICIPANTS · {participants.length}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {participants.map((p) => (
                <div key={p._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px 3px 3px', borderRadius: 999, backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
                  <Avatar initials={p.avatar} size={20} palette={palette} />
                  <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.text }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookedByEmployee && (
          <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginBottom: 14 }}>
            Booked by <span style={{ color: palette.textDim, fontWeight: 500 }}>{bookedByEmployee.name}</span>
          </div>
        )}

        {booking.note && (
          <div style={{ borderRadius: 10, padding: 12, marginBottom: 14, backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}` }}>
            <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 4 }}>
              {isInternal ? 'REASON' : 'CLIENT NOTE'}
            </div>
            <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, lineHeight: 1.5 }}>
              {booking.note}
            </div>
          </div>
        )}

        {booking.meetingLink && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <a
              href={booking.meetingLink}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                borderRadius: 8, backgroundColor: palette.accentBg, textDecoration: 'none',
                minWidth: 0,
              }}
            >
              <Video size={13} color={palette.accent} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: monoFont, fontSize: 11.5, color: palette.accent, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {booking.meetingLink}
              </span>
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard?.writeText(booking.meetingLink);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 1800);
              }}
              title="Copy link"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                backgroundColor: linkCopied ? palette.accentBg : palette.surfaceAlt,
                color: linkCopied ? palette.accent : palette.text,
                border: `1px solid ${linkCopied ? palette.accent : palette.border}`,
                fontFamily: baseFont, fontSize: 11.5, fontWeight: 500, flexShrink: 0,
              }}
            >
              {linkCopied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        )}

        {!isCancelled && (
          <>
            {confirming ? (
              <div style={{ borderRadius: 10, padding: 14, backgroundColor: palette.dangerBg, border: `1px solid ${palette.danger}33` }}>
                <div style={{ fontFamily: baseFont, fontSize: 13, fontWeight: 500, color: palette.danger, marginBottom: 4 }}>
                  Cancel this meeting?
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginBottom: 12 }}>
                  {booking.groupId
                    ? 'This will remove it from every attendee\'s calendar.'
                    : 'The other party won\'t be notified automatically — let them know separately.'}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, fontWeight: 500 }}
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={busy}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: palette.danger, color: '#fff', fontFamily: baseFont, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', opacity: busy ? 0.5 : 1 }}
                  >
                    {busy ? 'Cancelling…' : 'Yes, cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                  backgroundColor: 'transparent', color: palette.danger,
                  border: `1px solid ${palette.border}`,
                  fontFamily: baseFont, fontSize: 12.5, fontWeight: 500,
                }}
              >
                Cancel {booking.meetingType === 'team' ? 'meeting' : 'call'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
