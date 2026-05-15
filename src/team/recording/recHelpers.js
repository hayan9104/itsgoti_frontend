import { MonitorPlay, Monitor, Camera, Globe, Users2, Lock } from 'lucide-react';

// Shared formatters + meta dictionaries used by the recording UI.

export const REC_THUMBS = [
  ['#2D5A3D', '#16301F'],
  ['#3A4651', '#1E262E'],
  ['#5A4630', '#2C2216'],
  ['#3D4A2A', '#222B18'],
  ['#2C3A56', '#181F2E'],
  ['#4A2D44', '#2A1826'],
];

export function recThumbStyle(seed) {
  const idx = ((seed % REC_THUMBS.length) + REC_THUMBS.length) % REC_THUMBS.length;
  const [a, b] = REC_THUMBS[idx];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

// Stable seed from an id-like value so a given recording always gets the same gradient.
export function thumbSeedFor(id) {
  if (!id) return 0;
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const captureModeMeta = {
  SCREEN_CAM: { label: 'Screen + Camera', icon: MonitorPlay },
  SCREEN_ONLY: { label: 'Screen only', icon: Monitor },
  CAM_ONLY: { label: 'Camera only', icon: Camera },
};

export const visMeta = {
  ANYONE_WITH_LINK: { label: 'Anyone with link', short: 'Public link', icon: Globe },
  TEAM_ONLY: { label: 'GOTI team only', short: 'Team only', icon: Users2 },
  PRIVATE: { label: 'Private', short: 'Private', icon: Lock },
};

export function recFmtDur(sec) {
  const total = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function recRelTime(iso) {
  if (!iso) return '';
  const a = new Date(iso); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  const days = Math.round((b - a) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Convert a server `/uploads/...` path into a fully-qualified URL when running on a different origin.
// In production it's same-origin so this is a no-op; in dev it lets us point at the API server.
export function resolveBlobUrl(blobUrl) {
  if (!blobUrl) return '';
  if (/^https?:\/\//.test(blobUrl)) return blobUrl;
  return blobUrl;
}
