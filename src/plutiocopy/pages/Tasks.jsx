import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlutioCopyLayout from '../components/PlutioCopyLayout';
import { usePlutioCopyAuth } from '../context/PlutioCopyAuthContext';

/* ─── Helpers ─── */
const Icon = ({ d, size = 16, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d={d} />
  </svg>
);

const ICONS = {
  allTasks:    'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z',
  myTasks:     'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
  delegated:   'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z',
  following:   'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  today:       'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7-7h5v5h-5z',
  project:     'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z',
  info:        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  help:        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-3h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z',
  plus:        'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  search:      'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  kanban:      'M4 4h4v16H4zm6 0h4v10h-4zm6 0h4v6h-4z',
  editView:    'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  filter:      'M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z',
  group:       'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  order:       'M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z',
  archived:    'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z',
  import:      'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  chevDown:    'M7 10l5 5 5-5z',
  table:       'M4 4h16v4H4zm0 6h7v10H4zm9 0h7v4h-7zm0 6h7v4h-7z',
  close:       'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  arrowRight:  'M16.01 11H4v2h12.01v3L20 12l-3.99-4z',
  warning:     'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  rename:      'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z',
  settings:    'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z',
  duplicate:   'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  copy:        'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  move:        'M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z',
  template:    'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10V7H7v3zm0 4h10v-3H7v3zm0 3h10v-3H7v3z',
  export:      'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  archive:     'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5z',
  delete:      'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  enter:       'M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z',
  userPlus:    'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  toggleOn:    'M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  toggleOff:   'M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-10 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  check:       'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
};

const TASK_SET_COLORS = ['#6366f1', '#4b5563', '#22c55e', '#f97316', '#eab308', '#3b82f6', '#f1f1f1', '#e5e7eb'];
const ROLES = ['Client', 'Co-owner', 'Contributor'];

/* ─── Modal Component ─── */
const Modal = ({ title, onClose, children, footer, width = '540px' }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 10000,
  }}>
    <div style={{
      background: '#fff', borderRadius: '16px', width: '100%', maxWidth: width,
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' }}>{title}</h3>
        <button onClick={onClose} style={{ 
          background: 'none', border: '1px solid #f3f4f6', cursor: 'pointer', 
          padding: '6px', color: '#9ca3af', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s'
        }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
          <Icon d={ICONS.close} size={14} />
        </button>
      </div>
      <div style={{ padding: '0 32px 32px' }}>
        {children}
      </div>
      {footer && (
        <div style={{ 
          padding: '16px 32px 32px', background: '#fff', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' 
        }}>
          {footer}
        </div>
      )}
    </div>
  </div>
);

/* ─── Tasks middle panel ─── */
const TasksMiddlePanel = ({ activeView, projects, taskSets, onNavigate, onCreateProject, onCreateTaskSet, currentBoardId }) => {
  const [hoverTaskSet, setHoverTaskSet] = useState(false);
  const [hoverProject, setHoverProject] = useState(false);

  const TASK_FILTERS = [
    { id: 'all',       label: 'All tasks',   icon: 'allTasks',  path: '/plutiocopy/tasks' },
    { id: 'my',        label: 'My tasks',    icon: 'myTasks',   path: '/plutiocopy/tasks/my' },
    { id: 'delegated', label: 'Delegated',   icon: 'delegated', path: '/plutiocopy/tasks/delegated' },
    { id: 'following', label: 'Following',   icon: 'following', path: '/plutiocopy/tasks/following' },
    { id: 'today',     label: 'Today',       icon: 'today',     path: '/plutiocopy/tasks/today' },
  ];

  return (
    <div style={{ padding: '14px 10px', height: '100%', boxSizing: 'border-box' }}>
      {/* Task sets header */}
      <div 
        onMouseEnter={() => setHoverTaskSet(true)}
        onMouseLeave={() => setHoverTaskSet(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6px', marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Task sets
          </span>
          <Icon d={ICONS.info} size={13} color="#c4b5fd" />
        </div>
        {hoverTaskSet && (
          <button 
            onClick={onCreateTaskSet}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
          >
            <Icon d={ICONS.plus} size={16} />
          </button>
        )}
      </div>

      {/* Task sets list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '10px' }}>
        {taskSets.map(set => (
          <div 
            key={set.id} 
            onClick={() => onNavigate(`/plutiocopy/tasks/board/${set.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 8px', borderRadius: '6px',
              background: currentBoardId === set.id ? '#ededf8' : 'transparent',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { if (currentBoardId !== set.id) e.currentTarget.style.background = '#f0f0f8'; }}
            onMouseLeave={(e) => { if (currentBoardId !== set.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon d={ICONS.table} size={14} color={set.color || "#6d28d9"} />
            <span style={{ fontSize: '13px', fontWeight: currentBoardId === set.id ? '600' : '500', color: currentBoardId === set.id ? '#6d28d9' : '#1f2937' }}>{set.name}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e8e8ef', margin: '8px 0' }} />

      {/* Filter items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {TASK_FILTERS.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 8px', borderRadius: '6px',
                border: 'none', cursor: 'pointer', width: '100%',
                textAlign: 'left',
                background: active ? '#ededf8' : 'transparent',
                color: active ? '#6d28d9' : '#4b5563',
                fontWeight: active ? '600' : '400',
                fontSize: '13px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f0f0f8'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon d={ICONS[item.icon]} size={15} color={active ? '#6d28d9' : '#9ca3af'} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#e8e8ef', margin: '10px 0' }} />

      {/* Project tasks */}
      <div 
        onMouseEnter={() => setHoverProject(true)}
        onMouseLeave={() => setHoverProject(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 6px', marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Project tasks
          </span>
          <Icon d={ICONS.info} size={13} color="#c4b5fd" />
        </div>
        {hoverProject && (
          <button 
            onClick={onCreateProject}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
          >
            <Icon d={ICONS.plus} size={16} />
          </button>
        )}
      </div>

      {/* Dynamic Projects */}
      {projects.length === 0 ? (
        <div style={{ padding: '10px 6px', fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
          No projects yet
        </div>
      ) : (
        projects.map((p) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f8'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon d={ICONS.project} size={14} color="#6b7280" />
              <span style={{ fontSize: '13px', color: '#374151' }}>{p.name}</span>
            </div>
            <span style={{
              fontSize: '10px', fontWeight: '600', color: '#fff',
              background: '#3b82f6', borderRadius: '4px', padding: '1px 6px',
            }}>
              New
            </span>
          </div>
        ))
      )}
    </div>
  );
};

/* ─── Toolbar ─── */
const Toolbar = ({ onCreateTask, hideCreate = false }) => {
  const [view, setView] = useState('table');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '12px 20px', borderBottom: '1px solid #e0e0ec',
      background: '#fff', flexWrap: 'wrap',
    }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '6px',
        background: '#f9fafb', minWidth: '140px',
      }}>
        <Icon d={ICONS.search} size={14} color="#9ca3af" />
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Search</span>
      </div>

      {/* View toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: '6px',
        cursor: 'pointer', fontSize: '12px', color: '#374151',
        background: '#fff',
      }}>
        <Icon d={view === 'table' ? ICONS.table : ICONS.kanban} size={14} color="#6b7280" />
        <span>{view === 'table' ? 'Table' : 'Kanban'}</span>
        <Icon d={ICONS.chevDown} size={14} color="#9ca3af" />
      </div>

      {!hideCreate && (
        <button 
          onClick={onCreateTask}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 12px', border: 'none', borderRadius: '6px',
            background: '#6d28d9', cursor: 'pointer', fontSize: '12px', color: '#fff',
            whiteSpace: 'nowrap', fontWeight: '600',
          }}
        >
          <Icon d={ICONS.plus} size={13} color="#fff" />
          Create task
        </button>
      )}

      {[
        { label: 'Edit view', icon: 'editView' },
        { label: 'Filter',    icon: 'filter' },
        { label: 'Group',     icon: 'group' },
        { label: 'Order',     icon: 'order' },
        { label: 'Archived',  icon: 'archived' },
        { label: 'Project tasks', icon: 'project' },
        { label: 'Import / Export', icon: 'import' },
      ].map(({ label, icon }) => (
        <button key={label} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: '6px',
          background: 'none', cursor: 'pointer', fontSize: '12px', color: '#374151',
          whiteSpace: 'nowrap',
        }}>
          <Icon d={ICONS[icon]} size={13} color="#6b7280" />
          {label}
        </button>
      ))}
    </div>
  );
};

/* ─── Empty state ─── */
const EmptyState = ({ message, sub }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', minHeight: '300px',
    background: '#f5f5f8', borderRadius: '12px', margin: '16px',
  }}>
    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
      {message}
    </h3>
    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{sub}</p>
  </div>
);

/* ─── Table view ─── */
const TasksTable = ({ columns, rows }) => (
  <div style={{ padding: '16px', overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
          <th style={{ width: '40px', padding: '10px 12px', textAlign: 'left' }}>
            <input type="checkbox" style={{ accentColor: '#6d28d9' }} />
          </th>
          {columns.map((col) => (
            <th key={col.key} style={{
              padding: '10px 14px', textAlign: 'left',
              fontSize: '12px', fontWeight: '600', color: '#6b7280',
              borderLeft: '1px solid #f0f0f5', background: '#fafafa',
            }}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length + 1} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
              No tasks added yet.
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f0f0f5' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '10px 12px' }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: '1.5px solid #d1d5db', cursor: 'pointer',
                }} />
              </td>
              {columns.map((col) => (
                <td key={col.key} style={{
                  padding: '10px 14px', fontSize: '13px', color: '#374151',
                  borderLeft: '1px solid #f0f0f5',
                }}>
                  {col.key === 'project' && row[col.key] ? (
                    <span style={{
                      background: '#3b82f6', color: '#fff',
                      borderRadius: '4px', padding: '2px 8px',
                      fontSize: '11px', fontWeight: '500',
                    }}>
                      {row[col.key]}
                    </span>
                  ) : (
                    row[col.key] || ''
                  )}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

/* ─── Main Tasks component ─── */
const Tasks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, members, setMembers } = usePlutioCopyAuth();

  // State for dynamic items
  const [projects, setProjects] = useState([]);
  const [taskSets, setTaskSets] = useState([{ id: 't2', name: 't2', color: '#6d28d9' }]);
  const [tasks, setTasks] = useState([]);
  
  // State for modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskSetModal, setShowTaskSetModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  
  const [newProjectName, setNewProjectName] = useState('');
  const [projectMembersInput, setProjectMembersInput] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [projectClient, setProjectClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');

  const [newTaskSetName, setNewTaskSetName] = useState('');
  const [newTaskSetColor, setNewTaskSetColor] = useState(TASK_SET_COLORS[0]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');

  // Profile Modal State
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [inviteToWorkspace, setInviteToWorkspace] = useState(false);

  const filteredMembers = projectMembersInput.trim() 
    ? members.filter(m => m.name.toLowerCase().includes(projectMembersInput.toLowerCase()))
    : [];

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newProj = { 
      id: Date.now().toString(), 
      name: newProjectName.trim(),
      members: selectedMembers,
      client: projectClient,
      startDate,
      deadline
    };
    setProjects([...projects, newProj]);
    // Reset state
    setNewProjectName('');
    setProjectMembersInput('');
    setSelectedMembers([]);
    setProjectClient('');
    setStartDate('');
    setDeadline('');
    setShowProjectModal(false);
  };

  const openProfileModal = (nameFromInput) => {
    setProfileFirstName(nameFromInput);
    setShowProfileModal(true);
    // We don't close showProjectModal, just show Profile on top
  };

  const handleCreateProfile = (e) => {
    e.preventDefault();
    if (!profileFirstName.trim()) return;
    // Logic to save profile globally
    const newMember = {
      id: Date.now().toString(),
      name: `${profileFirstName} ${profileLastName}`.trim(),
      email: profileEmail,
      phone: profilePhone,
      company: profileCompany,
      role: profileRole || 'Client', // Default from image
      status: 'Inactive' // Default from image
    };
    setMembers([...members, newMember]);
    // Optionally add this new member to the current project modal selected members
    setSelectedMembers([...selectedMembers, newMember]);
    
    // Clear profile state
    setProfileFirstName('');
    setProfileLastName('');
    setProfileEmail('');
    setProfilePhone('');
    setProfileCompany('');
    setProfileRole('');
    setShowRoleDropdown(false);
    
    // Close profile modal and return to project modal
    setShowProfileModal(false);
  };

  // Determine active view
  const getView = () => {
    const p = location.pathname;
    if (p.includes('/board/'))    return 'board';
    if (p.endsWith('/my'))        return 'my';
    if (p.endsWith('/delegated')) return 'delegated';
    if (p.endsWith('/following')) return 'following';
    if (p.endsWith('/today'))     return 'today';
    return 'all';
  };
  const view = getView();
  
  const currentBoardId = view === 'board' ? location.pathname.split('/board/')[1] : null;
  const currentBoard = taskSets.find(s => s.id === currentBoardId);

  const handleCreateTaskSet = (e) => {
    e.preventDefault();
    if (!newTaskSetName.trim()) return;
    const newSet = { id: Date.now().toString(), name: newTaskSetName.trim(), color: newTaskSetColor };
    setTaskSets([...taskSets, newSet]);
    setNewTaskSetName('');
    setNewTaskSetColor(TASK_SET_COLORS[0]);
    setShowTaskSetModal(false);
    navigate(`/plutiocopy/tasks/board/${newSet.id}`);
  };

  const handleDeleteBoard = () => {
    setTaskSets(taskSets.filter(s => s.id !== currentBoardId));
    setShowDeleteModal(false);
    navigate('/plutiocopy/tasks');
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const newTask = { 
      id: Date.now().toString(), 
      title: newTaskName.trim(), 
      project: newTaskProject || (currentBoard ? currentBoard.name : 'General'),
      assignee: '',
      startDate: '',
      dueDate: ''
    };
    setTasks([...tasks, newTask]);
    setNewTaskName('');
    setNewTaskProject('');
    setShowTaskModal(false);
  };

  const viewMeta = {
    all:       { label: 'All tasks',  breadcrumb: 'Tasks / All tasks' },
    my:        { label: 'My tasks',   breadcrumb: 'Tasks / My tasks' },
    delegated: { label: 'Delegated',  breadcrumb: 'Tasks / Delegated' },
    following: { label: 'Following',  breadcrumb: 'Tasks / Following' },
    today:     { label: 'Today',      breadcrumb: 'Tasks / Today' },
    board:     { label: currentBoard?.name || 'Task set', breadcrumb: `Tasks / Task sets / ${currentBoard?.name || ''}` }
  };

  const allTasksCols = [
    { key: 'title',     label: 'Task name' },
    { key: 'project',   label: 'Project' },
    { key: 'assignee',  label: 'Assignee' },
    { key: 'startDate', label: 'Start date' },
    { key: 'dueDate',   label: 'Due date' },
  ];

  const renderContent = () => {
    if (view === 'board' && !currentBoard) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Page Not Found</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/plutiocopy/home')} style={{ padding: '10px 24px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Go back</button>
            <button onClick={logout} style={{ padding: '10px 24px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'board':
        return (
          <>
            <Toolbar onCreateTask={() => setShowTaskModal(true)} hideCreate={true} />
            <div style={{ padding: '24px', flex: 1, background: '#f5f5f8' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* 
                  If we want it to look exactly like the second image when empty, 
                  we can conditionally show columns or just the "Create task group" bar.
                */}
                <div style={{
                  background: '#fff', borderRadius: '12px', border: '1.5px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 20px', width: 'fit-content', minWidth: '240px',
                  color: '#9ca3af', cursor: 'pointer',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #d1d5db' }} />
                  <span style={{ fontSize: '14px' }}>Create task group</span>
                </div>
              </div>
            </div>
          </>
        );
      case 'all':
        return (
          <>
            <Toolbar onCreateTask={() => setShowTaskModal(true)} hideCreate={true} />
            <TasksTable columns={allTasksCols} rows={tasks} />
          </>
        );
      case 'my':
      case 'delegated':
      case 'today':
        return (
          <EmptyState
            message="No tasks yet"
            sub="All tasks will appear here once added."
          />
        );
      case 'following':
        return (
          <>
            <Toolbar onCreateTask={() => setShowTaskModal(true)} hideCreate={true} />
            <TasksTable columns={allTasksCols} rows={tasks} />
          </>
        );
      default:
        return null;
    }
  };

  const middlePanel = (
    <TasksMiddlePanel
      activeView={view}
      projects={projects}
      taskSets={taskSets}
      currentBoardId={currentBoardId}
      onNavigate={(path) => navigate(path)}
      onCreateProject={() => setShowProjectModal(true)}
      onCreateTaskSet={() => setShowTaskSetModal(true)}
    />
  );

  return (
    <PlutioCopyLayout middlePanel={middlePanel}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Breadcrumb + Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px', background: '#fff',
          borderBottom: '1px solid #e0e0ec',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {viewMeta[view].breadcrumb.split(' / ').map((part, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '15px',
                  fontWeight: i === arr.length - 1 ? '700' : '400',
                  color: i === arr.length - 1 ? '#1f2937' : '#6b7280',
                }}>
                  {part}
                </span>
                {i < arr.length - 1 && (
                  <span style={{ color: '#d1d5db', fontSize: '15px' }}>/</span>
                )}
              </span>
            ))}
            <Icon d={ICONS.info} size={15} color="#c4b5fd" />
          </div>

          {view === 'board' && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px',
                  background: '#fff', fontSize: '13px', color: '#374151', cursor: 'pointer',
                }}
              >
                Actions
                <Icon d={ICONS.chevDown} size={14} color="#6b7280" />
              </button>

              {showActionsDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '1px solid #f0f0f7', width: '220px', zIndex: 1000, padding: '8px',
                }}>
                  <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', marginBottom: '4px' }}>
                    {TASK_SET_COLORS.slice(0, 6).map(c => (
                      <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  {[
                    { label: 'Rename', icon: 'rename' },
                    { label: 'Default settings', icon: 'settings' },
                    { label: 'Duplicate', icon: 'duplicate' },
                    { label: 'Copy', icon: 'copy' },
                    { label: 'Move', icon: 'move' },
                    { label: 'Save to templates', icon: 'template' },
                    { label: 'Apply template', icon: 'template' },
                    { label: 'Export task board', icon: 'export' },
                    { label: 'Archive task board', icon: 'archive' },
                    { label: 'Delete task board', icon: 'delete', color: '#ef4444' },
                  ].map((act) => (
                    <button
                      key={act.label}
                      onClick={() => {
                        setShowActionsDropdown(false);
                        if (act.label === 'Delete task board') setShowDeleteModal(true);
                      }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: '8px', border: 'none',
                        background: 'none', cursor: 'pointer', fontSize: '13px',
                        color: act.color || '#374151', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Icon d={ICONS[act.icon]} size={14} color={act.color || "#6b7280"} />
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f8' }}>
          {renderContent()}
        </div>

        {/* Create Project Modal */}
        {showProjectModal && (
          <Modal 
            title="Create project" 
            onClose={() => setShowProjectModal(false)}
            footer={
              <>
                <button onClick={() => setShowProjectModal(false)} style={{ background: '#f3f4f6', border: 'none', padding: '10px 24px', borderRadius: '8px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateProject} style={{ background: '#22c55e', border: 'none', padding: '10px 24px', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Create project <Icon d={ICONS.arrowRight} size={16} color="#fff" />
                </button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Project name */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Project name</label>
                <input 
                  autoFocus 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)} 
                  placeholder="New project" 
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', fontWeight: '500', color: '#1f2937' }} 
                />
              </div>

              {/* Project members */}
              <div style={{ position: 'relative' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Project members</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedMembers.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', padding: '2px 8px', borderRadius: '16px', fontSize: '13px' }}>
                          {m.name}
                          <button onClick={() => setSelectedMembers(selectedMembers.filter(sm => sm.id !== m.id))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af' }}><Icon d={ICONS.close} size={14} /></button>
                        </div>
                      ))}
                      <input 
                        value={projectMembersInput}
                        onChange={(e) => setProjectMembersInput(e.target.value)}
                        placeholder={selectedMembers.length === 0 ? "Select members" : ""}
                        style={{ border: 'none', outline: 'none', fontSize: '15px', color: '#1f2937', minWidth: '100px', background: 'transparent' }} 
                      />
                    </div>
                  </div>
                  <Icon d={ICONS.info} size={16} color="#3b82f6" />
                </div>

                {/* Suggestions dropdown */}
                {projectMembersInput.trim() && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                    background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden'
                  }}>
                    {filteredMembers.map(m => (
                      <div 
                        key={m.id}
                        onClick={() => {
                          if (!selectedMembers.find(sm => sm.id === m.id)) {
                            setSelectedMembers([...selectedMembers, m]);
                          }
                          setProjectMembersInput('');
                        }}
                        style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f3f4f6' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{m.name[0]}</div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{m.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>({m.email})</div>
                        </div>
                        <Icon d={ICONS.enter} size={14} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                      </div>
                    ))}
                    {/* Create new suggestion */}
                    <div 
                      onClick={() => openProfileModal(projectMembersInput)}
                      style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#1f2937' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={ICONS.plus} size={14} color="#1f2937" />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Create {projectMembersInput}</span>
                      <Icon d={ICONS.enter} size={14} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Project client */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Project client</label>
                  <input 
                    value={projectClient} 
                    onChange={(e) => setProjectClient(e.target.value)} 
                    placeholder="Select client" 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#1f2937' }} 
                  />
                </div>
                <Icon d={ICONS.info} size={16} color="#3b82f6" />
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Start date</label>
                  <input 
                    type="date"
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#1f2937' }} 
                  />
                </div>
                <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Deadline</label>
                  <input 
                    type="date"
                    value={deadline} 
                    onChange={(e) => setDeadline(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#1f2937' }} 
                  />
                </div>
              </div>

              {/* More options */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '16px' }}>More options</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px' }}>
                    <input disabled placeholder="Select template" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} />
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
                      <Icon d={ICONS.plus} size={14} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Add custom field</span>
                    </div>
                    <Icon d={ICONS.info} size={16} color="#3b82f6" />
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Profile Modal */}
        {showProfileModal && (
          <Modal 
            title="Create profile" 
            onClose={() => setShowProfileModal(false)}
            footer={
              <>
                <button onClick={() => setShowProfileModal(false)} style={{ 
                  background: 'none', border: 'none', padding: '10px 24px', 
                  borderRadius: '8px', color: '#6b7280', fontWeight: '600', 
                  cursor: 'pointer', fontSize: '15px' 
                }}>Cancel</button>
                <button 
                  onClick={handleCreateProfile} 
                  style={{ 
                    background: profileFirstName.trim() ? '#22c55e' : '#f3f4f6', 
                    border: 'none', padding: '12px 32px', borderRadius: '8px', 
                    color: profileFirstName.trim() ? '#fff' : '#9ca3af', 
                    fontWeight: '600', cursor: profileFirstName.trim() ? 'pointer' : 'not-allowed', 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s', fontSize: '15px', minWidth: '240px',
                    justifyContent: 'center'
                  }}
                  disabled={!profileFirstName.trim()}
                >
                  {profileFirstName.trim() ? 'Create profile' : 'Enter first name to continue'} <Icon d={ICONS.arrowRight} size={16} color="currentColor" />
                </button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>First name*</label>
                  <input 
                    autoFocus
                    value={profileFirstName} 
                    onChange={(e) => setProfileFirstName(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                  />
                </div>
                <div style={{ flex: 1, padding: '12px 16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Last name</label>
                  <input 
                    value={profileLastName} 
                    onChange={(e) => setProfileLastName(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                  />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>User role</label>
                    <div style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>{profileRole || 'Client'}</div>
                  </div>
                  <Icon d={ICONS.help} size={16} color="#3b82f6" />
                </div>

                {showRoleDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                    background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden'
                  }}>
                    {ROLES.map(role => (
                      <div 
                        key={role}
                        onClick={() => {
                          setProfileRole(role);
                          setShowRoleDropdown(false);
                        }}
                        style={{ 
                          padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          fontSize: '14px', color: (profileRole || 'Client') === role ? '#111827' : '#6b7280',
                          background: '#fff', borderBottom: '1px solid #f3f4f6'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                      >
                        <span>{role}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {role === 'Client' && <Icon d={ICONS.enter} size={14} color="#d1d5db" />}
                          {(profileRole || 'Client') === role && <Icon d={ICONS.check} size={14} color="#6d28d9" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Email address</label>
                <input 
                  value={profileEmail} 
                  onChange={(e) => setProfileEmail(e.target.value)} 
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                />
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Phone number</label>
                <input 
                  value={profilePhone} 
                  onChange={(e) => setProfilePhone(e.target.value)} 
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                />
              </div>

              <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ flex: 2, padding: '12px 16px', borderRight: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Company name</label>
                  <input 
                    value={profileCompany} 
                    onChange={(e) => setProfileCompany(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                  />
                </div>
                <div style={{ flex: 1, padding: '12px 16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Role</label>
                  <input 
                    value={profileRole} 
                    onChange={(e) => setProfileRole(e.target.value)} 
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#111827' }} 
                  />
                </div>
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
                  <Icon d={ICONS.plus} size={14} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Add custom field</span>
                </div>
                <Icon d={ICONS.help} size={16} color="#3b82f6" />
              </div>

              <div style={{ marginTop: '12px', borderTop: '1px dashed #e5e7eb', paddingTop: '24px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#9ca3af', display: 'block', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>More options</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button 
                        onClick={() => setIsManager(!isManager)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <Icon d={isManager ? ICONS.toggleOn : ICONS.toggleOff} size={32} color={isManager ? '#22c55e' : '#d1d5db'} />
                      </button>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Manager</span>
                      <Icon d={ICONS.help} size={16} color="#3b82f6" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button 
                        onClick={() => setInviteToWorkspace(!inviteToWorkspace)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <Icon d={inviteToWorkspace ? ICONS.toggleOn : ICONS.toggleOff} size={32} color={inviteToWorkspace ? '#22c55e' : '#d1d5db'} />
                      </button>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Invite to workspace</span>
                      <Icon d={ICONS.help} size={16} color="#3b82f6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Task Set Modal */}
        {showTaskSetModal && (
          <Modal 
            title="Create task set" 
            onClose={() => setShowTaskSetModal(false)}
            footer={
              <>
                <button onClick={() => setShowTaskSetModal(false)} style={{ background: '#f3f4f6', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#4b5563', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateTaskSet} style={{ background: '#22c55e', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Create <Icon d={ICONS.arrowRight} size={16} color="#fff" />
                </button>
              </>
            }
          >
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Tasks set name</label>
              <input autoFocus value={newTaskSetName} onChange={(e) => setNewTaskSetName(e.target.value)} placeholder="New task set" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontSize: '15px' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {TASK_SET_COLORS.map(color => (
                  <button key={color} onClick={() => setNewTaskSetColor(color)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, border: newTaskSetColor === color ? '2px solid #000' : 'none', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '12px' }}>More options</span>
              <div style={{ position: 'relative' }}>
                <input disabled placeholder="Select template" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', cursor: 'not-allowed', boxSizing: 'border-box' }} />
              </div>
            </div>
          </Modal>
        )}

        {/* Warning Delete Modal */}
        {showDeleteModal && (
          <Modal 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                <Icon d={ICONS.warning} size={24} color="#ef4444" />
                <span>Warning</span>
              </div>
            } 
            onClose={() => setShowDeleteModal(false)}
            width="440px"
          >
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', margin: '0 0 16px' }}>
                This task board and everything included within, unless un-checked from the list below will be permanently deleted.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#1f2937', fontWeight: '600', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#1f2937' }} />
                Time entries
              </label>
            </div>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>
              Are you sure you want to delete {currentBoard?.name}?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, padding: '12px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>No</button>
              <button onClick={handleDeleteBoard} style={{ flex: 1, padding: '12px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Yes</button>
            </div>
          </Modal>
        )}

        {/* Create Task Modal */}
        {showTaskModal && (
          <Modal title="Create New Task" onClose={() => setShowTaskModal(false)}>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Task Name</label>
                <input autoFocus value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} placeholder="What needs to be done?" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Select Project</label>
                <select value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}>
                  <option value="">None (General)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Create Task</button>
            </form>
          </Modal>
        )}
      </div>
    </PlutioCopyLayout>
  );
};

export default Tasks;
