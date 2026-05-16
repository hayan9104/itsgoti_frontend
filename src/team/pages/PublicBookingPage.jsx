import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Video, Phone, MapPin, Globe, Check, Calendar,
} from 'lucide-react';
import { publicBookingAPI } from '../publicBookingAPI';
import {
  readHost as readCachedHost, writeHost as writeCachedHost,
  readMonthSlots as readCachedMonthSlots, writeMonthSlots as writeCachedMonthSlots,
  readMonthSlotsDetail as readCachedMonthDetail, writeMonthSlotsDetail as writeCachedMonthDetail,
  readDaySlotsFromDetail,
} from '../publicBookingCache';
import { getPalette, baseFont, serifFont, monoFont, ensureFontsLoaded } from '../theme';
import { Avatar } from '../components/Primitives';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TZ_OPTIONS = [
  { id: 'IST', label: 'Asia/Kolkata (IST)', offset: 0 },
  { id: 'GST', label: 'Asia/Dubai (GST)', offset: -90 },
  { id: 'GMT', label: 'Europe/London (BST)', offset: -270 },
  { id: 'EST', label: 'America/New_York (EDT)', offset: -570 },
];

function toMin(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
function fromMin(min) { const m = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
function addMinStr(hhmm, mins) { return fromMin(toMin(hhmm) + mins); }
function fmt12(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
function applyTz(hhmm, tzId) {
  const tz = TZ_OPTIONS.find((t) => t.id === tzId) || TZ_OPTIONS[0];
  return addMinStr(hhmm, tz.offset);
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function monthGrid(monthOffset) {
  const base = new Date();
  const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const startPad = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(first); d.setDate(1 - startPad + i);
    cells.push({ date: d, inMonth: d.getMonth() === first.getMonth() });
  }
  return { label: `${MONTH_LABELS[first.getMonth()]} ${first.getFullYear()}`, cells, year: first.getFullYear(), month: first.getMonth() + 1 };
}
function locationIcon(loc) {
  return loc === 'Google Meet' ? Video : loc === 'Phone call' ? Phone : loc === 'In person' ? MapPin : Globe;
}

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';
  const lockedEventId = searchParams.get('event') || null;
  const [isDark, setIsDark] = useState(false);
  // Hydrate from localStorage prefetch — when present, paint instantly while the
  // network request refreshes in the background.
  const cachedHost = typeof window !== 'undefined' ? readCachedHost(slug) : null;
  const cachedTypes = cachedHost?.eventTypes || [];
  const initialTypes = lockedEventId
    ? (cachedTypes.filter((t) => String(t.id) === String(lockedEventId)).length > 0
        ? cachedTypes.filter((t) => String(t.id) === String(lockedEventId))
        : cachedTypes)
    : cachedTypes;
  const [loading, setLoading] = useState(!cachedHost);
  const [host, setHost] = useState(cachedHost?.host || null);
  const [eventTypes, setEventTypes] = useState(initialTypes);
  const [error, setError] = useState(null);

  const [step, setStep] = useState(1); // 1, 2, 3, 'confirmed'
  const [pickedEventType, setPickedEventType] = useState(null);
  const [pickedDate, setPickedDate] = useState(null);
  const [pickedSlot, setPickedSlot] = useState(null);
  const [tz, setTz] = useState('IST');
  const [monthOffset, setMonthOffset] = useState(0);
  const [monthSlots, setMonthSlots] = useState({}); // dateKey -> count
  const [daySlots, setDaySlots] = useState([]);
  const [dayLimitReached, setDayLimitReached] = useState(false);
  const [daySlotsLoading, setDaySlotsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const palette = useMemo(() => getPalette(isDark), [isDark]);

  useEffect(() => { ensureFontsLoaded(); }, []);

  // Load host info — fetch fresh in background, but if we hydrated from cache the
  // UI is already on screen and this is just a silent refresh.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const res = await publicBookingAPI.getHost(slug);
        if (cancelled) return;
        const allTypes = res.data.eventTypes || [];
        // When the URL specifies ?event=<id>, lock the page to that single event so
        // the visitor never sees the others. Falls back to the full list if the id
        // doesn't match (e.g. event was disabled or removed since the link was shared).
        const filteredTypes = lockedEventId
          ? (allTypes.filter((t) => String(t.id) === String(lockedEventId)).length > 0
              ? allTypes.filter((t) => String(t.id) === String(lockedEventId))
              : allTypes)
          : allTypes;
        setHost(res.data.host);
        setEventTypes(filteredTypes);
        writeCachedHost(slug, { host: res.data.host, eventTypes: allTypes });
        // Auto-skip step 1 only when the host *organically* has just one event type.
        // Never skip in preview mode (host wants to see the full flow), and never
        // skip when the URL locked us to a single event via ?event= — in that case
        // step 1 still renders with that one card so the visitor sees what they're
        // about to book.
        if (!isPreview && !lockedEventId && filteredTypes.length === 1 && !pickedEventType) {
          setPickedEventType(filteredTypes[0]);
          setStep(2);
        }
      } catch (err) {
        if (cancelled) return;
        // Don't blow away a cached UI on a transient network error.
        if (!host) setError(err?.response?.data?.message || 'This booking page is not available.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Load month dots whenever event type or month changes. Hydrate from cache for
  // instant paint, then refresh in background. We also kick off a detail-fetch
  // in parallel so that clicking any date in this month paints time pills instantly.
  useEffect(() => {
    if (!pickedEventType || step !== 2) return;
    let cancelled = false;
    const g = monthGrid(monthOffset);

    const cached = readCachedMonthSlots(slug, pickedEventType.id, g.year, g.month);
    if (cached) setMonthSlots(cached.days || {});

    publicBookingAPI.getMonthSlots(slug, pickedEventType.id, g.year, g.month)
      .then((res) => {
        if (cancelled) return;
        setMonthSlots(res.data.days || {});
        writeCachedMonthSlots(slug, pickedEventType.id, g.year, g.month, res.data);
      })
      .catch(() => { if (!cancelled && !cached) setMonthSlots({}); });

    // Warm the day-slot detail cache in the background — fire-and-forget.
    const haveDetail = readCachedMonthDetail(slug, pickedEventType.id, g.year, g.month);
    if (!haveDetail) {
      publicBookingAPI.getMonthSlotsDetail(slug, pickedEventType.id, g.year, g.month)
        .then((res) => { if (!cancelled) writeCachedMonthDetail(slug, pickedEventType.id, g.year, g.month, res.data); })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [slug, pickedEventType, monthOffset, step]);

  // Load day slots whenever a date is picked. Hydrate from the month-detail
  // cache for instant paint, then revalidate against the live endpoint to catch
  // any slot that was booked since the prefetch. The submit step still hits a
  // fresh server check, so a stale slot just means a friendly error if it's
  // already taken — it can't cause a double-booking.
  useEffect(() => {
    if (!pickedEventType || !pickedDate) { setDaySlots([]); setDayLimitReached(false); return; }
    let cancelled = false;

    const g = monthGrid(monthOffset);
    const dKey = dateKey(pickedDate);
    const cached = readDaySlotsFromDetail(slug, pickedEventType.id, g.year, g.month, dKey);

    if (cached) {
      setDaySlots(cached);
      setDayLimitReached(false);
      setDaySlotsLoading(false);
    } else {
      setDaySlotsLoading(true);
    }

    publicBookingAPI.getSlots(slug, pickedEventType.id, dKey)
      .then((res) => {
        if (cancelled) return;
        setDaySlots(res.data.slots || []);
        setDayLimitReached(!!res.data.limitReached);
      })
      .catch(() => {
        if (cancelled) return;
        if (!cached) { setDaySlots([]); setDayLimitReached(false); }
      })
      .finally(() => { if (!cancelled) setDaySlotsLoading(false); });
    return () => { cancelled = true; };
  }, [slug, pickedEventType, pickedDate, monthOffset]);

  const submit = async () => {
    if (!pickedEventType || !pickedDate || !pickedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await publicBookingAPI.book(slug, {
        eventTypeId: pickedEventType.id,
        date: dateKey(pickedDate),
        start: pickedSlot,
        name: form.name,
        email: form.email,
        phone: form.phone,
        note: form.note,
      });
      setStep('confirmed');
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Could not complete booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ----- render -----

  const containerStyle = {
    minHeight: '100vh', backgroundColor: palette.bg, color: palette.text,
    fontFamily: baseFont, WebkitFontSmoothing: 'antialiased',
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: baseFont, fontSize: 14, color: palette.textDim }}>
          Loading…
        </div>
      </div>
    );
  }

  if (error || !host) {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: serifFont, fontSize: 32, color: palette.text, marginBottom: 12 }}>
            <em style={{ fontStyle: 'italic', fontWeight: 300 }}>Not here</em>
          </div>
          <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.textDim }}>
            {error || 'This booking page is not available.'}
          </div>
        </div>
      </div>
    );
  }

  const Dots = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {[1, 2, 3].map((n) => {
        const done = step === 'confirmed' || (typeof step === 'number' && n <= step);
        return (
          <span
            key={n}
            style={{
              width: n === step ? 18 : 6, height: 6, borderRadius: 3,
              backgroundColor: done ? palette.accent : palette.border, transition: 'all .2s',
            }}
          />
        );
      })}
    </div>
  );

  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  const windowEnd = new Date(); windowEnd.setDate(windowEnd.getDate() + (host.windowDays || 14)); windowEnd.setHours(23, 59, 59, 999);
  const grid = monthGrid(monthOffset);
  const anySlotsInWindow = Object.values(monthSlots).some((n) => n > 0);

  const phoneRequired = pickedEventType?.location === 'Phone call';
  const canConfirm = form.name.trim() && form.email.trim() && (!phoneRequired || form.phone.trim());

  return (
    <div style={containerStyle}>
      {/* Subtle accent rule across the top — sets a formal, branded tone without competing with content. */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent}55)` }} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '24px 24px 18px',
      }}>
        <img
          src="/Goti%20Logo%20Black.png"
          alt="Goti"
          style={{
            height: 32,
            width: 'auto',
            display: 'block',
            filter: isDark ? 'invert(1)' : 'none',
          }}
        />
        <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.14em' }}>
          BOOK A MEETING
        </div>
      </div>

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '8px 24px 24px' }}>
        {/* host header — refined with a subtle availability pill. */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 36,
            padding: '20px 22px',
            borderRadius: 14,
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.surface,
          }}
        >
          <Avatar initials={host.avatar} size={52} palette={palette} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 500, color: palette.text, lineHeight: 1.15 }}>
              {host.name}
            </div>
            <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, marginTop: 2 }}>
              {host.jobTitle}{host.jobTitle ? ' · ' : ''}GOTI
            </div>
          </div>
          {eventTypes.length > 0 && (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 999,
                backgroundColor: palette.accentBg, color: palette.accent,
                fontFamily: monoFont, fontSize: 10.5, fontWeight: 500, letterSpacing: '0.06em',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: palette.accent }} />
              ACCEPTING BOOKINGS
            </span>
          )}
        </div>

        {eventTypes.length === 0 ? (
          <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: serifFont, fontSize: 20, color: palette.text }}>
              {host.name.split(' ')[0]} isn't taking bookings right now.
            </div>
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 8 }}>Check back soon.</div>
          </div>
        ) : (
          <>
            <Dots />

            {/* STEP 1 */}
            {step === 1 && (
              <div>
                {isPreview && (
                  <button
                    type="button"
                    onClick={() => { try { window.close(); } catch (e) { window.history.back(); } }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}
                  >
                    <ArrowLeft size={13} /> Back to Booking Link
                  </button>
                )}
                <h2 style={{ fontFamily: serifFont, fontSize: 26, fontWeight: 400, color: palette.text, marginBottom: 4, marginTop: 0 }}>
                  Pick a <em style={{ fontStyle: 'italic', fontWeight: 300 }}>call type</em>
                </h2>
                <p style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginBottom: 20 }}>How long do you need?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {eventTypes.map((et) => {
                    const LIcon = locationIcon(et.location);
                    return (
                      <button
                        key={et.id}
                        type="button"
                        onClick={() => { setPickedEventType(et); setStep(2); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 18, padding: '20px 22px', borderRadius: 14,
                          border: `1px solid ${palette.border}`, backgroundColor: palette.surface,
                          textAlign: 'left', cursor: 'pointer',
                          transition: 'border-color .15s, box-shadow .15s, transform .15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = palette.accent;
                          e.currentTarget.style.boxShadow = `0 6px 22px ${palette.bg === '#0F0E0C' ? 'rgba(0,0,0,0.35)' : 'rgba(45, 90, 61, 0.08)'}`;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = palette.border;
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          backgroundColor: palette.accentBg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <LIcon size={18} color={palette.accent} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, lineHeight: 1.2 }}>
                            {et.name}
                          </div>
                          {et.description && (
                            <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, marginTop: 4, lineHeight: 1.4 }}>
                              {et.description}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.04em' }}>
                            <span>{et.duration} MIN</span>
                            <span>·</span>
                            <span>{et.location.toUpperCase()}</span>
                          </div>
                        </div>
                        <ChevronRight size={18} color={palette.textMute} style={{ flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && pickedEventType && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setPickedDate(null);
                    setPickedSlot(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <h2 style={{ fontFamily: serifFont, fontSize: 26, fontWeight: 400, color: palette.text, marginBottom: 4, marginTop: 0 }}>
                  Pick a <em style={{ fontStyle: 'italic', fontWeight: 300 }}>day & time</em>
                </h2>
                <p style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginBottom: 20 }}>
                  {pickedEventType.name} · {pickedEventType.duration} min
                </p>

                {!anySlotsInWindow && Object.keys(monthSlots).length > 0 ? (
                  <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, padding: '56px 24px', textAlign: 'center' }}>
                    <div style={{ fontFamily: serifFont, fontSize: 19, color: palette.text }}>
                      No open times this month.
                    </div>
                    <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 8 }}>
                      Try the next month →
                    </div>
                    <button
                      type="button"
                      onClick={() => setMonthOffset(monthOffset + 1)}
                      style={{ marginTop: 16, padding: '8px 14px', borderRadius: 8, backgroundColor: palette.accent, color: palette.accentText, fontFamily: baseFont, fontSize: 12.5, fontWeight: 500, border: 'none', cursor: 'pointer' }}
                    >
                      Show next month
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                    {/* month calendar */}
                    <div style={{ padding: 20, borderRadius: 14, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <button
                          type="button"
                          onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))}
                          disabled={monthOffset === 0}
                          style={{
                            color: monthOffset > 0 ? palette.textDim : palette.textMute,
                            padding: 6, border: `1px solid ${palette.border}`, borderRadius: 6, background: 'none',
                            cursor: monthOffset > 0 ? 'pointer' : 'default',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text }}>{grid.label}</span>
                        <button
                          type="button"
                          onClick={() => setMonthOffset(monthOffset + 1)}
                          style={{
                            color: palette.textDim,
                            padding: 6, border: `1px solid ${palette.border}`, borderRadius: 6, background: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, width: 280 }}>
                        {WEEKDAY_LABELS.map((d) => (
                          <div key={d} style={{ textAlign: 'center', fontFamily: monoFont, fontSize: 10, color: palette.textMute, paddingBottom: 6, letterSpacing: '0.06em', fontWeight: 500 }}>{d[0]}</div>
                        ))}
                        {grid.cells.map((c, i) => {
                          const dm = new Date(c.date); dm.setHours(0, 0, 0, 0);
                          const inWindow = dm >= todayMid && dm <= windowEnd;
                          const cellKey = dateKey(c.date);
                          const slotCount = monthSlots[cellKey] || 0;
                          const has = c.inMonth && inWindow && slotCount > 0;
                          const sel = pickedDate && dateKey(pickedDate) === cellKey;
                          const isToday = cellKey === dateKey(new Date());
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={!has}
                              onClick={() => { setPickedDate(c.date); setPickedSlot(null); }}
                              style={{
                                aspectRatio: '1', borderRadius: 8,
                                border: isToday && !sel ? `1.5px solid ${palette.accent}` : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                                backgroundColor: sel ? palette.accent : has ? palette.surfaceAlt : 'transparent',
                                cursor: has ? 'pointer' : 'default',
                                transition: 'background-color .12s',
                              }}
                              onMouseEnter={(e) => { if (has && !sel) e.currentTarget.style.backgroundColor = palette.accentBg; }}
                              onMouseLeave={(e) => { if (has && !sel) e.currentTarget.style.backgroundColor = palette.surfaceAlt; }}
                            >
                              <span style={{
                                fontFamily: monoFont, fontSize: 13,
                                color: sel ? palette.accentText : !c.inMonth ? 'transparent' : has ? palette.text : palette.textMute,
                                fontWeight: sel || isToday ? 600 : 400,
                              }}>{c.date.getDate()}</span>
                              {has && !sel && (
                                <span style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: palette.accent }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* slots */}
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        {pickedDate && (
                          <div style={{ fontFamily: serifFont, fontSize: 16, color: palette.text }}>
                            {pickedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: pickedDate ? 'auto' : 0 }}>
                          <Globe size={12} color={palette.textMute} />
                          <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>Times in</span>
                          <select
                            value={tz}
                            onChange={(e) => setTz(e.target.value)}
                            style={{ backgroundColor: palette.surfaceAlt, color: palette.text, fontFamily: baseFont, fontSize: 11.5, border: `1px solid ${palette.border}`, borderRadius: 6, padding: '3px 6px', outline: 'none' }}
                          >
                            {TZ_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                      {!pickedDate ? (
                        <div style={{ borderRadius: 14, border: `1px dashed ${palette.border}`, padding: '56px 16px', textAlign: 'center', backgroundColor: palette.surfaceAlt }}>
                          <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
                            Pick a day to see open times.
                          </span>
                        </div>
                      ) : daySlotsLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} style={{ height: 36, borderRadius: 8, backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}` }} />
                          ))}
                        </div>
                      ) : daySlots.length === 0 ? (
                        <div style={{ borderRadius: 14, border: `1px dashed ${palette.border}`, padding: '56px 16px', textAlign: 'center', backgroundColor: palette.surfaceAlt }}>
                          <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
                            {dayLimitReached
                              ? `Call limit with ${host.name.split(' ')[0]} is over for today.`
                              : 'No open times on this day.'}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                          {daySlots.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { setPickedSlot(s); setStep(3); }}
                              style={{
                                padding: '10px 0', borderRadius: 8, border: `1px solid ${palette.border}`,
                                backgroundColor: palette.surface, fontFamily: monoFont, fontSize: 13, color: palette.text,
                                cursor: 'pointer', transition: 'all .12s', letterSpacing: '0.02em',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = palette.accent;
                                e.currentTarget.style.color = palette.accent;
                                e.currentTarget.style.backgroundColor = palette.accentBg;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = palette.border;
                                e.currentTarget.style.color = palette.text;
                                e.currentTarget.style.backgroundColor = palette.surface;
                              }}
                            >
                              {fmt12(applyTz(s, tz))}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && pickedEventType && pickedDate && pickedSlot && (
              <div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <h2 style={{ fontFamily: serifFont, fontSize: 26, fontWeight: 400, color: palette.text, marginBottom: 20, marginTop: 0 }}>
                  Confirm your <em style={{ fontStyle: 'italic', fontWeight: 300 }}>details</em>
                </h2>

                <div style={{
                  padding: 18, borderRadius: 12,
                  backgroundColor: palette.accentBg,
                  border: `1px solid ${palette.accent}`,
                  marginBottom: 24,
                }}>
                  <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.accent, letterSpacing: '0.1em', fontWeight: 500, marginBottom: 8 }}>
                    WHAT YOU'RE BOOKING
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    {(() => { const I = locationIcon(pickedEventType.location); return <I size={15} color={palette.accent} />; })()}
                    <span style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text }}>
                      {pickedEventType.name}
                    </span>
                    <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.accent, padding: '2px 8px', borderRadius: 999, border: `1px solid ${palette.accent}` }}>
                      {pickedEventType.duration} MIN
                    </span>
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 12.5, color: palette.text, marginTop: 4 }}>
                    {pickedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 12.5, color: palette.accent, marginTop: 2 }}>
                    {fmt12(applyTz(pickedSlot, tz))} {tz} · {pickedEventType.location}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Name *" palette={palette}>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={inputStyle(palette)}
                    />
                  </Field>
                  <Field label="Email *" palette={palette}>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ ...inputStyle(palette), fontFamily: monoFont }}
                    />
                  </Field>
                  {phoneRequired && (
                    <Field label="Phone *" palette={palette}>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 …"
                        style={{ ...inputStyle(palette), fontFamily: monoFont }}
                      />
                    </Field>
                  )}
                  <Field label="Anything we should know?" palette={palette}>
                    <textarea
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      style={{ ...inputStyle(palette), resize: 'none' }}
                    />
                  </Field>
                </div>

                {submitError && (
                  <div style={{ marginTop: 14, fontFamily: baseFont, fontSize: 12, color: palette.danger }}>
                    {submitError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={submit}
                  disabled={!canConfirm || submitting}
                  style={{
                    width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                    backgroundColor: palette.accent, color: palette.accentText,
                    fontFamily: baseFont, fontSize: 13.5, fontWeight: 500,
                    opacity: canConfirm && !submitting ? 1 : 0.5,
                  }}
                >
                  {submitting ? 'Confirming…' : 'Confirm booking'}
                </button>
                <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, textAlign: 'center', marginTop: 10 }}>
                  No account needed. You'll get a confirmation email.
                </div>
              </div>
            )}

            {/* CONFIRMED */}
            {step === 'confirmed' && pickedEventType && pickedDate && pickedSlot && (
              <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 999, width: 64, height: 64,
                    backgroundColor: palette.accentBg,
                    border: `2px solid ${palette.accent}`,
                    marginBottom: 24,
                  }}
                >
                  <Check size={28} color={palette.accent} strokeWidth={2.5} />
                </div>
                <h2 style={{ fontFamily: serifFont, fontSize: 40, fontWeight: 400, color: palette.text, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  You're <em style={{ fontStyle: 'italic', fontWeight: 300 }}>booked.</em>
                </h2>
                <p style={{ fontFamily: baseFont, fontSize: 14, color: palette.textDim, marginTop: 10, marginBottom: 28 }}>
                  A confirmation has been sent to <span style={{ fontFamily: monoFont, color: palette.text }}>{form.email}</span>.
                </p>

                <div style={{
                  padding: '22px 24px', borderRadius: 14,
                  border: `1px solid ${palette.border}`, backgroundColor: palette.surface,
                  textAlign: 'left',
                  boxShadow: palette.bg === '#0F0E0C' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(45, 90, 61, 0.08)',
                }}>
                  <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.1em', fontWeight: 500, marginBottom: 10 }}>
                    BOOKING CONFIRMED
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <Avatar initials={host.avatar} size={32} palette={palette} />
                    <div>
                      <div style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text }}>
                        {pickedEventType.name} with {host.name.split(' ')[0]}
                      </div>
                      <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim }}>
                        {pickedEventType.duration} min · {pickedEventType.location}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: 14, borderRadius: 10, backgroundColor: palette.accentBg,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <Calendar size={16} color={palette.accent} />
                    <div>
                      <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.text, fontWeight: 500 }}>
                        {pickedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontFamily: monoFont, fontSize: 12, color: palette.accent, marginTop: 2 }}>
                        {fmt12(applyTz(pickedSlot, tz))} {tz}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{
          marginTop: 64, paddingTop: 24, borderTop: `1px solid ${palette.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.1em',
        }}>
          <span>POWERED BY</span>
          <span style={{ fontFamily: serifFont, fontSize: 13, color: palette.textDim, letterSpacing: 0, fontWeight: 500 }}>
            Goti<span style={{ color: palette.accent }}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, palette, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle(palette) {
  return {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    backgroundColor: palette.surface, color: palette.text,
    fontFamily: baseFont, fontSize: 13.5,
    border: `1px solid ${palette.border}`, outline: 'none',
  };
}
