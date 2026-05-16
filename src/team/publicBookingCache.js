// Cross-tab cache for the public booking page.
//
// The public booking page (`/meet/:slug`) is opened in a fresh browser tab — sometimes
// from the dashboard's Preview button, sometimes by an outside visitor following the
// shared link. A fresh tab gets a fresh JS heap, so the in-memory `teamCache` can't
// help it. We persist host + month-slots responses in localStorage with a short TTL
// so the page can hydrate instantly, then refresh in the background.
//
// Slot data is intentionally short-lived (60s) so the public page never shows
// stale availability while a booking is in flight elsewhere.

const TTL_HOST_MS = 5 * 60 * 1000;   // 5 minutes — host info changes rarely
const TTL_SLOTS_MS = 60 * 1000;       // 60s — slots can change as bookings come in

function nsKey(slug, kind, ...rest) {
  return `goti:meet:${slug}:${kind}${rest.length ? ':' + rest.join(':') : ''}`;
}

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj.t !== 'number') return null;
    return obj;
  } catch {
    return null;
  }
}
function safeWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
  } catch {
    // localStorage can throw on quota / private mode — silently skip
  }
}

export function readHost(slug) {
  const e = safeRead(nsKey(slug, 'host'));
  if (!e) return null;
  if (Date.now() - e.t > TTL_HOST_MS) return null;
  return e.data;
}
export function writeHost(slug, payload) {
  safeWrite(nsKey(slug, 'host'), payload);
}

export function readMonthSlots(slug, eventTypeId, year, month) {
  const e = safeRead(nsKey(slug, 'mo', eventTypeId, year, month));
  if (!e) return null;
  if (Date.now() - e.t > TTL_SLOTS_MS) return null;
  return e.data;
}
export function writeMonthSlots(slug, eventTypeId, year, month, payload) {
  safeWrite(nsKey(slug, 'mo', eventTypeId, year, month), payload);
}

// Detailed month slots — same shape as month-dot data but with full slot times
// per day (used to paint the time pills instantly when a date is clicked).
// Server still revalidates on click; this is a paint-fast hydration only.
export function readMonthSlotsDetail(slug, eventTypeId, year, month) {
  const e = safeRead(nsKey(slug, 'mod', eventTypeId, year, month));
  if (!e) return null;
  if (Date.now() - e.t > TTL_SLOTS_MS) return null;
  return e.data;
}
export function writeMonthSlotsDetail(slug, eventTypeId, year, month, payload) {
  safeWrite(nsKey(slug, 'mod', eventTypeId, year, month), payload);
}
// Pull a single day's slots out of the detail cache.
export function readDaySlotsFromDetail(slug, eventTypeId, year, month, dateKey) {
  const detail = readMonthSlotsDetail(slug, eventTypeId, year, month);
  if (!detail || !detail.days) return null;
  const list = detail.days[dateKey];
  if (!Array.isArray(list)) return null;
  return list;
}

// Best-effort prefetch from the dashboard side. Fires during idle so it never
// competes with the dashboard's own loads. Falls back gracefully when API or
// localStorage is unavailable.
export function prefetchPublicBooking(slug, publicBookingAPI) {
  if (!slug || !publicBookingAPI) return;

  const run = async () => {
    try {
      const hostRes = await publicBookingAPI.getHost(slug);
      const payload = { host: hostRes.data.host, eventTypes: hostRes.data.eventTypes || [] };
      writeHost(slug, payload);

      // Prefetch month dots for each active event type, current + next month.
      const now = new Date();
      const months = [
        { y: now.getFullYear(), m: now.getMonth() + 1 },
        { y: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), m: now.getMonth() === 11 ? 1 : now.getMonth() + 2 },
      ];
      const types = (payload.eventTypes || []).filter((e) => e.active !== false);

      // Run in parallel — these are read-only and small. Detail also implicitly
      // covers the dot view (we can derive counts from the lists), but we keep
      // both endpoints separate so the dot view stays light when called solo.
      await Promise.all(
        types.flatMap((et) =>
          months.flatMap(({ y, m }) => [
            publicBookingAPI.getMonthSlots(slug, et.id, y, m)
              .then((res) => writeMonthSlots(slug, et.id, y, m, res.data))
              .catch(() => {}),
            publicBookingAPI.getMonthSlotsDetail(slug, et.id, y, m)
              .then((res) => writeMonthSlotsDetail(slug, et.id, y, m, res.data))
              .catch(() => {}),
          ])
        )
      );
    } catch {
      // Silent — prefetch is fire-and-forget.
    }
  };

  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 1000 });
  } else {
    setTimeout(run, 0);
  }
}
