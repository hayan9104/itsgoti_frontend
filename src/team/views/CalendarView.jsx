import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Copy, Check,
  Trash2, X, CalendarDays, Video, Phone, MapPin, Globe, ExternalLink, Link2, Share2,
} from 'lucide-react';
import { teamCalendarAPI } from '../teamAPI';
import { publicBookingAPI } from '../publicBookingAPI';
import { prefetchPublicBooking } from '../publicBookingCache';
import { getCached, setCached, invalidate } from '../teamCache';
import { baseFont, serifFont, monoFont } from '../theme';
import { Avatar, PageHeader, SolidButton, GhostButton } from '../components/Primitives';
import BlockModal from '../components/BlockModal';
import BookingDetailModal from '../components/BookingDetailModal';
import InternalBookingModal from '../components/InternalBookingModal';

// ---------- shared constants & helpers ----------

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GRID_START = 8;
const GRID_END = 21;
const HOUR_H = 50;
const GUTTER = 54;

const TIME_OPTIONS = (() => {
  const a = [];
  for (let m = 360; m <= 1320; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    a.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return a;
})();

function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function fromMin(min) {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
function fmt12(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
function addMinStr(hhmm, mins) {
  return fromMin(((toMin(hhmm) + mins) % 1440 + 1440) % 1440);
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Mirrors server/utils/blockRecurrence.js — keep the two in sync.
function blockAppliesOn(block, dateObj) {
  if (!block) return false;
  const targetKey = dateKey(dateObj);
  if (targetKey < block.dateKey) return false;
  if (block.endDate && targetKey > block.endDate) return false;
  if (Array.isArray(block.exceptions) && block.exceptions.includes(targetKey)) return false;

  const repeat = block.repeat || 'NONE';
  if (repeat === 'NONE') return targetKey === block.dateKey;
  if (repeat === 'WEEKDAYS') {
    const dow = dateObj.getDay();
    return dow >= 1 && dow <= 5;
  }
  if (repeat === 'WEEKLY') {
    const startDate = new Date(`${block.dateKey}T00:00:00`);
    return startDate.getDay() === dateObj.getDay();
  }
  return false;
}

function weekDates(offset) {
  const base = new Date();
  const dow = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - dow + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
function locationIcon(loc) {
  return loc === 'Google Meet' ? Video : loc === 'Phone call' ? Phone : loc === 'In person' ? MapPin : Globe;
}

const Toggle = ({ on, onChange, palette }) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    style={{
      width: 34, height: 20, borderRadius: 999,
      backgroundColor: on ? palette.accent : palette.border,
      position: 'relative', transition: 'background-color .15s', flexShrink: 0,
      border: 'none', cursor: 'pointer', padding: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 2, left: on ? 16 : 2,
      width: 16, height: 16, borderRadius: 999,
      backgroundColor: '#fff', transition: 'left .15s',
      boxShadow: '0 1px 2px rgba(0,0,0,.25)',
    }} />
  </button>
);

// ---------- main view ----------

export default function CalendarView({ palette, isDark, isAdmin, currentUserId, openTask }) {
  const [tab, setTab] = useState('schedule');
  // Seed from cache so the calendar paints instantly on tab switch.
  const cachedCfg = getCached('calendar:config:me');
  const cachedBookings = getCached('calendar:bookings');
  const cachedBlocks = getCached('calendar:blocks');
  const [config, setConfig] = useState(cachedCfg?.config || null);
  const [bookings, setBookings] = useState(cachedBookings?.bookings || []);
  const [blocks, setBlocks] = useState(cachedBlocks?.blocks || []);
  const [loading, setLoading] = useState(!cachedCfg);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showInternalBook, setShowInternalBook] = useState(false);
  const [bookingDetail, setBookingDetail] = useState(null);
  const [blockToDelete, setBlockToDelete] = useState(null); // { block, dateKey }

  // Load config + initial window of bookings & blocks. Cache results so subsequent visits paint instantly.
  const loadAll = async () => {
    if (!config) setLoading(true);
    try {
      const [cfgRes, bRes, blRes] = await Promise.all([
        teamCalendarAPI.getMyConfig(),
        teamCalendarAPI.listBookings(),
        teamCalendarAPI.listBlocks(),
      ]);
      setConfig(cfgRes.data.config);
      setBookings(bRes.data.bookings || []);
      setBlocks(blRes.data.blocks || []);
      setCached('calendar:config:me', cfgRes.data);
      setCached('calendar:bookings', bRes.data);
      setCached('calendar:blocks', blRes.data);
    } catch (err) {
      console.error('[Calendar] load failed:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Once we know the slug, warm the public booking page cache so clicking Preview
  // (or sharing the link) opens the page with host info + month slots already in
  // localStorage — first paint is instant instead of waiting for 2-3 round-trips.
  useEffect(() => {
    if (config?.slug) prefetchPublicBooking(config.slug, publicBookingAPI);
  }, [config?.slug]);

  // Light background refresh of bookings + blocks every 30s so a 3rd-party booking
  // made via the public link shows up on the schedule without a manual reload.
  // Refresh skips when the tab is hidden so we don't waste requests.
  useEffect(() => {
    const refresh = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const [bRes, blRes] = await Promise.all([
          teamCalendarAPI.listBookings(),
          teamCalendarAPI.listBlocks(),
        ]);
        setBookings(bRes.data.bookings || []);
        setBlocks(blRes.data.blocks || []);
        setCached('calendar:bookings', bRes.data);
        setCached('calendar:blocks', blRes.data);
      } catch {
        // silent — next tick will retry
      }
    };
    const id = setInterval(refresh, 30_000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const saveConfigPatch = async (patch) => {
    const res = await teamCalendarAPI.updateMyConfig(patch);
    setConfig(res.data.config);
    setCached('calendar:config:me', res.data);
    return res.data.config;
  };

  if (loading || !config) {
    return (
      <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, padding: 24 }}>
        Loading calendar…
      </div>
    );
  }

  const tabs = [
    { id: 'schedule', label: 'Schedule' },
    { id: 'availability', label: 'Availability' },
    { id: 'bookingLink', label: 'Booking Link' },
  ];
  if (isAdmin) tabs.push({ id: 'teamCalls', label: 'Team Calls' });
  const active = tabs.find((t) => t.id === tab) ? tab : 'schedule';

  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          borderRadius: 8,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.surface,
          padding: 3,
          marginBottom: 32,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: active === t.id ? palette.accentBg : 'transparent',
              color: active === t.id ? palette.accent : palette.textDim,
              fontFamily: baseFont,
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'schedule' && (
        <ScheduleTab
          palette={palette}
          config={config}
          bookings={bookings}
          blocks={blocks}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          onAddBlock={() => setShowBlockModal(true)}
          onBookMeeting={() => setShowInternalBook(true)}
          onOpenBooking={(b) => setBookingDetail(b)}
          onOpenBlock={(block, occurrenceDateKey) => setBlockToDelete({ block, dateKey: occurrenceDateKey })}
          switchToBookingLink={() => setTab('bookingLink')}
        />
      )}
      {active === 'availability' && (
        <AvailabilityTab
          palette={palette}
          config={config}
          onChange={saveConfigPatch}
          onBookMeeting={() => setShowInternalBook(true)}
        />
      )}
      {active === 'bookingLink' && (
        <BookingLinkTab
          palette={palette}
          config={config}
          onConfigChange={saveConfigPatch}
          reload={loadAll}
          onBookMeeting={() => setShowInternalBook(true)}
        />
      )}
      {active === 'teamCalls' && isAdmin && (
        <TeamCallsTab palette={palette} openTask={openTask} />
      )}

      <BlockModal
        open={showBlockModal}
        palette={palette}
        onClose={() => setShowBlockModal(false)}
        onCreated={(b) => setBlocks((arr) => [...arr, b])}
      />

      <InternalBookingModal
        open={showInternalBook}
        palette={palette}
        onClose={() => setShowInternalBook(false)}
        onBooked={loadAll}
      />

      <BookingDetailModal
        booking={bookingDetail}
        palette={palette}
        onClose={() => setBookingDetail(null)}
        onCancelled={(updated) => {
          setBookings((arr) => arr.map((b) => (b._id === updated._id ? updated : b)));
          setBookingDetail(null);
        }}
        openTask={openTask}
      />

      <BlockDeleteModal
        target={blockToDelete}
        palette={palette}
        onClose={() => setBlockToDelete(null)}
        onSkipOccurrence={async () => {
          const { block, dateKey: occKey } = blockToDelete;
          try {
            const res = await teamCalendarAPI.skipBlockOccurrence(block._id, occKey);
            if (res.data.deleted) {
              setBlocks((arr) => arr.filter((b) => b._id !== block._id));
            } else {
              setBlocks((arr) => arr.map((b) => (b._id === block._id ? res.data.block : b)));
            }
            invalidate('calendar:blocks');
            setBlockToDelete(null);
          } catch (err) {
            alert(err?.response?.data?.message || 'Could not skip this occurrence.');
          }
        }}
        onDeleteSeries={async () => {
          const { block } = blockToDelete;
          try {
            await teamCalendarAPI.removeBlock(block._id);
            setBlocks((arr) => arr.filter((b) => b._id !== block._id));
            invalidate('calendar:blocks');
            setBlockToDelete(null);
          } catch (err) {
            alert(err?.response?.data?.message || 'Could not delete the block.');
          }
        }}
      />
    </div>
  );
}

// ====================================================================
// BLOCK DELETE MODAL — recurring blocks get an extra "this occurrence" option
// ====================================================================
function BlockDeleteModal({ target, palette, onClose, onSkipOccurrence, onDeleteSeries }) {
  if (!target) return null;
  const { block, dateKey: occKey } = target;
  const isRecurring = block.repeat && block.repeat !== 'NONE';
  const niceDate = new Date(`${occKey}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

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
          borderRadius: 14, padding: 24, width: '100%', maxWidth: 420,
        }}
      >
        <h3 style={{ fontFamily: serifFont, fontSize: 20, fontWeight: 500, color: palette.text, margin: 0, marginBottom: 6 }}>
          {block.title}
        </h3>
        <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.06em', marginBottom: 16, textTransform: 'uppercase' }}>
          {niceDate}{isRecurring && ' · RECURRING'}
        </div>

        {isRecurring ? (
          <>
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginBottom: 16 }}>
              How do you want to remove this block?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={onSkipOccurrence}
                style={modalChoiceBtn(palette, false)}
              >
                <div style={{ fontFamily: baseFont, fontSize: 13.5, fontWeight: 500, color: palette.text }}>Only this occurrence</div>
                <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim, marginTop: 2 }}>
                  Keeps the rest of the series intact.
                </div>
              </button>
              <button
                type="button"
                onClick={onDeleteSeries}
                style={modalChoiceBtn(palette, true)}
              >
                <div style={{ fontFamily: baseFont, fontSize: 13.5, fontWeight: 500, color: palette.danger }}>Delete the entire series</div>
                <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim, marginTop: 2 }}>
                  Removes every past and future occurrence.
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginBottom: 16 }}>
              Delete this block?
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 13, color: palette.textDim, fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDeleteSeries}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: palette.accent, color: palette.accentText, fontFamily: baseFont, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </>
        )}

        {isRecurring && (
          <button
            type="button"
            onClick={onClose}
            style={{ marginTop: 12, width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, fontWeight: 500 }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function modalChoiceBtn(palette, danger) {
  return {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    backgroundColor: palette.surfaceAlt,
    border: `1px solid ${danger ? palette.dangerBg : palette.border}`,
    textAlign: 'left', cursor: 'pointer',
  };
}

// ====================================================================
// SCHEDULE TAB
// ====================================================================

function ScheduleTab({ palette, config, bookings, blocks, weekOffset, setWeekOffset, onAddBlock, onBookMeeting, onOpenBooking, onOpenBlock, switchToBookingLink }) {
  const [view, setView] = useState('week');
  const [dayIdx, setDayIdx] = useState((new Date().getDay() + 6) % 7);

  const week = useMemo(() => weekDates(weekOffset), [weekOffset]);
  const todayKey = dateKey(new Date());
  const weekKeys = week.map(dateKey);
  // Include cancelled — we render them in red so the user sees the cancellation history.
  const weekBookings = bookings.filter((b) => weekKeys.includes(b.dateKey));
  // Any block applying on any day in the visible week
  const weekHasBlocks = blocks.some((b) => week.some((d) => blockAppliesOn(b, d)));
  const rangeLabel = `${week[0].getDate()} ${MONTH_LABELS[week[0].getMonth()]} – ${week[6].getDate()} ${MONTH_LABELS[week[6].getMonth()]} ${week[6].getFullYear()}`;

  const dayDate = week[dayIdx] || week[0];
  const dayKey = dateKey(dayDate);
  const dayBookings = bookings.filter((b) => b.dateKey === dayKey).sort((a, b) => toMin(a.start) - toMin(b.start));
  const dayBlocks = blocks.filter((b) => blockAppliesOn(b, dayDate));
  const dayTotalMin = dayBookings.filter((b) => b.status !== 'cancelled').reduce((a, b) => a + b.duration, 0);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nextCall = dayBookings.find((b) => b.status !== 'cancelled' && toMin(b.start) > nowMin);

  const today = new Date();
  const kicker = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  return (
    <div>
      <PageHeader
        kicker={kicker}
        title="Your"
        accentWord="calendar"
        palette={palette}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton onClick={onAddBlock} icon={Plus} palette={palette}>Add block</GhostButton>
            <SolidButton onClick={onBookMeeting} icon={Video} palette={palette}>Book meeting</SolidButton>
          </div>
        }
      />

      {/* View toggle + week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'inline-flex', borderRadius: 8, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, padding: 3 }}>
          {[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                backgroundColor: view === v.id ? palette.accentBg : 'transparent',
                color: view === v.id ? palette.accent : palette.textDim,
                fontFamily: baseFont, fontSize: 12.5, fontWeight: 500,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: monoFont, fontSize: 12, color: palette.textDim }}>
            {view === 'week' ? rangeLabel : dayDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => view === 'week' ? setWeekOffset(weekOffset - 1) : setDayIdx((dayIdx + 6) % 7)}
              style={{ padding: 6, border: `1px solid ${palette.border}`, borderRadius: 6, background: 'transparent', color: palette.textDim, cursor: 'pointer' }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => { setWeekOffset(0); setDayIdx((new Date().getDay() + 6) % 7); }}
              style={{ padding: '6px 12px', border: 'none', background: 'transparent', color: palette.textDim, fontFamily: baseFont, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => view === 'week' ? setWeekOffset(weekOffset + 1) : setDayIdx((dayIdx + 1) % 7)}
              style={{ padding: 6, border: `1px solid ${palette.border}`, borderRadius: 6, background: 'transparent', color: palette.textDim, cursor: 'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state for week */}
      {view === 'week' && weekBookings.length === 0 && !weekHasBlocks ? (
        <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: serifFont, fontSize: 22, color: palette.text }}>Nothing booked this week.</div>
          <button
            type="button"
            onClick={switchToBookingLink}
            style={{ fontFamily: baseFont, fontSize: 13, color: palette.accent, fontWeight: 500, marginTop: 10, border: 'none', background: 'none', cursor: 'pointer' }}
          >
            Share your link to start taking calls →
          </button>
        </div>
      ) : view === 'week' ? (
        <WeekGrid
          palette={palette}
          week={week}
          todayKey={todayKey}
          bookings={weekBookings}
          blocks={blocks}
          onOpenBooking={onOpenBooking}
          onOpenBlock={onOpenBlock}
        />
      ) : (
        <DayView
          palette={palette}
          week={week}
          dayIdx={dayIdx}
          setDayIdx={setDayIdx}
          dayDate={dayDate}
          todayKey={todayKey}
          dayBookings={dayBookings}
          dayBlocks={dayBlocks}
          dayTotalMin={dayTotalMin}
          nextCall={nextCall}
          onOpenBooking={onOpenBooking}
          onOpenBlock={onOpenBlock}
        />
      )}
    </div>
  );
}

// ---------- week/day grid pieces ----------

function HourLines({ palette }) {
  return (
    <>
      {Array.from({ length: GRID_END - GRID_START }).map((_, i) => (
        <div key={i} style={{ height: HOUR_H, borderTop: `1px solid ${palette.border}` }} />
      ))}
    </>
  );
}
function NowLine({ palette }) {
  const now = new Date();
  const nm = now.getHours() * 60 + now.getMinutes();
  if (nm < GRID_START * 60 || nm > GRID_END * 60) return null;
  const top = ((nm - GRID_START * 60) / 60) * HOUR_H;
  return (
    <div style={{ position: 'absolute', top, left: 0, right: 0, height: 1, backgroundColor: palette.accent, zIndex: 5 }}>
      <span style={{ position: 'absolute', left: -3, top: -3, width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent }} />
    </div>
  );
}
function GridBooking({ b, big, palette, onClick }) {
  const top = ((toMin(b.start) - GRID_START * 60) / 60) * HOUR_H;
  const height = Math.max((b.duration / 60) * HOUR_H - 3, 22);
  const cancelled = b.status === 'cancelled';
  // External = booked from the public /meet/{slug} page (3rd-party visitor, not internal).
  const external = b.meetingType === 'public' && !b.bookedBy;
  const accent = cancelled ? palette.danger : (external ? '#0E7490' : palette.accent);
  const bg = cancelled ? palette.dangerBg : (external ? (palette.bg === '#0F0E0C' ? '#0E2A2F' : '#ECFEFF') : palette.accentBg);
  return (
    <div
      onClick={onClick}
      title={
        (cancelled ? 'Cancelled · ' : '') +
        (external ? 'External · ' : '') +
        `${b.clientName} · ${fmt12(b.start)}`
      }
      style={{
        position: 'absolute', top, left: big ? 6 : 3, right: big ? 6 : 3, height,
        backgroundColor: bg,
        borderLeft: `3px ${external ? 'dashed' : 'solid'} ${accent}`,
        borderRadius: 6, padding: big ? '8px 10px' : '4px 7px', cursor: 'pointer', overflow: 'hidden',
        opacity: cancelled ? 0.85 : 1,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontFamily: baseFont, fontSize: big ? 13 : 11, fontWeight: 500,
        color: cancelled ? palette.danger : palette.text,
        textDecoration: cancelled ? 'line-through' : 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {external && (
          <span
            title="Booked from your public link"
            style={{
              flexShrink: 0,
              width: big ? 6 : 5, height: big ? 6 : 5, borderRadius: 999,
              backgroundColor: accent,
              boxShadow: `0 0 0 2px ${bg}, 0 0 0 3px ${accent}`,
            }}
          />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.clientName}</span>
      </div>
      <div style={{
        fontFamily: monoFont, fontSize: big ? 11 : 9.5,
        color: cancelled ? palette.danger : accent,
        marginTop: 1,
      }}>
        {cancelled ? 'CANCELLED · ' : (external ? 'EXTERNAL · ' : '')}{fmt12(b.start)}{big && ` – ${fmt12(addMinStr(b.start, b.duration))}`}
      </div>
      {big && <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textDim, marginTop: 3, textDecoration: cancelled ? 'line-through' : 'none' }}>{b.eventTypeName}</div>}
    </div>
  );
}
function GridBlock({ blk, big, palette, onClick }) {
  const top = ((toMin(blk.start) - GRID_START * 60) / 60) * HOUR_H;
  const height = Math.max(((toMin(blk.end) - toMin(blk.start)) / 60) * HOUR_H - 3, 20);
  const isRecurring = blk.repeat && blk.repeat !== 'NONE';
  return (
    <div
      onClick={onClick}
      title={isRecurring ? `${blk.title} · recurring — click to edit` : `${blk.title} — click to delete`}
      style={{
        position: 'absolute', top, left: big ? 6 : 3, right: big ? 6 : 3, height,
        backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}`,
        borderRadius: 6, padding: big ? '6px 10px' : '3px 7px', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontFamily: baseFont, fontSize: big ? 12 : 10.5, fontWeight: 500, color: palette.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
        {isRecurring && (
          <span style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.accent, flexShrink: 0 }} />
        )}
        {blk.title}
      </div>
    </div>
  );
}

function WeekGrid({ palette, week, todayKey, bookings, blocks, onOpenBooking, onOpenBlock }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${palette.border}` }}>
        <div style={{ width: GUTTER, flexShrink: 0 }} />
        {week.map((d, i) => {
          const isToday = dateKey(d) === todayKey;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderLeft: `1px solid ${palette.border}` }}>
              <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.06em' }}>
                {WEEKDAY_LABELS[i].toUpperCase()}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: serifFont, fontSize: 18, color: isToday ? palette.accent : palette.text }}>{d.getDate()}</span>
                {isToday && <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: palette.accent }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', position: 'relative' }}>
        <div style={{ width: GUTTER, flexShrink: 0 }}>
          {Array.from({ length: GRID_END - GRID_START }).map((_, i) => (
            <div key={i} style={{ height: HOUR_H, position: 'relative' }}>
              <span style={{ position: 'absolute', top: -7, right: 8, fontFamily: monoFont, fontSize: 9.5, color: palette.textMute }}>
                {fmt12(fromMin((GRID_START + i) * 60))}
              </span>
            </div>
          ))}
        </div>
        {week.map((d, i) => {
          const k = dateKey(d);
          const isToday = k === todayKey;
          const dayBookings = bookings.filter((b) => b.dateKey === k);
          const dayBlocks = blocks.filter((b) => blockAppliesOn(b, d));
          return (
            <div key={i} style={{ flex: 1, position: 'relative', borderLeft: `1px solid ${palette.border}` }}>
              <HourLines palette={palette} />
              {isToday && <NowLine palette={palette} />}
              {dayBlocks.map((blk) => (
                <GridBlock
                  key={`${blk._id}-${k}`}
                  blk={blk}
                  palette={palette}
                  onClick={() => onOpenBlock && onOpenBlock(blk, k)}
                />
              ))}
              {dayBookings.map((b) => (
                <GridBooking key={b._id} b={b} palette={palette} onClick={() => onOpenBooking(b)} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ palette, week, dayIdx, setDayIdx, dayDate, todayKey, dayBookings, dayBlocks, dayTotalMin, nextCall, onOpenBooking, onOpenBlock }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {week.map((d, i) => {
          const sel = i === dayIdx;
          const isToday = dateKey(d) === todayKey;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setDayIdx(i)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                backgroundColor: sel ? palette.accentBg : palette.surface,
                border: `1px solid ${sel ? palette.accent : palette.border}`,
              }}
            >
              <div style={{ fontFamily: monoFont, fontSize: 9.5, color: sel ? palette.accent : palette.textMute, letterSpacing: '0.06em' }}>
                {WEEKDAY_LABELS[i].toUpperCase()}
              </div>
              <div style={{ fontFamily: serifFont, fontSize: 17, color: sel ? palette.accent : (isToday ? palette.accent : palette.text), marginTop: 1 }}>{d.getDate()}</div>
            </button>
          );
        })}
      </div>
      <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textDim, letterSpacing: '0.04em', marginBottom: 14 }}>
        {dayBookings.length} CALL{dayBookings.length !== 1 ? 'S' : ''} · {Math.floor(dayTotalMin / 60)}H {dayTotalMin % 60}M TOTAL
        {nextCall && ` · NEXT AT ${fmt12(nextCall.start).toUpperCase()}`}
      </div>
      <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, overflow: 'hidden' }}>
        <div style={{ display: 'flex', position: 'relative' }}>
          <div style={{ width: GUTTER, flexShrink: 0 }}>
            {Array.from({ length: GRID_END - GRID_START }).map((_, i) => (
              <div key={i} style={{ height: HOUR_H, position: 'relative' }}>
                <span style={{ position: 'absolute', top: -7, right: 8, fontFamily: monoFont, fontSize: 9.5, color: palette.textMute }}>
                  {fmt12(fromMin((GRID_START + i) * 60))}
                </span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, position: 'relative', borderLeft: `1px solid ${palette.border}` }}>
            <HourLines palette={palette} />
            {dateKey(dayDate) === todayKey && <NowLine palette={palette} />}
            {dayBlocks.map((blk) => (
              <GridBlock
                key={`${blk._id}-${dateKey(dayDate)}`}
                blk={blk}
                big
                palette={palette}
                onClick={() => onOpenBlock && onOpenBlock(blk, dateKey(dayDate))}
              />
            ))}
            {dayBookings.map((b) => (
              <GridBooking key={b._id} b={b} big palette={palette} onClick={() => onOpenBooking(b)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// AVAILABILITY TAB
// ====================================================================

function AvailabilityTab({ palette, config, onChange, onBookMeeting }) {
  // Local draft state so we can debounce / batch saves while editing.
  const [draft, setDraft] = useState(config);
  useEffect(() => { setDraft(config); }, [config]);

  const setDay = (wd, patch) => {
    const next = draft.availability.map((a) => a.weekday === wd ? { ...a, ...patch } : a);
    setDraft({ ...draft, availability: next });
    onChange({ availability: next });
  };
  const setSlot = (wd, idx, which, val) => {
    const a = draft.availability.find((x) => x.weekday === wd);
    const slots = a.slots.map((s, i) => i === idx
      ? (which === 0 ? { start: val, end: s.end } : { start: s.start, end: val })
      : s);
    setDay(wd, { slots });
  };
  const addSlot = (wd) => {
    const a = draft.availability.find((x) => x.weekday === wd);
    if (a.slots.length >= 2) return;
    setDay(wd, { slots: [...a.slots, { start: '14:00', end: '17:00' }] });
  };
  const removeSlot = (wd, idx) => {
    const a = draft.availability.find((x) => x.weekday === wd);
    setDay(wd, { slots: a.slots.filter((_, i) => i !== idx) });
  };
  const setRule = (key, val) => {
    const rules = { ...draft.rules, [key]: val };
    setDraft({ ...draft, rules });
    onChange({ rules });
  };

  const ruleDefs = [
    { key: 'buffer', label: 'Buffer between calls', opts: [[0, '0 min'], [5, '5 min'], [10, '10 min'], [15, '15 min']] },
    { key: 'minNotice', label: 'Minimum notice', opts: [[0, 'No minimum notice'], [1, '1 hour'], [4, '4 hours'], [12, '12 hours'], [24, '1 day']] },
    { key: 'window', label: 'Booking window', opts: [[7, '1 week'], [14, '2 weeks'], [30, '1 month']] },
    { key: 'dailyLimit', label: 'Daily call limit', opts: [[0, 'No limit'], [2, '2 calls'], [4, '4 calls'], [6, '6 calls']] },
  ];

  const selectStyle = {
    backgroundColor: palette.surfaceAlt, color: palette.text, fontFamily: monoFont,
    fontSize: 12, border: `1px solid ${palette.border}`, borderRadius: 6, padding: '5px 8px', outline: 'none',
  };

  return (
    <div>
      <PageHeader
        kicker="WHEN YOU CAN BE BOOKED"
        title="Your"
        accentWord="availability"
        palette={palette}
        right={<SolidButton onClick={onBookMeeting} icon={Video} palette={palette}>Book meeting</SolidButton>}
      />

      <h3 style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, marginBottom: 14 }}>Weekly hours</h3>
      <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, overflow: 'hidden', marginBottom: 32 }}>
        {draft.availability.map((a, i) => (
          <div key={a.weekday} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 20px', borderBottom: i < 6 ? `1px solid ${palette.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 150, flexShrink: 0, paddingTop: 4 }}>
              <Toggle on={a.enabled} onChange={(v) => setDay(a.weekday, { enabled: v })} palette={palette} />
              <span style={{ fontFamily: baseFont, fontSize: 13.5, color: a.enabled ? palette.text : palette.textMute, fontWeight: 500 }}>
                {WEEKDAY_FULL[a.weekday]}
              </span>
            </div>
            {!a.enabled ? (
              <span style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textMute, paddingTop: 5 }}>— unavailable —</span>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {a.slots.length === 0 && (
                  <button
                    type="button"
                    onClick={() => addSlot(a.weekday)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: baseFont, fontSize: 12, color: palette.accent, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}
                  >
                    <Plus size={12} /> Add a time window
                  </button>
                )}
                {a.slots.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select value={s.start} onChange={(e) => setSlot(a.weekday, idx, 0, e.target.value)} style={selectStyle}>
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
                    </select>
                    <span style={{ color: palette.textMute, fontSize: 12 }}>–</span>
                    <select value={s.end} onChange={(e) => setSlot(a.weekday, idx, 1, e.target.value)} style={selectStyle}>
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
                    </select>
                    {a.slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlot(a.weekday, idx)}
                        style={{ color: palette.textMute, padding: 2, border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                    {idx === a.slots.length - 1 && a.slots.length < 2 && (
                      <button
                        type="button"
                        onClick={() => addSlot(a.weekday)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: baseFont, fontSize: 12, color: palette.accent, fontWeight: 500, marginLeft: 4, border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        <Plus size={12} /> add slot
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, marginBottom: 14 }}>Booking rules</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, backgroundColor: palette.border, border: `1px solid ${palette.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
        {ruleDefs.map((r) => (
          <div key={r.key} style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.surface }}>
            <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, fontWeight: 500 }}>{r.label}</span>
            <select value={draft.rules[r.key]} onChange={(e) => setRule(r.key, Number(e.target.value))} style={selectStyle}>
              {r.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={17} color={palette.accent} />
          </div>
          <div>
            <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>Google Calendar</div>
            <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginTop: 2 }}>
              {draft.googleConnected
                ? 'Connected — bookings sync both ways, busy events block your slots.'
                : 'Connect to push bookings and block out busy times automatically.'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ googleConnected: !draft.googleConnected })}
          style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
            backgroundColor: draft.googleConnected ? palette.surfaceAlt : palette.accent,
            color: draft.googleConnected ? palette.textDim : palette.accentText,
            border: draft.googleConnected ? `1px solid ${palette.border}` : 'none',
            fontFamily: baseFont, fontSize: 12.5, fontWeight: 500,
          }}
        >
          {draft.googleConnected ? 'Disconnect' : 'Connect Google Calendar'}
        </button>
      </div>
    </div>
  );
}

// ====================================================================
// BOOKING LINK TAB
// ====================================================================

// Public booking-page URL — Copy + Preview. Slug is server-assigned; not editable here yet.
function BookingUrlRow({ config, palette }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/meet/${config.slug}`
    : `/meet/${config.slug}`;

  const copy = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const preview = () => {
    window.open(`/meet/${config.slug}?preview=1`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ padding: 18, borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Link2 size={16} color={palette.textDim} style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: monoFont, fontSize: 14, color: palette.text, flex: 1, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {url}
      </span>
      <button
        type="button"
        onClick={copy}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
          backgroundColor: copied ? palette.accentBg : palette.surfaceAlt,
          color: copied ? palette.accent : palette.text,
          border: `1px solid ${copied ? palette.accent : palette.border}`,
          fontFamily: baseFont, fontSize: 12, fontWeight: 500,
        }}
      >
        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
      </button>
      <button
        type="button"
        onClick={preview}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
          backgroundColor: palette.accent, color: palette.accentText, border: 'none',
          fontFamily: baseFont, fontSize: 12, fontWeight: 500,
        }}
      >
        <ExternalLink size={12} /> Preview
      </button>
    </div>
  );
}

// Compact meeting-link row, same shape as the booking-URL row. Display by default; edit on demand.
function MeetingLinkRow({ config, palette, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(config.meetingLink || '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValue(config.meetingLink || ''); }, [config.meetingLink]);

  const startEdit = () => { setValue(config.meetingLink || ''); setEditing(true); };
  const cancelEdit = () => { setValue(config.meetingLink || ''); setEditing(false); };
  const save = async () => {
    const trimmed = value.trim();
    if (trimmed === (config.meetingLink || '').trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } finally { setSaving(false); }
  };
  const copy = () => {
    if (!config.meetingLink) return;
    navigator.clipboard?.writeText(config.meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasLink = !!(config.meetingLink && config.meetingLink.trim());

  return (
    <div style={{ padding: 18, borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Video size={16} color={palette.textDim} style={{ flexShrink: 0 }} />
      {editing ? (
        <>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); else if (e.key === 'Escape') cancelEdit(); }}
            placeholder="https://meet.google.com/abc-defg-hij"
            style={{
              flex: 1, minWidth: 200, padding: '7px 10px', borderRadius: 8,
              backgroundColor: palette.surfaceAlt, color: palette.text,
              fontFamily: monoFont, fontSize: 13, border: `1px solid ${palette.accent}`, outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              backgroundColor: palette.accent, color: palette.accentText, border: 'none',
              fontFamily: baseFont, fontSize: 12, fontWeight: 500, opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      ) : (
        <>
          <span style={{ fontFamily: monoFont, fontSize: 14, color: hasLink ? palette.text : palette.textMute, flex: 1, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hasLink ? config.meetingLink : 'No meeting link set — auto-generated per booking'}
          </span>
          {hasLink && (
            <button
              type="button"
              onClick={copy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                backgroundColor: copied ? palette.accentBg : palette.surfaceAlt,
                color: copied ? palette.accent : palette.text,
                border: `1px solid ${copied ? palette.accent : palette.border}`,
                fontFamily: baseFont, fontSize: 12, fontWeight: 500,
              }}
            >
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
          )}
          <button
            type="button"
            onClick={startEdit}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              backgroundColor: palette.surfaceAlt, color: palette.text,
              border: `1px solid ${palette.border}`,
              fontFamily: baseFont, fontSize: 12, fontWeight: 500,
            }}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}

function BookingLinkTab({ palette, config, onConfigChange, reload, onBookMeeting }) {
  const [working, setWorking] = useState(false);
  const [shareEvent, setShareEvent] = useState(null); // event-type object being shared

  const updateET = async (id, patch) => {
    setWorking(true);
    try {
      await teamCalendarAPI.updateEventType(id, patch);
      await reload();
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not save.');
    } finally { setWorking(false); }
  };
  const addET = async () => {
    if (config.eventTypes.length >= 3) return;
    setWorking(true);
    try {
      await teamCalendarAPI.createEventType({ name: 'New call type', duration: 30, description: '', location: 'Google Meet', active: true });
      await reload();
    } finally { setWorking(false); }
  };
  const deleteET = async (id) => {
    if (!window.confirm('Delete this event type? Existing bookings keep their original details.')) return;
    setWorking(true);
    try {
      await teamCalendarAPI.removeEventType(id);
      await reload();
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not delete.');
    } finally { setWorking(false); }
  };
  const saveMeetingLink = async (value) => {
    try {
      await onConfigChange({ meetingLink: value });
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not save link.');
    }
  };

  const selectStyle = {
    backgroundColor: palette.surfaceAlt, color: palette.text, fontFamily: baseFont,
    fontSize: 12, border: `1px solid ${palette.border}`, borderRadius: 6, padding: '5px 8px', outline: 'none',
  };

  return (
    <div>
      <PageHeader
        kicker="ONE LINK · ZERO BACK-AND-FORTH"
        title="Your booking"
        accentWord="link"
        palette={palette}
        right={<SolidButton onClick={onBookMeeting} icon={Video} palette={palette}>Book meeting</SolidButton>}
      />

      <BookingUrlRow config={config} palette={palette} />
      <MeetingLinkRow config={config} palette={palette} onSave={saveMeetingLink} />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, margin: 0 }}>Event types</h3>
        <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>{config.eventTypes.length} / 3</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        {config.eventTypes.map((et) => {
          const LIcon = locationIcon(et.location);
          return (
            <div key={et.id} style={{ padding: 16, borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, opacity: et.active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: palette.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LIcon size={15} color={palette.accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <input
                      value={et.name}
                      onChange={(e) => updateET(et.id, { name: e.target.value })}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: baseFont, fontSize: 14, fontWeight: 500, color: palette.text }}
                    />
                    {et.isDefault && (
                      <span title="Default — used for internal team meetings, can't be removed"
                        style={{ fontFamily: monoFont, fontSize: 9.5, letterSpacing: '0.08em', color: palette.accent, backgroundColor: palette.accentBg, padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <input
                    value={et.description}
                    onChange={(e) => updateET(et.id, { description: e.target.value })}
                    placeholder="Add a one-line description…"
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: baseFont, fontSize: 12, color: palette.textDim }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <select value={et.duration} onChange={(e) => updateET(et.id, { duration: Number(e.target.value) })} style={selectStyle}>
                      {[15, 30, 45, 60].map((d) => <option key={d} value={d}>{d} min</option>)}
                    </select>
                    <select value={et.location} onChange={(e) => updateET(et.id, { location: e.target.value })} style={selectStyle}>
                      {['Google Meet', 'Phone call', 'In person', 'Custom link'].map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                  <Toggle
                    on={et.active}
                    onChange={(v) => { if (!et.isDefault) updateET(et.id, { active: v }); }}
                    palette={palette}
                  />
                  {!et.isDefault && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setShareEvent(et)}
                        title="Share a direct link to this event type"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                          backgroundColor: palette.surfaceAlt, color: palette.text,
                          border: `1px solid ${palette.border}`, cursor: 'pointer',
                          fontFamily: baseFont, fontSize: 11.5, fontWeight: 500,
                        }}
                      >
                        <Share2 size={11} /> Share
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteET(et.id)}
                        style={{ color: palette.textMute, border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addET}
        disabled={config.eventTypes.length >= 3 || working}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
          backgroundColor: palette.surfaceAlt,
          color: config.eventTypes.length >= 3 ? palette.textMute : palette.text,
          border: `1px solid ${palette.border}`,
          fontFamily: baseFont, fontSize: 13, fontWeight: 500,
          cursor: config.eventTypes.length >= 3 ? 'not-allowed' : 'pointer',
          opacity: config.eventTypes.length >= 3 ? 0.6 : 1,
        }}
      >
        <Plus size={14} /> New event type
      </button>
      {config.eventTypes.length >= 3 && (
        <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.textMute, marginLeft: 12 }}>
          3 is the max — keep it simple.
        </span>
      )}

      <ShareEventModal
        event={shareEvent}
        slug={config.slug}
        palette={palette}
        onClose={() => setShareEvent(null)}
      />
    </div>
  );
}

// Per-event-type share modal — gives a URL that locks the booking page to a single
// event so the visitor never has to choose. Format: /meet/{slug}?event={id}
function ShareEventModal({ event, slug, palette, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!event) return null;
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/meet/${slug}?event=${event.id}`
    : `/meet/${slug}?event=${event.id}`;

  const copy = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const preview = () => {
    window.open(`/meet/${slug}?event=${event.id}&preview=1`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
          borderRadius: 14, padding: 24, width: '100%', maxWidth: 480,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: serifFont, fontSize: 20, fontWeight: 500, color: palette.text, margin: 0 }}>
              Share <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{event.name}</em>
            </h3>
            <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.06em', marginTop: 4, textTransform: 'uppercase' }}>
              {event.duration} MIN · {event.location}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: palette.textMute, border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginBottom: 16, lineHeight: 1.5 }}>
          Anyone with this link will only see <strong style={{ color: palette.text }}>{event.name}</strong> — the other event types stay hidden.
        </div>

        <div style={{
          padding: 14, borderRadius: 10,
          backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}`,
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
        }}>
          <Link2 size={14} color={palette.textDim} style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: monoFont, fontSize: 13, color: palette.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={preview}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              backgroundColor: palette.surfaceAlt, color: palette.text,
              border: `1px solid ${palette.border}`,
              fontFamily: baseFont, fontSize: 12.5, fontWeight: 500,
            }}
          >
            <ExternalLink size={12} /> Preview
          </button>
          <button
            type="button"
            onClick={copy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              backgroundColor: copied ? palette.accentBg : palette.accent,
              color: copied ? palette.accent : palette.accentText,
              border: copied ? `1px solid ${palette.accent}` : 'none',
              fontFamily: baseFont, fontSize: 12.5, fontWeight: 500,
            }}
          >
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy link</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TEAM CALLS TAB (admin)
// ====================================================================

function TeamCallsTab({ palette, openTask }) {
  const [bookings, setBookings] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const week = weekDates(0);
        const from = dateKey(week[0]);
        const to = dateKey(week[6]);
        const [bRes, cRes] = await Promise.all([
          teamCalendarAPI.listBookings({ all: true, from, to, status: 'confirmed' }),
          teamCalendarAPI.getAllConfigs(),
        ]);
        if (cancelled) return;
        setBookings(bRes.data.bookings || []);
        setConfigs(cRes.data.configs || []);
      } catch (err) {
        console.error('[Calendar] team calls load failed:', err?.response?.data?.message || err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim }}>Loading team calls…</div>;
  }

  const week = weekDates(0);
  const weekKeys = week.map(dateKey);
  const totalMin = bookings.reduce((a, b) => a + b.duration, 0);
  const byDay = weekKeys.map((k) => bookings.filter((b) => b.dateKey === k));
  const busiestIdx = byDay.reduce((best, arr, i) => arr.length > byDay[best].length ? i : best, 0);
  const byHost = {};
  bookings.forEach((b) => { const id = b.hostId; byHost[id] = (byHost[id] || 0) + 1; });
  const topHostId = Object.keys(byHost).sort((a, b) => byHost[b] - byHost[a])[0];
  const topHost = configs.find((c) => String(c.employeeId) === String(topHostId));
  const upcoming = [...bookings].sort((a, b) => (a.dateKey + a.start).localeCompare(b.dateKey + b.start));

  const stats = [
    { label: 'Calls this week', value: bookings.length },
    { label: 'Total call hours', value: `${(totalMin / 60).toFixed(1)}h` },
    { label: 'Busiest day', value: bookings.length ? WEEKDAY_LABELS[busiestIdx] : '—' },
    { label: 'Most calls', value: topHost ? topHost.employee.name.split(' ')[0] : '—' },
  ];

  return (
    <div>
      <PageHeader kicker="READ-ONLY · TRANSPARENCY NOT SURVEILLANCE" title="Team" accentWord="calls" palette={palette} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, backgroundColor: palette.border, border: `1px solid ${palette.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ padding: 20, backgroundColor: palette.surface }}>
            <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontFamily: serifFont, fontSize: 32, fontWeight: 300, color: palette.text, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, marginBottom: 14 }}>Call load, this week</h3>
      <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(7, 1fr)', padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, backgroundColor: palette.surfaceAlt }}>
          <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', fontWeight: 500 }}>EMPLOYEE</div>
          {week.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.04em', fontWeight: 500 }}>
              {WEEKDAY_LABELS[i].toUpperCase()} {d.getDate()}
            </div>
          ))}
        </div>
        {configs.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
            No team members have set up their calendars yet.
          </div>
        ) : configs.map((c, ri) => (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '180px repeat(7, 1fr)', padding: '14px 20px', alignItems: 'center', borderBottom: ri < configs.length - 1 ? `1px solid ${palette.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={c.employee.avatar} size={28} palette={palette} />
              <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.text, fontWeight: 500 }}>{c.employee.name}</span>
            </div>
            {weekKeys.map((k, ci) => {
              const dayCalls = bookings.filter((b) => String(b.hostId) === String(c.employeeId) && b.dateKey === k);
              const mins = dayCalls.reduce((a, b) => a + b.duration, 0);
              return (
                <div key={ci} style={{ textAlign: 'center' }}>
                  {dayCalls.length ? (
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: palette.accentBg, padding: '5px 8px', minWidth: 44 }}>
                      <span style={{ fontFamily: baseFont, fontSize: 12, fontWeight: 500, color: palette.accent }}>{dayCalls.length}</span>
                      <span style={{ fontFamily: monoFont, fontSize: 9, color: palette.accent }}>{mins}m</span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>·</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, marginBottom: 14 }}>Upcoming team calls</h3>
      <div style={{ borderRadius: 12, border: `1px solid ${palette.border}`, backgroundColor: palette.surface, overflow: 'hidden' }}>
        {upcoming.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
            No calls booked this week.
          </div>
        ) : upcoming.map((b, i) => {
          const dObj = new Date(`${b.dateKey}T00:00:00`);
          const hostName = b.host?.name || 'Someone';
          return (
            <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < upcoming.length - 1 ? `1px solid ${palette.border}` : 'none' }}>
              <Avatar initials={b.host?.avatar || '?'} size={30} palette={palette} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>
                  {hostName} <span style={{ color: palette.textMute, fontWeight: 400 }}>· with {b.clientName}</span>
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim, marginTop: 2 }}>
                  {b.eventTypeName} · {b.duration}m
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: monoFont, fontSize: 12.5, color: palette.text }}>{fmt12(b.start)}</div>
                <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute }}>
                  {WEEKDAY_LABELS[(dObj.getDay() + 6) % 7]} {dObj.getDate()} {MONTH_LABELS[dObj.getMonth()]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Re-export helpers used by modal components
export { dateKey, fmt12, addMinStr, toMin, fromMin, TIME_OPTIONS, locationIcon, WEEKDAY_FULL, MONTH_LABELS };
