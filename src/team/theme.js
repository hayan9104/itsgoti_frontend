// Shared design tokens for the /team dashboard.
// Professional, clean, no emojis. Lucide icons are used everywhere instead.

export const baseFont = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const serifFont = "'Fraunces', Georgia, serif";
export const monoFont = "'JetBrains Mono', ui-monospace, monospace";

export function getPalette(isDark) {
  return isDark
    ? {
        bg: '#0F0E0C',
        surface: '#1A1916',
        surfaceAlt: '#15140F',
        border: '#2A2823',
        text: '#F0EFEA',
        textDim: '#8A8780',
        textMute: '#5C5A52',
        accent: '#7BC09A',
        accentBg: '#1E2E25',
        accentText: '#0F0E0C',
        danger: '#FCA5A5',
        dangerBg: '#3A1A1A',
        warn: '#F4C260',
        warnBg: '#3A2A0E',
        info: '#93C5FD',
        infoBg: '#1B2230',
      }
    : {
        bg: '#FAF9F6',
        surface: '#FFFFFF',
        surfaceAlt: '#F5F4EE',
        border: '#E8E6DF',
        text: '#1A1814',
        textDim: '#6B6862',
        textMute: '#A8A59E',
        accent: '#2D5A3D',
        accentBg: '#EEF3EF',
        accentText: '#FFFFFF',
        danger: '#991B1B',
        dangerBg: '#FEF2F2',
        warn: '#92400E',
        warnBg: '#FFFBEB',
        info: '#1E40AF',
        infoBg: '#EFF6FF',
      };
}

export function statusMeta(palette, isDark) {
  return {
    working: { label: 'Working', dot: '#10B981', bg: isDark ? '#10301F' : '#ECFDF5', text: isDark ? '#7BC09A' : '#065F46' },
    break: { label: 'On break', dot: '#F59E0B', bg: palette.warnBg, text: palette.warn },
    afk: { label: 'AFK', dot: '#A78BFA', bg: isDark ? '#2A1F4A' : '#F5F3FF', text: isDark ? '#C4B5FD' : '#5B21B6' },
    offline: { label: 'Not joined', dot: '#9CA3AF', bg: palette.surfaceAlt, text: palette.textDim },
    ended: { label: 'Wrapped', dot: '#9CA3AF', bg: palette.surfaceAlt, text: palette.textDim },
  };
}

export const priorityMeta = {
  urgent: { color: '#DC2626', label: 'Urgent' },
  high: { color: '#EA580C', label: 'High' },
  medium: { color: '#D97706', label: 'Medium' },
  low: { color: '#6B7280', label: 'Low' },
};

export function taskStatusMeta(palette, isDark) {
  return {
    pending: { label: 'Pending', bg: palette.surfaceAlt, text: palette.textDim },
    in_progress: { label: 'In progress', bg: isDark ? '#10301F' : '#ECFDF5', text: isDark ? '#7BC09A' : '#065F46' },
    review: { label: 'In review', bg: palette.warnBg, text: palette.warn },
    blocked: { label: 'Blocked', bg: palette.dangerBg, text: palette.danger },
    completed: { label: 'Done', bg: palette.infoBg, text: palette.info },
  };
}

export function fmtClock(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function fmtMinutes(min) {
  if (!min) return '0m';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function parseEstimateInput(input) {
  if (typeof input === 'number') return Math.max(0, Math.round(input));
  if (typeof input !== 'string' || !input.trim()) return 0;
  const s = input.trim().toLowerCase();
  let total = 0;
  const hr = s.match(/(\d+(?:\.\d+)?)\s*h/);
  const mn = s.match(/(\d+)\s*m/);
  if (hr) total += parseFloat(hr[1]) * 60;
  if (mn) total += parseInt(mn[1], 10);
  if (!hr && !mn) {
    const num = parseFloat(s);
    if (!Number.isNaN(num)) total = num * 60;
  }
  return Math.max(0, Math.round(total));
}

export function initialsFrom(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ensureFontsLoaded() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('team-fonts')) return;
  const link = document.createElement('link');
  link.id = 'team-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Geist:wght@300..600&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);
}
