import { useEffect, useRef, useState } from 'react';
import { Bell, CheckSquare, CalendarDays, FileText, Video, XCircle } from 'lucide-react';
import { teamNotificationsAPI } from '../teamAPI';
import { baseFont, monoFont } from '../theme';

function fmtRel(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const TYPE_META = {
  task_assigned: { icon: CheckSquare, color: '#2D5A3D' },
  task_created_by_employee: { icon: FileText, color: '#0E7490' },
  leave_applied: { icon: CalendarDays, color: '#7C3AED' },
  meeting_booked: { icon: Video, color: '#2D5A3D' },
  meeting_cancelled: { icon: XCircle, color: '#DC2626' },
};

export default function NotificationsBell({ palette, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unseen, setUnseen] = useState(0);
  const wrapRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await teamNotificationsAPI.list(20);
      if (data?.success) {
        setNotifications(data.notifications || []);
        setUnseen(data.unseenCount || 0);
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 5s so newly-booked meetings / cancellations appear without a manual refresh.
    // Pause while the page is hidden to avoid wasted requests, resume on focus.
    let id = setInterval(fetchNotifications, 5000);
    const onVisibility = () => {
      clearInterval(id);
      if (!document.hidden) {
        fetchNotifications();
        id = setInterval(fetchNotifications, 5000);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleClick = async (n) => {
    if (!n.seen) {
      teamNotificationsAPI.markSeen(n._id).catch(() => {});
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, seen: true } : x)));
      setUnseen((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (onNavigate) onNavigate(n);
  };

  const markAllSeen = async () => {
    if (!unseen) return;
    await teamNotificationsAPI.markAllSeen();
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
    setUnseen(0);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative',
          padding: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: palette.textDim,
        }}
        title="Notifications"
      >
        <Bell size={16} strokeWidth={2} />
        {unseen > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 999,
              backgroundColor: '#DC2626',
              color: '#fff',
              fontFamily: monoFont,
              fontSize: 10,
              fontWeight: 600,
              lineHeight: '16px',
              textAlign: 'center',
              boxShadow: `0 0 0 2px ${palette.surface}`,
            }}
          >
            {unseen > 99 ? '99+' : unseen}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxHeight: 480,
            overflowY: 'auto',
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${palette.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>
              Notifications
              {unseen > 0 && (
                <span style={{ marginLeft: 8, fontFamily: monoFont, fontSize: 11, color: '#DC2626', letterSpacing: '0.06em' }}>
                  {unseen} NEW
                </span>
              )}
            </span>
            {unseen > 0 && (
              <button
                type="button"
                onClick={markAllSeen}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: baseFont,
                  fontSize: 12,
                  color: palette.accent,
                  fontWeight: 500,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.task_assigned;
              const Icon = meta.icon;
              return (
                <button
                  type="button"
                  key={n._id}
                  onClick={() => handleClick(n)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = n.seen ? 'transparent' : palette.accentBg + '40')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    background: n.seen ? 'transparent' : palette.accentBg + '40',
                    border: 'none',
                    borderTop: `1px solid ${palette.border}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: meta.color + '20',
                      color: meta.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} strokeWidth={2.25} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>
                      {n.title}
                      {!n.seen && (
                        <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: '#DC2626', display: 'inline-block', verticalAlign: 'middle' }} />
                      )}
                    </div>
                    {n.body && (
                      <div
                        style={{
                          fontFamily: baseFont,
                          fontSize: 12.5,
                          color: palette.textDim,
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.04em', marginTop: 4 }}>
                      {fmtRel(n.createdAt).toUpperCase()}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
