import { useEffect, useState } from 'react';
import { Play, LogOut, Check } from 'lucide-react';
import { teamSessionsAPI } from '../teamAPI';
import { baseFont, monoFont } from '../theme';
import { Modal, GhostButton, SolidButton } from './Primitives';

// Event broadcast so other components (EmployeeHomeView) can re-fetch when state changes.
const EVENT = 'team-session-change';
export function broadcastSessionChange() {
  try { window.dispatchEvent(new Event(EVENT)); } catch {}
}

export default function JoinEndButton({ palette }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refresh = async () => {
    try {
      const { data } = await teamSessionsAPI.todayMe();
      if (data?.success) setSession(data.session);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(EVENT, onChange);
    const id = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener(EVENT, onChange);
      clearInterval(id);
    };
  }, []);

  const onJoin = async () => {
    setBusy(true);
    try {
      const { data } = await teamSessionsAPI.startDay();
      if (data?.success) {
        setSession(data.session);
        broadcastSessionChange();
      }
    } finally {
      setBusy(false);
    }
  };

  const onEnd = async () => {
    setBusy(true);
    try {
      const { data } = await teamSessionsAPI.endDay();
      if (data?.success) {
        setSession(data.session);
        broadcastSessionChange();
      }
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return null;

  // No session yet today → big Join button.
  if (!session) {
    return (
      <button
        type="button"
        onClick={onJoin}
        disabled={busy}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 18px',
          borderRadius: 999,
          backgroundColor: palette.accent,
          color: palette.accentText,
          border: 'none',
          fontFamily: baseFont,
          fontSize: 13.5,
          fontWeight: 500,
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.7 : 1,
        }}
      >
        <Play size={13} strokeWidth={2.5} />
        {busy ? 'Joining…' : 'Join day'}
      </button>
    );
  }

  // Session ended → small inactive badge.
  if (session.status === 'ended') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          borderRadius: 999,
          backgroundColor: palette.surfaceAlt,
          color: palette.textDim,
          fontFamily: monoFont,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          border: `1px solid ${palette.border}`,
        }}
      >
        <Check size={11} strokeWidth={2.5} />
        DAY WRAPPED
      </span>
    );
  }

  // Otherwise (working / break / afk) → End day button + confirm.
  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 999,
          backgroundColor: palette.surface,
          color: palette.danger,
          border: `1px solid ${palette.danger}55`,
          fontFamily: baseFont,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <LogOut size={13} strokeWidth={2.25} />
        End day
      </button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="End your day?" palette={palette} width={420}>
        <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.textDim, marginBottom: 18, lineHeight: 1.55 }}>
          Once you end the day, the timer stops, every running task pauses, and the session is closed.
          You can join again tomorrow.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <GhostButton onClick={() => setConfirmOpen(false)} palette={palette}>
            Cancel
          </GhostButton>
          <SolidButton onClick={onEnd} palette={palette} disabled={busy} icon={LogOut}>
            {busy ? 'Ending…' : 'End day'}
          </SolidButton>
        </div>
      </Modal>
    </>
  );
}
