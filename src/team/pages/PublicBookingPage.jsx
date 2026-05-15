import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Video, Phone, MapPin, Globe, Check,
} from 'lucide-react';
import { publicBookingAPI } from '../publicBookingAPI';
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
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
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

  // Load host info
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await publicBookingAPI.getHost(slug);
        if (cancelled) return;
        setHost(res.data.host);
        setEventTypes(res.data.eventTypes || []);
        // Auto-skip step 1 when there's only one event type — but never in preview mode,
        // so the host can review their full public flow.
        if (!isPreview && (res.data.eventTypes || []).length === 1) {
          setPickedEventType(res.data.eventTypes[0]);
          setStep(2);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'This booking page is not available.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  // Load month dots whenever event type or month changes
  useEffect(() => {
    if (!pickedEventType || step !== 2) return;
    let cancelled = false;
    const g = monthGrid(monthOffset);
    publicBookingAPI.getMonthSlots(slug, pickedEventType.id, g.year, g.month)
      .then((res) => { if (!cancelled) setMonthSlots(res.data.days || {}); })
      .catch(() => { if (!cancelled) setMonthSlots({}); });
    return () => { cancelled = true; };
  }, [slug, pickedEventType, monthOffset, step]);

  // Load day slots whenever a date is picked
  useEffect(() => {
    if (!pickedEventType || !pickedDate) { setDaySlots([]); setDayLimitReached(false); return; }
    let cancelled = false;
    setDaySlotsLoading(true);
    publicBookingAPI.getSlots(slug, pickedEventType.id, dateKey(pickedDate))
      .then((res) => {
        if (cancelled) return;
        setDaySlots(res.data.slots || []);
        setDayLimitReached(!!res.data.limitReached);
      })
      .catch(() => { if (!cancelled) { setDaySlots([]); setDayLimitReached(false); } })
      .finally(() => { if (!cancelled) setDaySlotsLoading(false); });
    return () => { cancelled = true; };
  }, [slug, pickedEventType, pickedDate]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', maxWidth: 760, margin: '0 auto' }}>
        <img
          src="/Goti%20Logo%20Black.png"
          alt="Goti"
          style={{
            height: 28,
            width: 'auto',
            display: 'block',
            filter: isDark ? 'invert(1)' : 'none',
          }}
        />
      </div>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '8px 24px 80px' }}>
        {/* host header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <Avatar initials={host.avatar} size={48} palette={palette} />
          <div>
            <div style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 500, color: palette.text }}>{host.name}</div>
            <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}>{host.jobTitle}, GOTI</div>
          </div>
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
                          width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12,
                          border: `1px solid ${palette.border}`, backgroundColor: palette.surface,
                          textAlign: 'left', cursor: 'pointer', transition: 'border-color .15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = palette.accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = palette.border)}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: palette.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <LIcon size={17} color={palette.accent} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: baseFont, fontSize: 14.5, fontWeight: 500, color: palette.text }}>{et.name}</div>
                          {et.description && <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginTop: 2 }}>{et.description}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text }}>{et.duration} min</div>
                          <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute }}>{et.location}</div>
                        </div>
                        <ChevronRight size={16} color={palette.textMute} />
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
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {/* month calendar */}
                    <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <button
                          type="button"
                          onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))}
                          disabled={monthOffset === 0}
                          style={{ color: monthOffset > 0 ? palette.textDim : palette.textMute, padding: 2, border: 'none', background: 'none', cursor: monthOffset > 0 ? 'pointer' : 'default' }}
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <span style={{ fontFamily: serifFont, fontSize: 15, color: palette.text }}>{grid.label}</span>
                        <button
                          type="button"
                          onClick={() => setMonthOffset(monthOffset + 1)}
                          style={{ color: palette.textDim, padding: 2, border: 'none', background: 'none', cursor: 'pointer' }}
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, width: 252 }}>
                        {WEEKDAY_LABELS.map((d) => (
                          <div key={d} style={{ textAlign: 'center', fontFamily: monoFont, fontSize: 9.5, color: palette.textMute, paddingBottom: 4 }}>{d[0]}</div>
                        ))}
                        {grid.cells.map((c, i) => {
                          const dm = new Date(c.date); dm.setHours(0, 0, 0, 0);
                          const inWindow = dm >= todayMid && dm <= windowEnd;
                          const cellKey = dateKey(c.date);
                          const slotCount = monthSlots[cellKey] || 0;
                          const has = c.inMonth && inWindow && slotCount > 0;
                          const sel = pickedDate && dateKey(pickedDate) === cellKey;
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={!has}
                              onClick={() => { setPickedDate(c.date); setPickedSlot(null); }}
                              style={{
                                aspectRatio: '1', borderRadius: 6, border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                                backgroundColor: sel ? palette.accent : has ? palette.surfaceAlt : 'transparent',
                                cursor: has ? 'pointer' : 'default',
                              }}
                            >
                              <span style={{
                                fontFamily: monoFont, fontSize: 12,
                                color: sel ? palette.accentText : !c.inMonth ? 'transparent' : has ? palette.text : palette.textMute,
                                fontWeight: sel ? 600 : 400,
                              }}>{c.date.getDate()}</span>
                              {has && !sel && (
                                <span style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: palette.accent }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* slots */}
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <Globe size={12} color={palette.textMute} />
                        <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>Times shown in</span>
                        <select
                          value={tz}
                          onChange={(e) => setTz(e.target.value)}
                          style={{ backgroundColor: palette.surfaceAlt, color: palette.text, fontFamily: baseFont, fontSize: 11.5, border: `1px solid ${palette.border}`, borderRadius: 6, padding: '3px 6px', outline: 'none' }}
                        >
                          {TZ_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </div>
                      {!pickedDate ? (
                        <div style={{ borderRadius: 12, border: `1px dashed ${palette.border}`, padding: '48px 16px', textAlign: 'center' }}>
                          <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
                            Pick a day to see open times.
                          </span>
                        </div>
                      ) : daySlotsLoading ? (
                        <div style={{ borderRadius: 12, border: `1px dashed ${palette.border}`, padding: '48px 16px', textAlign: 'center' }}>
                          <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>Loading…</span>
                        </div>
                      ) : daySlots.length === 0 ? (
                        <div style={{ borderRadius: 12, border: `1px dashed ${palette.border}`, padding: '48px 16px', textAlign: 'center' }}>
                          <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
                            {dayLimitReached
                              ? `Call limit with ${host.name.split(' ')[0]} is over for today.`
                              : 'No open times on this day.'}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {daySlots.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => { setPickedSlot(s); setStep(3); }}
                              style={{
                                padding: '8px 0', borderRadius: 8, border: `1px solid ${palette.border}`,
                                backgroundColor: palette.surface, fontFamily: monoFont, fontSize: 12.5, color: palette.text,
                                cursor: 'pointer', transition: 'all .15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = palette.accent; e.currentTarget.style.color = palette.accent; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.color = palette.text; }}
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

                <div style={{ padding: 16, borderRadius: 10, backgroundColor: palette.accentBg, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {(() => { const I = locationIcon(pickedEventType.location); return <I size={14} color={palette.accent} />; })()}
                    <span style={{ fontFamily: baseFont, fontSize: 13.5, fontWeight: 500, color: palette.text }}>
                      {pickedEventType.name} · {pickedEventType.duration} min
                    </span>
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 12, color: palette.accent }}>
                    {pickedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {fmt12(applyTz(pickedSlot, tz))} {tz}
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
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, width: 52, height: 52, backgroundColor: palette.accentBg, marginBottom: 20 }}>
                  <Check size={24} color={palette.accent} />
                </div>
                <h2 style={{ fontFamily: serifFont, fontSize: 36, fontWeight: 400, color: palette.text, margin: 0 }}>
                  You're <em style={{ fontStyle: 'italic', fontWeight: 300 }}>booked.</em>
                </h2>
                <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, marginTop: 24, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    {(() => { const I = locationIcon(pickedEventType.location); return <I size={15} color={palette.accent} />; })()}
                    <span style={{ fontFamily: baseFont, fontSize: 14, fontWeight: 500, color: palette.text }}>
                      {pickedEventType.name} with {host.name.split(' ')[0]}
                    </span>
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 12.5, color: palette.textDim, lineHeight: 1.7 }}>
                    {pickedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<br />
                    {fmt12(applyTz(pickedSlot, tz))} {tz} · {pickedEventType.duration} min<br />
                    {pickedEventType.location}
                  </div>
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 20 }}>
                  A confirmation has been sent to your email.
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute, textAlign: 'center', marginTop: 48 }}>
          Powered by GOTI
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
