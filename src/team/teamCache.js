// Minimal in-memory cache + prefetch utilities for read-only team views.
//
// Rules:
//   - Used ONLY for read-only data (tasks list, reports, leaves, calendar bookings/blocks, etc.)
//   - NEVER used for slot/availability endpoints — booking flows must always fetch fresh
//     to prevent double-booking (the slot generator's anti-double-booking guard depends on
//     fresh per-day data, see slotGenerator.js)
//   - NEVER used for notifications — that endpoint has its own 5s poll
//   - Mutations should call invalidate(key) to evict stale entries
//
// Pattern in a view:
//   const [data, setData] = useState(() => getCached('tasks:list')?.tasks || []);
//   useEffect(() => {
//     teamTasksAPI.list().then(({ data }) => {
//       if (data?.success) { setData(data.tasks); setCached('tasks:list', data); }
//     });
//   }, []);

import { useEffect, useState } from 'react';

const cache = new Map(); // key -> { data, timestamp }
const inflight = new Map(); // key -> Promise — dedupes concurrent fetches
const DEFAULT_STALE_MS = 60_000; // 1 minute — beyond this, refetch in background

export function getCached(key) {
  const entry = cache.get(key);
  return entry ? entry.data : null;
}

export function isFresh(key, staleMs = DEFAULT_STALE_MS) {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp <= staleMs;
}

export function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  inflight.delete(key);
}

export function invalidate(keyOrPrefix) {
  // Wildcard support: 'tasks:*' clears every entry starting with 'tasks:'
  if (typeof keyOrPrefix === 'string' && keyOrPrefix.endsWith('*')) {
    const prefix = keyOrPrefix.slice(0, -1);
    for (const k of Array.from(cache.keys())) {
      if (k.startsWith(prefix)) cache.delete(k);
    }
    for (const k of Array.from(inflight.keys())) {
      if (k.startsWith(prefix)) inflight.delete(k);
    }
    return;
  }
  cache.delete(keyOrPrefix);
  inflight.delete(keyOrPrefix);
}

export function clearAll() {
  cache.clear();
  inflight.clear();
}

// Fire a fetch and cache the result. Dedupes concurrent calls for the same key.
// Returns the promise resolving to the data.
export function fetchAndCache(key, fetcher) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = Promise.resolve(fetcher())
    .then((res) => {
      const data = res?.data !== undefined ? res.data : res;
      setCached(key, data);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });
  inflight.set(key, promise);
  return promise;
}

// Fire-and-forget prefetch — kicks off the fetch in background. Skips if already fresh.
export function prefetch(key, fetcher, staleMs = DEFAULT_STALE_MS) {
  if (isFresh(key, staleMs)) return;
  fetchAndCache(key, fetcher).catch(() => { /* swallow — silent prefetch */ });
}

// Schedule a function to run during idle time (or next tick fallback).
function runWhenIdle(fn) {
  if (typeof window === 'undefined') { fn(); return; }
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fn, { timeout: 500 });
  } else {
    setTimeout(fn, 0);
  }
}

// Warm the team-area cache. Call this once when the user lands on /team after auth.
// `apis` is an object with the relevant API clients. `isAdmin` toggles admin-only prefetches.
export function warmTeamCache(apis, { isAdmin = false } = {}) {
  runWhenIdle(() => {
    // Common to all roles
    prefetch('tasks:list', () => apis.tasks.list());
    prefetch('leaves:list', () => apis.leaves.list());
    prefetch('leaves:balance:me', () => apis.leaves.myBalance());
    prefetch('settings', () => apis.settings.get());
    prefetch('sessions:today:all', () => apis.sessions.todayAll());
    prefetch('calendar:config:me', () => apis.calendar.getMyConfig());
    prefetch('calendar:bookings', () => apis.calendar.listBookings());
    prefetch('calendar:blocks', () => apis.calendar.listBlocks());
    prefetch('reports:me:weekly', () => apis.reports.myWeekly());

    if (isAdmin) {
      prefetch('employees:list', () => apis.employees.list());
      prefetch('reports:overview:week', () => apis.reports.overview('week'));
      prefetch('reports:overview:month', () => apis.reports.overview('month'));
      prefetch('leaves:balances:all', () => apis.leaves.allBalances());
      prefetch('calendar:config:all', () => apis.calendar.getAllConfigs());
      prefetch('calendar:hosts', () => apis.calendar.internalHosts());
    }
  });
}

// React hook: returns cached data immediately if present, fires background refetch when stale.
// `fetcher` should be a function that calls the API and returns the unwrapped data object
// (e.g. () => teamTasksAPI.list().then(r => r.data)).
export function useTeamQuery(key, fetcher, { staleMs = DEFAULT_STALE_MS, enabled = true } = {}) {
  const cached = getCached(key);
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(!cached && enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const existing = getCached(key);
    if (existing) setData(existing);

    // Skip refetch if cache is still fresh.
    if (isFresh(key, staleMs)) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    fetchAndCache(key, fetcher)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const refetch = async () => {
    invalidate(key);
    setLoading(!getCached(key));
    try {
      const d = await fetchAndCache(key, fetcher);
      setData(d);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
