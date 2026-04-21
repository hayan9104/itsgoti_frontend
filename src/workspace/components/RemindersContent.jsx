import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <div onClick={onChange} style={{
    width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
    backgroundColor: value ? '#10b981' : '#333436', position: 'relative',
  }}>
    <div style={{
      position: 'absolute', top: 3, left: value ? 19 : 3, width: 14, height: 14,
      borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s',
    }} />
  </div>
);

// ─── Add Modal ────────────────────────────────────────────────────────────────
const AddModal = ({ title, fields, onClose, onSave, saving }) => {
  const [form, setForm] = useState({});
  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #333436',
    backgroundColor: '#1e1f21', color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#1e1f21', border: '1px solid #333436', borderRadius: 16, padding: 24, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#e5e7eb', marginBottom: 20 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</div>
              <input
                placeholder={f.placeholder || ''}
                value={form[f.key] || ''}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #333436', background: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── STATUS helpers ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  sent:      { bg: '#052e16', text: '#4ade80', label: 'Sent' },
  failed:    { bg: '#450a0a', text: '#f87171', label: 'Failed' },
  pending:   { bg: '#451a03', text: '#fb923c', label: 'Pending' },
  scheduled: { bg: '#172554', text: '#60a5fa', label: 'Scheduled' },
};
const getStatus = (r) => {
  if (r.sent) return STATUS_COLORS.sent;
  if (r.status === 'failed') return STATUS_COLORS.failed;
  if (r.status === 'pending_confirmation') return STATUS_COLORS.pending;
  return STATUS_COLORS.scheduled;
};

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CalendarView = ({ reminders }) => {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();

  const byDate = {};
  reminders.forEach(r => {
    const d = new Date(r.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === mon) {
      const k = d.getDate();
      byDate[k] = byDate[k] || [];
      byDate[k].push(r);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isToday = (d) => d && d === today.getDate() && mon === today.getMonth() && year === today.getFullYear();

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setMonth(new Date(year, mon - 1, 1))} style={{ background: 'none', border: '1px solid #333436', color: '#9ca3af', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 14 }}>‹</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#e5e7eb', flex: 1, textAlign: 'center' }}>{MONTH_NAMES[mon]} {year}</span>
        <button onClick={() => setMonth(new Date(year, mon + 1, 1))} style={{ background: 'none', border: '1px solid #333436', color: '#9ca3af', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 14 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6b7280', padding: '6px 0', textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          const items = day ? (byDate[day] || []) : [];
          return (
            <div key={i} style={{
              minHeight: 80, borderRadius: 8, padding: '6px 8px',
              backgroundColor: day ? '#252628' : 'transparent',
              border: isToday(day) ? '1px solid #10b981' : '1px solid transparent',
            }}>
              {day && (
                <>
                  <div style={{ fontSize: 12, fontWeight: isToday(day) ? 700 : 500, color: isToday(day) ? '#10b981' : '#9ca3af', marginBottom: 4 }}>{day}</div>
                  {items.slice(0, 3).map((r, ri) => {
                    const sc = getStatus(r);
                    return (
                      <div key={ri} title={r.message} style={{
                        fontSize: 10, color: sc.text, backgroundColor: sc.bg,
                        borderRadius: 4, padding: '2px 5px', marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {new Date(r.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} {r.message}
                      </div>
                    );
                  })}
                  {items.length > 3 && <div style={{ fontSize: 10, color: '#6b7280' }}>+{items.length - 3} more</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── ADMIN LIST ───────────────────────────────────────────────────────────────
const AdminList = ({ onViewAdmin }) => {
  const [admins, setAdmins] = useState([]);
  const [reminderCounts, setReminderCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/reminders/allowed-numbers`, { headers: authHeaders() }),
        fetch(`${API_BASE}/reminders`, { headers: authHeaders() }),
      ]);
      const aData = await aRes.json();
      const rData = await rRes.json();
      setAdmins(aData.data || []);
      const counts = {};
      (rData.data || []).forEach(r => {
        const k = (r.fromPhone || '').replace(/\D/g, '').slice(-10);
        counts[k] = (counts[k] || 0) + 1;
      });
      setReminderCounts(counts);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (admin) => {
    try {
      await fetch(`${API_BASE}/reminders/allowed-numbers/${admin._id}/toggle`, { method: 'PATCH', headers: authHeaders() });
      setAdmins(p => p.map(a => a._id === admin._id ? { ...a, isActive: !a.isActive } : a));
    } catch (e) { console.error(e); }
  };

  const handleAdd = async (form) => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/reminders/allowed-numbers`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.data) { setAdmins(p => [...p, data.data]); setShowAdd(false); }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admin?')) return;
    try {
      await fetch(`${API_BASE}/reminders/allowed-numbers/${id}`, { method: 'DELETE', headers: authHeaders() });
      setAdmins(p => p.filter(a => a._id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = admins.filter(a =>
    !search || a.name?.toLowerCase().includes(search.toLowerCase()) || (a.phone || '').includes(search)
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb' }}>Admins</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Manage WhatsApp reminder senders</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Admin
        </button>
      </div>

      {/* Search */}
      <input placeholder="Search admins..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #333436', backgroundColor: '#1e1f21', color: '#e5e7eb', fontSize: 13, outline: 'none', marginBottom: 16 }} />

      {/* Table */}
      <div style={{ flex: 1, backgroundColor: '#252628', borderRadius: 12, border: '1px solid #333436', overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>👤</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#4b5563' }}>No admins yet</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Add an admin to get started</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333436' }}>
                {['Admin', 'Phone', 'Email', 'Reminders', 'Active', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', backgroundColor: '#1e1f21' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const count = reminderCounts[(a.phone || '').replace(/\D/g, '').slice(-10)] || 0;
                return (
                  <tr key={a._id} style={{ borderBottom: '1px solid #2a2b2d' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2b2d'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #064e3b, #065f46)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6ee7b7', fontSize: 13, flexShrink: 0 }}>
                          {a.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#d1d5db', whiteSpace: 'nowrap' }}>{a.phone || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#9ca3af', whiteSpace: 'nowrap' }}>{a.email || '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, backgroundColor: '#064e3b', color: '#6ee7b7', padding: '3px 10px', borderRadius: 10 }}>{count}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <Toggle value={!!a.isActive} onChange={() => handleToggle(a)} />
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => onViewAdmin(a)} style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid #333436', background: 'none', color: '#10b981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          View
                        </button>
                        <button onClick={() => handleDelete(a._id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: 16, padding: 2 }}
                          onMouseEnter={e => e.target.style.color = '#ef4444'}
                          onMouseLeave={e => e.target.style.color = '#4b5563'}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddModal
          title="Add Admin"
          fields={[
            { key: 'name', label: 'Name', placeholder: 'Full name' },
            { key: 'phone', label: 'WhatsApp Phone', placeholder: '+91XXXXXXXXXX' },
            { key: 'email', label: 'Email (optional)', placeholder: 'email@example.com' },
          ]}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
          saving={saving}
        />
      )}
    </div>
  );
};

// ─── CLIENT LIST ──────────────────────────────────────────────────────────────
const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reminders/contacts`, { headers: authHeaders() });
      const data = await res.json();
      setClients(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (form) => {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/reminders/contacts`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.data) { setClients(p => [...p, data.data]); setShowAdd(false); }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    try {
      await fetch(`${API_BASE}/reminders/contacts/${id}`, { method: 'DELETE', headers: authHeaders() });
      setClients(p => p.filter(c => c._id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb' }}>Clients</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>People who receive reminders</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Client
        </button>
      </div>

      <input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #333436', backgroundColor: '#1e1f21', color: '#e5e7eb', fontSize: 13, outline: 'none', marginBottom: 16 }} />

      <div style={{ flex: 1, backgroundColor: '#252628', borderRadius: 12, border: '1px solid #333436', overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#4b5563' }}>No clients yet</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Add a client to get started</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333436' }}>
                {['Client', 'Phone', 'Email', 'Note', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', backgroundColor: '#1e1f21' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid #2a2b2d' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2b2d'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#93c5fd', fontSize: 13, flexShrink: 0 }}>
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#d1d5db' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#9ca3af' }}>{c.email || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280', maxWidth: 180 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.note || '—'}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => handleDelete(c._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: 16, padding: 2 }}
                      onMouseEnter={e => e.target.style.color = '#ef4444'}
                      onMouseLeave={e => e.target.style.color = '#4b5563'}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddModal
          title="Add Client"
          fields={[
            { key: 'name', label: 'Name', placeholder: 'Full name' },
            { key: 'phone', label: 'Phone', placeholder: '+91XXXXXXXXXX' },
            { key: 'email', label: 'Email (optional)', placeholder: 'email@example.com' },
            { key: 'note', label: 'Note (optional)', placeholder: 'Any note...' },
          ]}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
          saving={saving}
        />
      )}
    </div>
  );
};

// ─── ADMIN DETAIL (Reminders + Calendar) ─────────────────────────────────────
const AdminDetail = ({ admin, onBack }) => {
  const [reminders, setReminders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarMode, setCalendarMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [rRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/reminders`, { headers: authHeaders() }),
          fetch(`${API_BASE}/reminders/contacts`, { headers: authHeaders() }),
        ]);
        const rData = await rRes.json();
        const cData = await cRes.json();
        const digits = (admin.phone || '').replace(/\D/g, '').slice(-10);
        setReminders((rData.data || []).filter(r => (r.fromPhone || '').replace(/\D/g, '').slice(-10) === digits));
        setContacts(cData.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [admin]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await fetch(`${API_BASE}/reminders/${id}`, { method: 'DELETE', headers: authHeaders() });
      setReminders(p => p.filter(r => r._id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = reminders.filter(r => {
    if (filterStatus === 'sent' && !r.sent) return false;
    if (filterStatus === 'failed' && r.status !== 'failed') return false;
    if (filterStatus === 'scheduled' && (r.sent || r.failed || r.status !== 'confirmed')) return false;
    if (filterStatus === 'pending' && r.status !== 'pending_confirmation') return false;
    if (filterDateFrom && new Date(r.scheduledAt) < new Date(filterDateFrom)) return false;
    if (filterDateTo) { const to = new Date(filterDateTo); to.setHours(23,59,59,999); if (new Date(r.scheduledAt) > to) return false; }
    return true;
  });

  const hasFilters = filterStatus || filterDateFrom || filterDateTo;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid #333436', color: '#9ca3af', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #064e3b, #065f46)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6ee7b7', fontSize: 16, flexShrink: 0 }}>
          {admin.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#e5e7eb' }}>{admin.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{admin.phone}{admin.email ? ` · ${admin.email}` : ''}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setCalendarMode(false)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: !calendarMode ? '#10b981' : '#333436', color: !calendarMode ? '#fff' : '#9ca3af',
          }}>List</button>
          <button onClick={() => setCalendarMode(true)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: calendarMode ? '#10b981' : '#333436', color: calendarMode ? '#fff' : '#9ca3af',
          }}>Calendar</button>
        </div>
      </div>

      {/* Filter bar (list mode only) */}
      {!calendarMode && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16, padding: '10px 14px', backgroundColor: '#252628', borderRadius: 12, border: '1px solid #333436' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['', 'All'], ['scheduled', 'Scheduled'], ['sent', 'Sent'], ['failed', 'Failed'], ['pending', 'Pending']].map(([val, label]) => (
              <button key={val} onClick={() => setFilterStatus(val)} style={{
                padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filterStatus === val ? '#10b981' : '#333436',
                color: filterStatus === val ? '#fff' : '#9ca3af',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #333436', borderRadius: 7, fontSize: 12, color: '#e5e7eb', backgroundColor: '#1e1f21', outline: 'none' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>→</span>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #333436', borderRadius: 7, fontSize: 12, color: '#e5e7eb', backgroundColor: '#1e1f21', outline: 'none' }} />
          </div>
          {hasFilters && (
            <button onClick={() => { setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
              style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: '#450a0a', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>{filtered.length} of {reminders.length}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14 }}>Loading...</div>
      ) : calendarMode ? (
        <CalendarView reminders={reminders} />
      ) : (
        <div style={{ flex: 1, backgroundColor: '#252628', borderRadius: 12, border: '1px solid #333436', overflow: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#4b5563' }}>{hasFilters ? 'No matches' : 'No reminders yet'}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{hasFilters ? 'Try adjusting filters' : `No reminders from ${admin.name}`}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333436' }}>
                  {['#', 'Date', 'Time', 'Message', 'To', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', backgroundColor: '#1e1f21' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const dt = new Date(r.scheduledAt);
                  const sc = getStatus(r);
                  const contact = contacts.find(c => (c.phone || '').replace(/\D/g, '').slice(-10) === (r.toPhone || '').replace(/\D/g, '').slice(-10));
                  return (
                    <tr key={r._id} style={{ borderBottom: '1px solid #2a2b2d' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2b2d'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#4b5563', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#d1d5db', whiteSpace: 'nowrap' }}>
                        {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#d1d5db', whiteSpace: 'nowrap' }}>
                        {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#e5e7eb', maxWidth: 260 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.message}>{r.message}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {r.isSelf ? (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', backgroundColor: '#2a2b2d', padding: '3px 9px', borderRadius: 20 }}>Self</span>
                        ) : (
                          <span style={{ color: '#d1d5db' }}>{contact ? contact.name : r.toPhone || '—'}</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: sc.bg, color: sc.text }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <button onClick={() => handleDelete(r._id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: 16, lineHeight: 1, padding: 2 }}
                          onMouseEnter={e => e.target.style.color = '#ef4444'}
                          onMouseLeave={e => e.target.style.color = '#4b5563'}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
const RemindersContent = ({ view, selectedAdmin, onViewAdmin, onBack }) => {
  if (view === 'admin-detail' && selectedAdmin) {
    return <AdminDetail admin={selectedAdmin} onBack={onBack} />;
  }
  if (view === 'client') return <ClientList />;
  return <AdminList onViewAdmin={onViewAdmin} />;
};

export default RemindersContent;
