import { useEffect, useMemo, useState } from 'react';
import {
  X, ArrowLeft, ChevronLeft, ChevronRight, Check, User, Users, Briefcase,
  Video, Phone, MapPin, Globe,
} from 'lucide-react';
import { teamCalendarAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont } from '../theme';
import { Avatar } from './Primitives';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toMin(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
function fmt12(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
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

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const emptyClientForm = () => ({
  title: '',
  clientName: '',
  clientEmail: '',
  description: '',
  date: todayKey(),
  start: '10:00',
  duration: 30,
  meetingLink: '',
});

export default function InternalBookingModal({ open, palette, onClose, onBooked }) {
  const [step, setStep] = useState(0);             // 0:mode  1:members  2:eventType  3:date+time  4:confirm  5:done  6:client form
  const [mode, setMode] = useState(null);          // 'oneToOne' | 'team' | 'client'
  const [hosts, setHosts] = useState([]);
  const [selectedHostIds, setSelectedHostIds] = useState([]);
  const [hostInfo, setHostInfo] = useState(null);  // { host, eventTypes } for 1-on-1
  const [pickedEventType, setPickedEventType] = useState(null);
  const [pickedDate, setPickedDate] = useState(null);
  const [pickedSlot, setPickedSlot] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [monthSlots, setMonthSlots] = useState({});
  const [monthLeaves, setMonthLeaves] = useState({}); // dateKey -> [names] (team mode)
  const [daySlots, setDaySlots] = useState([]);
  const [daySlotsLoading, setDaySlotsLoading] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [windowDays, setWindowDays] = useState(14);
  const [clientForm, setClientForm] = useState(emptyClientForm);

  const reset = () => {
    setStep(0); setMode(null); setSelectedHostIds([]); setHostInfo(null);
    setPickedEventType(null); setPickedDate(null); setPickedSlot(null);
    setMonthOffset(0); setMonthSlots({}); setMonthLeaves({}); setDaySlots([]);
    setNote(''); setError(null); setWindowDays(14);
    setClientForm(emptyClientForm());
  };

  // Load hosts when modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    teamCalendarAPI.internalHosts()
      .then((res) => { if (!cancelled) setHosts(res.data.hosts || []); })
      .catch(() => { if (!cancelled) setHosts([]); });
    return () => { cancelled = true; };
  }, [open]);

  // Load host info when entering step 2 (1-on-1)
  useEffect(() => {
    if (mode !== 'oneToOne' || step !== 2 || selectedHostIds.length !== 1) return;
    let cancelled = false;
    setError(null);
    teamCalendarAPI.internalHost(selectedHostIds[0])
      .then((res) => {
        if (cancelled) return;
        setHostInfo({ host: res.data.host, eventTypes: res.data.eventTypes });
        setWindowDays(res.data.host.windowDays || 14);
      })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.message || 'Could not load host.'); });
    return () => { cancelled = true; };
  }, [mode, step, selectedHostIds]);

  // Load month dots for step 3
  useEffect(() => {
    if (step !== 3) return;
    let cancelled = false;
    const g = monthGrid(monthOffset);
    setMonthSlots({});
    setMonthLeaves({});
    (async () => {
      try {
        if (mode === 'oneToOne' && pickedEventType) {
          const res = await teamCalendarAPI.internalHostMonth(selectedHostIds[0], pickedEventType.id, g.year, g.month);
          if (!cancelled) setMonthSlots(res.data.days || {});
        } else if (mode === 'team') {
          const res = await teamCalendarAPI.internalTeamMonth(selectedHostIds, g.year, g.month);
          if (!cancelled) {
            setMonthSlots(res.data.days || {});
            setMonthLeaves(res.data.leaves || {});
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Could not load availability.');
      }
    })();
    return () => { cancelled = true; };
  }, [step, mode, pickedEventType, selectedHostIds, monthOffset]);

  // Load day slots
  useEffect(() => {
    if (step !== 3 || !pickedDate) { setDaySlots([]); return; }
    let cancelled = false;
    setDaySlotsLoading(true);
    (async () => {
      try {
        if (mode === 'oneToOne' && pickedEventType) {
          const res = await teamCalendarAPI.internalHostSlots(selectedHostIds[0], pickedEventType.id, dateKey(pickedDate));
          if (!cancelled) setDaySlots(res.data.slots || []);
        } else if (mode === 'team') {
          const res = await teamCalendarAPI.internalTeamSlots(selectedHostIds, dateKey(pickedDate));
          if (!cancelled) setDaySlots(res.data.slots || []);
        }
      } catch {
        if (!cancelled) setDaySlots([]);
      } finally {
        if (!cancelled) setDaySlotsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [step, pickedDate, mode, pickedEventType, selectedHostIds]);

  if (!open) return null;

  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!pickedDate || !pickedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'oneToOne') {
        await teamCalendarAPI.internalHostBook(selectedHostIds[0], {
          eventTypeId: pickedEventType.id,
          date: dateKey(pickedDate),
          start: pickedSlot,
          note,
        });
      } else {
        await teamCalendarAPI.internalTeamBook(selectedHostIds, {
          date: dateKey(pickedDate),
          start: pickedSlot,
          note,
        });
      }
      setStep(5);
      if (onBooked) onBooked();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not book. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const Dots = () => {
    const total = 5; // 0..4 are user steps, 5 is confirmation
    const shown = step >= 5 ? 5 : step + 1;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 22 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{
            width: i === step ? 18 : 6, height: 6, borderRadius: 3,
            backgroundColor: i < shown ? palette.accent : palette.border, transition: 'all .2s',
          }} />
        ))}
      </div>
    );
  };

  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  const windowEnd = new Date(); windowEnd.setDate(windowEnd.getDate() + windowDays); windowEnd.setHours(23, 59, 59, 999);
  const grid = monthGrid(monthOffset);

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
          borderRadius: 14, padding: 28, width: '100%', maxWidth: 620,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 500, color: palette.text, margin: 0 }}>
            Book a meeting
          </h3>
          <button type="button" onClick={close} style={{ color: palette.textMute, border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <Dots />

        {/* STEP 0 — mode */}
        {step === 0 && (
          <div>
            <h4 style={titleStyle(palette)}>What kind of meeting?</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ModeOption
                palette={palette}
                icon={User}
                title="One-to-one"
                desc="Meet with a single teammate."
                onClick={() => { setMode('oneToOne'); setSelectedHostIds([]); setStep(1); }}
              />
              <ModeOption
                palette={palette}
                icon={Users}
                title="Team meeting"
                desc="Pick multiple teammates and find a time that works for everyone."
                onClick={() => { setMode('team'); setSelectedHostIds([]); setStep(1); }}
              />
              <ModeOption
                palette={palette}
                icon={Briefcase}
                title="Client"
                desc="Book a call with a client by email. Goes straight onto your calendar."
                onClick={() => { setMode('client'); setStep(6); }}
              />
            </div>
          </div>
        )}

        {/* STEP 1 — pick member(s) */}
        {step === 1 && (
          <div>
            <BackBtn palette={palette} onClick={() => { setStep(0); setMode(null); setSelectedHostIds([]); }} />
            <h4 style={titleStyle(palette)}>
              {mode === 'oneToOne' ? 'Who do you want to meet with?' : 'Pick teammates for this meeting'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              {hosts.map((h) => {
                const checked = selectedHostIds.includes(h._id);
                const toggle = () => {
                  if (mode === 'oneToOne') setSelectedHostIds([h._id]);
                  else setSelectedHostIds(checked ? selectedHostIds.filter((id) => id !== h._id) : [...selectedHostIds, h._id]);
                };
                return (
                  <button
                    key={h._id}
                    type="button"
                    onClick={toggle}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
                      border: `1px solid ${checked ? palette.accent : palette.border}`,
                      backgroundColor: checked ? palette.accentBg : palette.surface,
                      textAlign: 'left', cursor: 'pointer',
                    }}
                  >
                    <Avatar initials={h.avatar} size={32} palette={palette} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: baseFont, fontSize: 13.5, fontWeight: 500, color: palette.text }}>{h.name}</div>
                      <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>
                        {h.jobTitle}{h.role === 'admin' && ' · Admin'}
                      </div>
                    </div>
                    <span style={{
                      width: mode === 'oneToOne' ? 16 : 16, height: 16, borderRadius: mode === 'oneToOne' ? 999 : 4,
                      border: `2px solid ${checked ? palette.accent : palette.border}`,
                      backgroundColor: checked ? palette.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {checked && <Check size={10} color={palette.accentText} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
            <NextBtn
              palette={palette}
              disabled={mode === 'oneToOne' ? selectedHostIds.length !== 1 : selectedHostIds.length < 2}
              hint={mode === 'team' && selectedHostIds.length < 2 ? 'Pick at least 2 teammates' : null}
              onClick={() => {
                if (mode === 'oneToOne') setStep(2);
                else setStep(3); // team mode skips event-type pick (uses Team call)
              }}
            >
              Continue
            </NextBtn>
          </div>
        )}

        {/* STEP 2 — event type (1-on-1 only) */}
        {step === 2 && mode === 'oneToOne' && (
          <div>
            <BackBtn palette={palette} onClick={() => { setStep(1); setHostInfo(null); setPickedEventType(null); }} />
            <h4 style={titleStyle(palette)}>
              Pick a <em style={{ fontStyle: 'italic', fontWeight: 400 }}>call type</em>
            </h4>
            {!hostInfo ? (
              <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim }}>Loading…</div>
            ) : hostInfo.eventTypes.length === 0 ? (
              <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
                This teammate has no active event types.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {hostInfo.eventTypes.map((et) => {
                  const LIcon = locationIcon(et.location);
                  return (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => { setPickedEventType(et); setStep(3); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 10,
                        border: `1px solid ${palette.border}`, backgroundColor: palette.surface,
                        textAlign: 'left', cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: palette.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <LIcon size={15} color={palette.accent} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: baseFont, fontSize: 14, fontWeight: 500, color: palette.text }}>
                          {et.name}{et.isDefault && <span style={{ fontFamily: monoFont, fontSize: 9, color: palette.accent, marginLeft: 8 }}>DEFAULT</span>}
                        </div>
                        {et.description && <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim, marginTop: 2 }}>{et.description}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: monoFont, fontSize: 12.5, color: palette.text }}>{et.duration} min</div>
                        <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute }}>{et.location}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — date + time */}
        {step === 3 && (
          <div>
            <BackBtn palette={palette} onClick={() => {
              if (mode === 'oneToOne') setStep(2);
              else setStep(1);
              setPickedDate(null); setPickedSlot(null);
            }} />
            <h4 style={titleStyle(palette)}>Pick a day & time</h4>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${palette.border}`, backgroundColor: palette.surface }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <button type="button" onClick={() => setMonthOffset(Math.max(0, monthOffset - 1))}
                    disabled={monthOffset === 0}
                    style={{ color: monthOffset > 0 ? palette.textDim : palette.textMute, padding: 2, border: 'none', background: 'none', cursor: monthOffset > 0 ? 'pointer' : 'default' }}>
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontFamily: serifFont, fontSize: 14, color: palette.text }}>{grid.label}</span>
                  <button type="button" onClick={() => setMonthOffset(monthOffset + 1)} style={{ color: palette.textDim, padding: 2, border: 'none', background: 'none', cursor: 'pointer' }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, width: 224 }}>
                  {WEEKDAY_LABELS.map((d) => (
                    <div key={d} style={{ textAlign: 'center', fontFamily: monoFont, fontSize: 9, color: palette.textMute, paddingBottom: 4 }}>{d[0]}</div>
                  ))}
                  {grid.cells.map((c, i) => {
                    const k = dateKey(c.date);
                    const dm = new Date(c.date); dm.setHours(0, 0, 0, 0);
                    const inWindow = dm >= todayMid && dm <= windowEnd;
                    const slotCount = monthSlots[k] || 0;
                    const leaveLabels = monthLeaves[k];
                    const onLeave = !!(leaveLabels && leaveLabels.length);
                    const has = c.inMonth && inWindow && slotCount > 0 && !onLeave;
                    const sel = pickedDate && dateKey(pickedDate) === k;
                    const title = onLeave ? `${leaveLabels.join(', ')} on leave` : undefined;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!has}
                        title={title}
                        onClick={() => { setPickedDate(c.date); setPickedSlot(null); }}
                        style={{
                          aspectRatio: '1', borderRadius: 6, border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                          backgroundColor: sel ? palette.accent : has ? palette.surfaceAlt : 'transparent',
                          cursor: has ? 'pointer' : 'default',
                        }}
                      >
                        <span style={{
                          fontFamily: monoFont, fontSize: 11,
                          color: sel ? palette.accentText : !c.inMonth ? 'transparent' : has ? palette.text : palette.textMute,
                          textDecoration: onLeave ? 'line-through' : 'none',
                          fontWeight: sel ? 600 : 400,
                        }}>{c.date.getDate()}</span>
                        {has && !sel && <span style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: palette.accent }} />}
                      </button>
                    );
                  })}
                </div>
                {mode === 'team' && Object.keys(monthLeaves).length > 0 && (
                  <div style={{ fontFamily: baseFont, fontSize: 10.5, color: palette.textMute, marginTop: 8, lineHeight: 1.4 }}>
                    Struck-through days have a teammate on leave.
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                {!pickedDate ? (
                  <div style={{ padding: '36px 16px', borderRadius: 10, border: `1px dashed ${palette.border}`, textAlign: 'center', fontFamily: baseFont, fontSize: 12.5, color: palette.textMute }}>
                    Pick a day to see open times.
                  </div>
                ) : daySlotsLoading ? (
                  <div style={{ padding: '36px 16px', borderRadius: 10, border: `1px dashed ${palette.border}`, textAlign: 'center', fontFamily: baseFont, fontSize: 12.5, color: palette.textMute }}>
                    Loading…
                  </div>
                ) : daySlots.length === 0 ? (
                  <div style={{ padding: '36px 16px', borderRadius: 10, border: `1px dashed ${palette.border}`, textAlign: 'center', fontFamily: baseFont, fontSize: 12.5, color: palette.textMute }}>
                    No common times on this day.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {daySlots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setPickedSlot(s); setStep(4); }}
                        style={{
                          padding: '8px 0', borderRadius: 8, border: `1px solid ${palette.border}`,
                          backgroundColor: palette.surface, fontFamily: monoFont, fontSize: 12, color: palette.text, cursor: 'pointer',
                        }}
                      >
                        {fmt12(s)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — confirm */}
        {step === 4 && pickedDate && pickedSlot && (
          <div>
            <BackBtn palette={palette} onClick={() => { setStep(3); setPickedSlot(null); }} />
            <h4 style={titleStyle(palette)}>Confirm</h4>
            <div style={{ padding: 14, borderRadius: 10, backgroundColor: palette.accentBg, marginBottom: 16 }}>
              <div style={{ fontFamily: baseFont, fontSize: 13.5, fontWeight: 500, color: palette.text, marginBottom: 4 }}>
                {mode === 'oneToOne'
                  ? `${pickedEventType.name} with ${hostInfo?.host?.name}`
                  : `Team call with ${selectedHostIds.map((id) => hosts.find((h) => h._id === id)?.name?.split(' ')[0]).join(', ')}`}
              </div>
              <div style={{ fontFamily: monoFont, fontSize: 12, color: palette.accent }}>
                {pickedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {fmt12(pickedSlot)}
              </div>
            </div>
            <label style={{ display: 'block', fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 5 }}>
              Note (optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this meeting about?"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, backgroundColor: palette.surfaceAlt, color: palette.text, fontFamily: baseFont, fontSize: 13, border: `1px solid ${palette.border}`, outline: 'none', resize: 'none' }}
            />
            {error && (
              <div style={{ marginTop: 12, fontFamily: baseFont, fontSize: 12, color: palette.danger }}>{error}</div>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              style={{
                width: '100%', marginTop: 16, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                backgroundColor: palette.accent, color: palette.accentText,
                fontFamily: baseFont, fontSize: 13.5, fontWeight: 500,
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {submitting ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        )}

        {/* STEP 5 — done */}
        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, width: 48, height: 48, backgroundColor: palette.accentBg, marginBottom: 16 }}>
              <Check size={22} color={palette.accent} />
            </div>
            <h3 style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 400, color: palette.text, margin: 0 }}>
              Booked.
            </h3>
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 8 }}>
              {mode === 'client'
                ? "It's on your calendar. The client invite email will go out automatically once we wire up email — for now share the meeting link directly."
                : `The meeting now shows on ${mode === 'oneToOne' ? "your teammate's" : "everyone's"} schedule.`}
            </div>
            <button
              type="button"
              onClick={close}
              style={{ marginTop: 20, padding: '8px 20px', borderRadius: 8, border: `1px solid ${palette.border}`, backgroundColor: palette.surfaceAlt, color: palette.text, fontFamily: baseFont, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        )}

        {/* STEP 6 — client booking form (all fields in one page; no slot logic) */}
        {step === 6 && (
          <ClientBookingForm
            palette={palette}
            form={clientForm}
            setForm={setClientForm}
            submitting={submitting}
            error={error}
            onBack={() => { setStep(0); setMode(null); setError(null); }}
            onSubmit={async () => {
              setError(null);
              const trim = (s) => (s || '').trim();
              const title = trim(clientForm.title);
              const email = trim(clientForm.clientEmail);
              if (!title) return setError('Title is required.');
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid client email.');
              if (!clientForm.date || !clientForm.start) return setError('Pick a date and time.');
              setSubmitting(true);
              try {
                await teamCalendarAPI.internalClientBook({
                  title,
                  clientName: trim(clientForm.clientName),
                  clientEmail: email,
                  description: trim(clientForm.description),
                  date: clientForm.date,
                  start: clientForm.start,
                  duration: Number(clientForm.duration),
                  meetingLink: trim(clientForm.meetingLink),
                });
                setStep(5);
                if (onBooked) onBooked();
              } catch (err) {
                setError(err?.response?.data?.message || 'Could not book. Try again.');
              } finally {
                setSubmitting(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---------- Client form (no slot logic, just a manual booking) ----------
function ClientBookingForm({ palette, form, setForm, submitting, error, onBack, onSubmit }) {
  const labelStyle = { display: 'block', fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 5 };
  const inputStyle = {
    width: '100%', padding: '9px 11px', borderRadius: 8,
    backgroundColor: palette.surfaceAlt, color: palette.text,
    fontFamily: baseFont, fontSize: 13, border: `1px solid ${palette.border}`, outline: 'none',
  };
  return (
    <div>
      <BackBtn palette={palette} onClick={onBack} />
      <h4 style={titleStyle(palette)}>Book a client call</h4>
      <p style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, marginTop: -8, marginBottom: 16 }}>
        Fill the details — it'll go straight on your calendar.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Kickoff call with Acme Co."
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Client name</label>
            <input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="optional"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Client email *</label>
            <input
              type="email"
              value={form.clientEmail}
              onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
              placeholder="client@company.com"
              style={{ ...inputStyle, fontFamily: monoFont }}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's this call about?"
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Time *</label>
            <input
              type="time"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              style={{ ...inputStyle, fontFamily: monoFont }}
            />
          </div>
          <div>
            <label style={labelStyle}>Duration</label>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              style={inputStyle}
            >
              {[15, 30, 45, 60, 90, 120].map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Meeting link</label>
          <input
            value={form.meetingLink}
            onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
            placeholder="Leave blank to use your default link"
            style={{ ...inputStyle, fontFamily: monoFont }}
          />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, fontFamily: baseFont, fontSize: 12, color: palette.danger }}>{error}</div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        style={{
          width: '100%', marginTop: 18, padding: '11px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
          backgroundColor: palette.accent, color: palette.accentText,
          fontFamily: baseFont, fontSize: 13.5, fontWeight: 500,
          opacity: submitting ? 0.5 : 1,
        }}
      >
        {submitting ? 'Saving…' : 'Save booking'}
      </button>

      <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute, marginTop: 10, textAlign: 'center' }}>
        Email invite to the client will be added in a future update.
      </div>
    </div>
  );
}

function titleStyle(palette) {
  return { fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginTop: 0, marginBottom: 14 };
}

function ModeOption({ palette, icon: Icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12,
        border: `1px solid ${palette.border}`, backgroundColor: palette.surface,
        textAlign: 'left', cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = palette.accent)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = palette.border)}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: palette.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={palette.accent} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: baseFont, fontSize: 14.5, fontWeight: 500, color: palette.text }}>{title}</div>
        <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  );
}

function BackBtn({ palette, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}
    >
      <ArrowLeft size={13} /> Back
    </button>
  );
}

function NextBtn({ palette, disabled, hint, onClick, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          padding: '10px 22px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: palette.accent, color: palette.accentText,
          fontFamily: baseFont, fontSize: 13, fontWeight: 500,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {children}
      </button>
      {hint && (
        <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginLeft: 10 }}>{hint}</span>
      )}
    </div>
  );
}
