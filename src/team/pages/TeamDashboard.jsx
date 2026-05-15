import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  CalendarClock,
  BarChart3,
  MonitorPlay,
  Users2,
  History as HistoryIcon,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useTeamAuth } from '../TeamAuthContext';
import { warmTeamCache } from '../teamCache';
import {
  teamEmployeesAPI,
  teamSessionsAPI,
  teamTasksAPI,
  teamLeavesAPI,
  teamSettingsAPI,
  teamCalendarAPI,
  teamReportsAPI,
} from '../teamAPI';
import { teamRecordingsAPI } from '../teamRecordingAPI';
import { RecorderProvider } from '../recording/RecorderContext';
import RecordingOverlays from '../recording/RecordingOverlays';
import { getPalette, baseFont, serifFont, monoFont, ensureFontsLoaded } from '../theme';
import { Avatar } from '../components/Primitives';
import ChangePasswordModal from '../components/ChangePasswordModal';
import NotificationsBell from '../components/NotificationsBell';
import JoinEndButton from '../components/JoinEndButton';

import AdminHomeView from '../views/AdminHomeView';
import EmployeeHomeView from '../views/EmployeeHomeView';
import TasksView from '../views/TasksView';
import TeamView from '../views/TeamView';
import LeavesView from '../views/LeavesView';
import ReportsView from '../views/ReportsView';
import RecordingsView from '../views/RecordingsView';
import RecordingWatchView from '../views/RecordingWatchView';
import HistoryView from '../views/HistoryView';
import TaskDetailView from '../views/TaskDetailView';
import TeamSettingsView from '../views/TeamSettingsView';
import LeaveDetailView from '../views/LeaveDetailView';
import LeaveCategoryDetailView from '../views/LeaveCategoryDetailView';
import CalendarView from '../views/CalendarView';

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
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [watchingRecordingId, setWatchingRecordingId] = useState(null);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [leaveCategoryCtx, setLeaveCategoryCtx] = useState(null); // { employeeId, category }
  const [highlightTaskId, setHighlightTaskId] = useState(null);
  const [highlightLeaveId, setHighlightLeaveId] = useState(null);
  const [previousView, setPreviousView] = useState(null);
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

  // Warm the team-area cache as soon as the user lands here. Fires during idle time so it
  // never blocks the dashboard's own render. Slot/availability endpoints are intentionally
  // NOT prefetched (they must always be fetched fresh to prevent double-booking).
  useEffect(() => {
    if (!user) return;
    warmTeamCache(
      {
        employees: teamEmployeesAPI,
        sessions: teamSessionsAPI,
        tasks: teamTasksAPI,
        leaves: teamLeavesAPI,
        settings: teamSettingsAPI,
        calendar: teamCalendarAPI,
        reports: teamReportsAPI,
        recordings: teamRecordingsAPI,
      },
      { isAdmin },
    );
  }, [user, isAdmin]);

  const onLogout = () => {
    logout();
    navigate('/team', { replace: true });
  };

  const switchView = (v) => {
    setView(v);
    setDrilldownEmployeeId(null);
    setSelectedTaskId(null);
    setSelectedLeaveId(null);
    setWatchingRecordingId(null);
    setLeaveCategoryCtx(null);
    setPreviousView(null);
  };

  const openRecording = (recordingId) => {
    setPreviousView(view);
    setWatchingRecordingId(recordingId);
    setView('recording-watch');
  };
  const closeRecording = () => {
    setWatchingRecordingId(null);
    setView(previousView || 'recordings');
    setPreviousView(null);
  };

  // Used by AdminHomeView + TeamView when clicking a person — jumps straight to that drilldown.
  const goToDrilldown = (employeeId) => {
    setDrilldownEmployeeId(employeeId);
    setView('reports');
  };

  // Open a single task's detail page. Remembers where the user came from.
  const openTask = (taskId) => {
    setPreviousView(view);
    setSelectedTaskId(taskId);
    setView('task-detail');
  };
  const closeTask = () => {
    setSelectedTaskId(null);
    setView(previousView || 'dashboard');
    setPreviousView(null);
  };

  const openLeave = (leaveId) => {
    setPreviousView(view);
    setSelectedLeaveId(leaveId);
    setView('leave-detail');
  };
  const closeLeave = () => {
    setSelectedLeaveId(null);
    setView(previousView || 'leaves');
    setPreviousView(null);
  };

  const openLeaveCategory = (employeeId, category) => {
    setPreviousView(view);
    setLeaveCategoryCtx({ employeeId, category });
    setView('leave-category-detail');
  };
  const closeLeaveCategory = () => {
    setLeaveCategoryCtx(null);
    setView(previousView || 'leaves');
    setPreviousView(null);
  };

  if (!user) return null;

  return (
    <RecorderProvider>
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
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            height: '100vh',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: 28 }}>
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
              icon={CalendarClock}
              label="Calendar"
              id="calendar"
              active={view === 'calendar'}
              onClick={() => switchView('calendar')}
              palette={palette}
            />
            <SidebarItem
              icon={MonitorPlay}
              label="Recordings"
              id="recordings"
              active={view === 'recordings' || view === 'recording-watch'}
              onClick={() => switchView('recordings')}
              palette={palette}
            />
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

          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${palette.border}` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
              }}
            >
              <button
                type="button"
                onClick={() => switchView('settings')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surface)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = view === 'settings' ? palette.accentBg : 'transparent')}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 8px',
                  border: 'none',
                  background: view === 'settings' ? palette.accentBg : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 8,
                  transition: 'background-color 120ms',
                }}
                title="Account settings"
              >
                <Avatar initials={user.avatar} size={32} palette={palette} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: baseFont,
                      fontSize: 13,
                      color: view === 'settings' ? palette.accent : palette.text,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.name}
                  </div>
                  <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute }}>
                    {user.jobTitle} · {isAdmin ? 'Admin' : 'Member'}
                  </div>
                </div>
              </button>
              <button
                type="button"
                title="Log out"
                onClick={onLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textDim, padding: 8, borderRadius: 6 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surface)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
            {!isAdmin && <JoinEndButton palette={palette} />}
            <NotificationsBell
              palette={palette}
              onNavigate={(n) => {
                if (n.relatedType === 'task') {
                  setHighlightTaskId(n.relatedId);
                  switchView('tasks');
                } else if (n.relatedType === 'leave') {
                  setHighlightLeaveId(n.relatedId);
                  switchView('leaves');
                }
              }}
            />
          </div>

          <div style={{ padding: '36px 40px', maxWidth: 1180, margin: '0 auto' }}>
            {view === 'dashboard' && (isAdmin ? (
              <AdminHomeView palette={palette} isDark={isDark} setView={switchView} goToDrilldown={goToDrilldown} openTask={openTask} />
            ) : (
              <EmployeeHomeView palette={palette} isDark={isDark} user={user} setView={switchView} openTask={openTask} />
            ))}
            {view === 'tasks' && (
              <TasksView
                palette={palette}
                isDark={isDark}
                isAdmin={isAdmin}
                currentUserId={user.id}
                highlightTaskId={highlightTaskId}
                clearHighlight={() => setHighlightTaskId(null)}
                openTask={openTask}
              />
            )}
            {view === 'task-detail' && selectedTaskId && (
              <TaskDetailView palette={palette} isDark={isDark} taskId={selectedTaskId} onBack={closeTask} openRecording={openRecording} />
            )}
            {view === 'team' && isAdmin && (
              <TeamView
                palette={palette}
                isDark={isDark}
                currentUserId={user.id}
                setView={switchView}
                goToDrilldown={goToDrilldown}
              />
            )}
            {view === 'calendar' && (
              <CalendarView
                palette={palette}
                isDark={isDark}
                isAdmin={isAdmin}
                currentUserId={user.id}
                openTask={openTask}
              />
            )}
            {view === 'leaves' && (
              <LeavesView
                palette={palette}
                isDark={isDark}
                isAdmin={isAdmin}
                currentUserId={user.id}
                highlightLeaveId={highlightLeaveId}
                clearHighlight={() => setHighlightLeaveId(null)}
                openLeave={openLeave}
                openLeaveCategory={openLeaveCategory}
              />
            )}
            {view === 'leave-detail' && selectedLeaveId && (
              <LeaveDetailView palette={palette} isDark={isDark} leaveId={selectedLeaveId} onBack={closeLeave} />
            )}
            {view === 'leave-category-detail' && leaveCategoryCtx && (
              <LeaveCategoryDetailView
                palette={palette}
                isDark={isDark}
                employeeId={leaveCategoryCtx.employeeId}
                category={leaveCategoryCtx.category}
                onBack={closeLeaveCategory}
                openLeave={openLeave}
              />
            )}
            {view === 'reports' && isAdmin && (
              <ReportsView
                palette={palette}
                isDark={isDark}
                drilldownEmployeeId={drilldownEmployeeId}
                setDrilldownEmployeeId={setDrilldownEmployeeId}
                openTask={openTask}
              />
            )}
            {view === 'recordings' && (
              <RecordingsView
                palette={palette}
                isDark={isDark}
                isAdmin={isAdmin}
                currentUserId={user.id}
                onOpenRec={openRecording}
              />
            )}
            {view === 'recording-watch' && watchingRecordingId && (
              <RecordingWatchView
                palette={palette}
                isDark={isDark}
                isAdmin={isAdmin}
                currentUserId={user.id}
                recordingId={watchingRecordingId}
                onBack={closeRecording}
              />
            )}
            {view === 'history' && !isAdmin && <HistoryView palette={palette} isDark={isDark} currentUserId={user.id} />}
            {view === 'settings' && <TeamSettingsView palette={palette} isDark={isDark} />}
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
      <RecordingOverlays />
    </div>
    </RecorderProvider>
  );
}
