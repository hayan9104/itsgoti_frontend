import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Users2,
  History as HistoryIcon,
  Sun,
  Moon,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';
import { useTeamAuth } from '../TeamAuthContext';
import { getPalette, baseFont, serifFont, monoFont, ensureFontsLoaded } from '../theme';
import { Avatar } from '../components/Primitives';
import ChangePasswordModal from '../components/ChangePasswordModal';

import AdminHomeView from '../views/AdminHomeView';
import EmployeeHomeView from '../views/EmployeeHomeView';
import TasksView from '../views/TasksView';
import TeamView from '../views/TeamView';
import LeavesView from '../views/LeavesView';
import ReportsView from '../views/ReportsView';
import HistoryView from '../views/HistoryView';

function SidebarItem({ icon: Icon, label, id, active, onClick, palette, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = palette.surfaceAlt;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 8,
        backgroundColor: active ? palette.accentBg : 'transparent',
        color: active ? palette.accent : palette.textDim,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: baseFont,
        fontSize: 13.5,
        fontWeight: active ? 500 : 400,
      }}
    >
      <Icon size={16} strokeWidth={1.75} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute }}>{badge}</span>
      )}
    </button>
  );
}

export default function TeamDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, logout, refresh } = useTeamAuth();
  const [view, setView] = useState('dashboard');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('team_theme') === 'dark');
  const [drilldownEmployeeId, setDrilldownEmployeeId] = useState(null);
  const palette = getPalette(isDark);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  useEffect(() => {
    localStorage.setItem('team_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (user?.mustChangePassword) setShowChangePassword(true);
    else setShowChangePassword(false);
  }, [user]);

  const onLogout = () => {
    logout();
    navigate('/team', { replace: true });
  };

  const switchView = (v) => {
    setView(v);
    setDrilldownEmployeeId(null);
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: palette.bg, color: palette.text, fontFamily: baseFont, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 232,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${palette.border}`,
            backgroundColor: palette.surfaceAlt,
            padding: '20px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: 28 }}>
            <div style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 500, color: palette.text, letterSpacing: '-0.01em' }}>
              GOTI<span style={{ color: palette.accent }}>.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              title={isDark ? 'Switch to light' : 'Switch to dark'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textDim, padding: 4 }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              id="dashboard"
              active={view === 'dashboard'}
              onClick={() => switchView('dashboard')}
              palette={palette}
            />
            <SidebarItem
              icon={CheckSquare}
              label={isAdmin ? 'Tasks' : 'My tasks'}
              id="tasks"
              active={view === 'tasks'}
              onClick={() => switchView('tasks')}
              palette={palette}
            />
            {isAdmin && (
              <SidebarItem
                icon={Users2}
                label="Team"
                id="team"
                active={view === 'team'}
                onClick={() => switchView('team')}
                palette={palette}
              />
            )}
            <SidebarItem
              icon={CalendarDays}
              label="Leaves"
              id="leaves"
              active={view === 'leaves'}
              onClick={() => switchView('leaves')}
              palette={palette}
            />
            {isAdmin ? (
              <SidebarItem
                icon={BarChart3}
                label="Reports"
                id="reports"
                active={view === 'reports'}
                onClick={() => switchView('reports')}
                palette={palette}
              />
            ) : (
              <SidebarItem
                icon={HistoryIcon}
                label="My history"
                id="history"
                active={view === 'history'}
                onClick={() => switchView('history')}
                palette={palette}
              />
            )}
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 6px',
                borderTop: `1px solid ${palette.border}`,
                marginTop: 8,
                paddingTop: 14,
              }}
            >
              <Avatar initials={user.avatar} size={32} palette={palette} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute }}>
                  {user.jobTitle} · {isAdmin ? 'Admin' : 'Member'}
                </div>
              </div>
              <button
                type="button"
                title="Log out"
                onClick={onLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textDim, padding: 6 }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              padding: '14px 40px',
              borderBottom: `1px solid ${palette.border}`,
              backgroundColor: palette.surface,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: palette.textMute }} />
              <input
                placeholder={isAdmin ? 'Search team, tasks…' : 'Search your tasks…'}
                style={{
                  padding: '8px 12px 8px 34px',
                  borderRadius: 8,
                  backgroundColor: palette.surfaceAlt,
                  border: `1px solid ${palette.border}`,
                  color: palette.text,
                  fontFamily: baseFont,
                  fontSize: 12.5,
                  width: 240,
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="button"
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
              <Bell size={15} />
            </button>
          </div>

          <div style={{ padding: '36px 40px', maxWidth: 1180, margin: '0 auto' }}>
            {view === 'dashboard' && (isAdmin ? (
              <AdminHomeView palette={palette} isDark={isDark} setView={switchView} setDrilldownEmployeeId={setDrilldownEmployeeId} />
            ) : (
              <EmployeeHomeView palette={palette} isDark={isDark} user={user} setView={switchView} />
            ))}
            {view === 'tasks' && <TasksView palette={palette} isDark={isDark} isAdmin={isAdmin} currentUserId={user.id} />}
            {view === 'team' && isAdmin && (
              <TeamView
                palette={palette}
                isDark={isDark}
                currentUserId={user.id}
                setView={switchView}
                setDrilldownEmployeeId={setDrilldownEmployeeId}
              />
            )}
            {view === 'leaves' && <LeavesView palette={palette} isDark={isDark} isAdmin={isAdmin} />}
            {view === 'reports' && isAdmin && (
              <ReportsView
                palette={palette}
                isDark={isDark}
                drilldownEmployeeId={drilldownEmployeeId}
                setDrilldownEmployeeId={setDrilldownEmployeeId}
              />
            )}
            {view === 'history' && !isAdmin && <HistoryView palette={palette} isDark={isDark} currentUserId={user.id} />}
          </div>
        </main>
      </div>

      <ChangePasswordModal
        open={showChangePassword}
        palette={palette}
        onDone={async () => {
          setShowChangePassword(false);
          await refresh();
        }}
      />
    </div>
  );
}
