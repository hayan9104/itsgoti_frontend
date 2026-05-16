import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Shield, Copy, Check, KeyRound, Trash2, History as HistoryIcon, Settings2, ChevronDown, X as XIcon } from 'lucide-react';
import { teamEmployeesAPI, teamSessionsAPI } from '../teamAPI';
import { getCached, setCached, invalidate } from '../teamCache';
import { baseFont, serifFont, monoFont } from '../theme';
import { Avatar, StatusPill, PageHeader, Card, SolidButton, GhostButton, Modal, FieldLabel, TextInput, Select } from '../components/Primitives';

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'admin', label: 'Admin' },
];

export default function TeamView({ palette, isDark, currentUserId, setView, goToDrilldown }) {
  const cachedEmployees = getCached('employees:list');
  const cachedSnap = getCached('sessions:today:all');
  const snapMap = (() => {
    if (!cachedSnap?.snapshot) return {};
    const m = {};
    for (const s of cachedSnap.snapshot) m[s.employee.id] = s;
    return m;
  })();
  const [employees, setEmployees] = useState(cachedEmployees?.employees || []);
  const [snapshot, setSnapshot] = useState(snapMap);
  const [loading, setLoading] = useState(!cachedEmployees || !cachedSnap);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', jobTitle: 'Designer', role: 'employee' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [generatedFor, setGeneratedFor] = useState('');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(null); // employee being edited
  const [editForm, setEditForm] = useState({ name: '', jobTitle: '', role: 'employee' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Reset-password modal state
  const [resetting, setResetting] = useState(null); // employee being reset
  const [resetPwd, setResetPwd] = useState('');
  const [resetPwdConfirm, setResetPwdConfirm] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  // Search + role filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState([]); // selected jobTitles; empty = all
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef(null);
  useEffect(() => {
    if (!roleMenuOpen) return;
    const onClick = (e) => { if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) setRoleMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setRoleMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [roleMenuOpen]);

  const uniqueRoles = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => { if (e.jobTitle) set.add(e.jobTitle); });
    return Array.from(set).sort();
  }, [employees]);
  const roleCounts = useMemo(() => employees.reduce((a, e) => {
    if (e.jobTitle) a[e.jobTitle] = (a[e.jobTitle] || 0) + 1;
    return a;
  }, {}), [employees]);

  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q)
      );
    }
    if (roleFilter.length > 0) {
      const allow = new Set(roleFilter);
      list = list.filter((e) => allow.has(e.jobTitle));
    }
    return list;
  }, [employees, search, roleFilter]);
  const toggleRole = (r) => setRoleFilter((cur) => cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]);

  const refresh = async () => {
    const [eRes, sRes] = await Promise.all([teamEmployeesAPI.list(), teamSessionsAPI.todayAll()]);
    if (eRes.data?.success) {
      setEmployees(eRes.data.employees || []);
      setCached('employees:list', eRes.data);
    }
    if (sRes.data?.success) {
      const map = {};
      for (const s of sRes.data.snapshot || []) map[s.employee.id] = s;
      setSnapshot(map);
      setCached('sessions:today:all', sRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) return setError('Name and email required');
    setSubmitting(true);
    const { data } = await teamEmployeesAPI.create(form).catch((err) => ({ data: err.response?.data }));
    setSubmitting(false);
    if (data?.success) {
      setEmployees((prev) => [...prev, data.employee]);
      invalidate('employees:list');
      setGeneratedPassword(data.generatedPassword);
      setGeneratedFor(data.employee.email);
      setForm({ name: '', email: '', jobTitle: 'Designer', role: 'employee' });
    } else {
      setError(data?.message || 'Could not create employee');
    }
  };

  // Open the reset modal — admin chooses to set manually or auto-generate.
  const openResetModal = (emp) => {
    setResetting(emp);
    setResetPwd('');
    setResetPwdConfirm('');
    setResetError('');
  };

  const closeResetModal = () => {
    setResetting(null);
    setResetPwd('');
    setResetPwdConfirm('');
    setResetError('');
    setResetSubmitting(false);
  };

  const onSubmitManualReset = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetPwd || resetPwd.length < 8) return setResetError('Password must be at least 8 characters');
    if (resetPwd !== resetPwdConfirm) return setResetError('Passwords do not match');
    setResetSubmitting(true);
    const { data } = await teamEmployeesAPI.setPassword(resetting._id, resetPwd).catch((err) => ({ data: err.response?.data }));
    setResetSubmitting(false);
    if (data?.success) {
      closeResetModal();
      window.alert(`Password updated for ${resetting.name}.`);
    } else {
      setResetError(data?.message || 'Could not update password');
    }
  };

  // "Forgot password" path — auto-generate and show once.
  const onForgotGenerate = async () => {
    if (!resetting) return;
    setResetSubmitting(true);
    const { data } = await teamEmployeesAPI.resetPassword(resetting._id).catch((err) => ({ data: err.response?.data }));
    setResetSubmitting(false);
    if (data?.success) {
      const targetEmail = resetting.email;
      closeResetModal();
      setGeneratedPassword(data.generatedPassword);
      setGeneratedFor(targetEmail);
    } else {
      setResetError(data?.message || 'Could not generate password');
    }
  };

  const onDelete = async (emp) => {
    if (emp._id === currentUserId) return;
    if (!window.confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    const { data } = await teamEmployeesAPI.remove(emp._id);
    if (data?.success) {
      setEmployees((prev) => prev.filter((e) => e._id !== emp._id));
      invalidate('employees:list');
    }
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setEditForm({
      name: emp.name || '',
      jobTitle: emp.jobTitle || '',
      role: emp.role || 'employee',
    });
    setEditError('');
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    setEditSubmitting(true);
    const { data } = await teamEmployeesAPI
      .update(editing._id, {
        name: editForm.name,
        jobTitle: editForm.jobTitle,
        role: editForm.role,
      })
      .catch((err) => ({ data: err.response?.data }));
    setEditSubmitting(false);
    if (data?.success) {
      setEmployees((prev) => prev.map((p) => (p._id === editing._id ? { ...p, ...data.employee } : p)));
      setEditing(null);
    } else {
      setEditError(data?.message || 'Could not save changes');
    }
  };

  const copyPassword = () => {
    if (generatedPassword && navigator.clipboard) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closePasswordModal = () => {
    setGeneratedPassword(null);
    setGeneratedFor('');
    setCopied(false);
    setShowNew(false);
  };

  return (
    <div>
      <PageHeader
        title="Team"
        kicker={`${employees.length} ${employees.length === 1 ? 'EMPLOYEE' : 'EMPLOYEES'}`}
        palette={palette}
        right={
          <SolidButton onClick={() => setShowNew(true)} icon={Plus} palette={palette}>
            Add employee
          </SolidButton>
        }
      />

      {/* Filter bar — role multi-select + name/email search */}
      <div className="team-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div ref={roleMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setRoleMenuOpen((o) => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
              color: palette.text, fontFamily: baseFont, fontSize: 12.5,
            }}
          >
            <Shield size={13} strokeWidth={1.75} color={palette.textDim} />
            {roleFilter.length === 0
              ? 'All roles'
              : roleFilter.length === 1
                ? roleFilter[0]
                : `${roleFilter.length} roles`}
            <ChevronDown size={12} color={palette.textMute} />
          </button>
          {roleMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6, minWidth: 220, zIndex: 30,
              backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
              borderRadius: 10, padding: '6px 0', boxShadow: '0 8px 26px rgba(0,0,0,0.16)',
            }}>
              {uniqueRoles.length === 0 && (
                <div style={{ padding: '10px 14px', fontFamily: baseFont, fontSize: 12, color: palette.textMute }}>No roles yet</div>
              )}
              {uniqueRoles.map((r) => {
                const on = roleFilter.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px', border: 'none', cursor: 'pointer',
                      backgroundColor: 'transparent', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{
                      width: 14, height: 14, borderRadius: 3,
                      border: `1.5px solid ${on ? palette.accent : palette.border}`,
                      backgroundColor: on ? palette.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {on && <Check size={10} color={palette.accentText} />}
                    </span>
                    <span style={{ flex: 1, fontFamily: baseFont, fontSize: 13, color: palette.text }}>{r}</span>
                    <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute }}>{roleCounts[r] || 0}</span>
                  </button>
                );
              })}
              {roleFilter.length > 0 && (
                <>
                  <div style={{ height: 1, backgroundColor: palette.border, margin: '4px 0' }} />
                  <button
                    type="button"
                    onClick={() => setRoleFilter([])}
                    style={{
                      width: '100%', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer',
                      textAlign: 'left', fontFamily: baseFont, fontSize: 12, color: palette.textDim,
                    }}
                  >Clear all</button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="team-filter-search" style={{ position: 'relative', marginLeft: 'auto' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              padding: '7px 32px 7px 12px', borderRadius: 8, outline: 'none',
              backgroundColor: palette.surfaceAlt, color: palette.text,
              fontFamily: baseFont, fontSize: 12.5, border: `1px solid ${palette.border}`,
              width: 260,
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: 2,
              }}
              title="Clear"
            ><XIcon size={12} /></button>
          )}
        </div>
      </div>

      <Card palette={palette} padding={0}>
        <div
          className="team-employee-header"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1.8fr) minmax(0, 2.6fr) 110px 150px',
            gap: 16,
            padding: '12px 20px',
            borderBottom: `1px solid ${palette.border}`,
            backgroundColor: palette.surfaceAlt,
          }}
        >
          {['NAME', 'ROLE', 'EMAIL', 'JOINED', 'ACTIONS'].map((h, i) => (
            <div
              key={h}
              style={{
                fontFamily: monoFont,
                fontSize: 10.5,
                color: palette.textMute,
                letterSpacing: '0.08em',
                fontWeight: 500,
                textAlign: i === 4 ? 'right' : 'left',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>Loading…</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
            No employees yet. Add the first one with the button above.
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
            No employees match your filters.
          </div>
        ) : (
          filteredEmployees.map((emp, i) => (
            <div
              key={emp._id}
              className="team-employee-row"
              onClick={() => goToDrilldown(emp._id)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1.8fr) minmax(0, 2.6fr) 110px 150px',
                gap: 16,
                padding: '14px 20px',
                alignItems: 'center',
                borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                cursor: 'pointer',
                transition: 'background-color 120ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar initials={emp.avatar} size={32} palette={palette} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {emp.name}
                    {emp._id === currentUserId && (
                      <span style={{ marginLeft: 8, fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.06em' }}>YOU</span>
                    )}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <StatusPill status={snapshot[emp._id]?.status || (emp.status === 'inactive' ? 'offline' : 'offline')} palette={palette} isDark={isDark} />
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim }}>
                {emp.jobTitle}
                <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.06em', marginTop: 2 }}>
                  {emp.role === 'admin' ? 'ADMIN' : 'MEMBER'}
                </div>
              </div>
              <div style={{ fontFamily: monoFont, fontSize: 12, color: palette.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {emp.email}
              </div>
              <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textMute }}>
                {new Date(emp.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  title="Edit role & allowances"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(emp);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: palette.textDim }}
                >
                  <Settings2 size={14} />
                </button>
                <button
                  type="button"
                  title="View history"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToDrilldown(emp._id);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: palette.textDim }}
                >
                  <HistoryIcon size={14} />
                </button>
                {emp._id !== currentUserId && (
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(emp);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: palette.textDim }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      <div
        style={{
          marginTop: 22,
          padding: 18,
          borderRadius: 12,
          backgroundColor: palette.surfaceAlt,
          border: `1px solid ${palette.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <Shield size={16} style={{ color: palette.accent, marginTop: 2 }} />
        <div>
          <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>
            Login passwords are auto-generated
          </div>
          <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, marginTop: 4, lineHeight: 1.5 }}>
            When you add an employee, the system creates a temporary password and shows it once. Share it through a secure
            channel. The employee will be prompted to change it on first login.
          </div>
        </div>
      </div>

      {/* New employee modal */}
      <Modal
        open={showNew && !generatedPassword}
        onClose={() => {
          setShowNew(false);
          setError('');
        }}
        title="Add a new employee"
        palette={palette}
        width={520}
      >
        <form onSubmit={onCreate}>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Full name</FieldLabel>
            <TextInput
              palette={palette}
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Priya Mehta"
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Work email</FieldLabel>
            <TextInput
              palette={palette}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="priya@itsgoti.in"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <FieldLabel palette={palette}>Job title</FieldLabel>
              <TextInput
                palette={palette}
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                placeholder="Designer"
              />
            </div>
            <div>
              <FieldLabel palette={palette}>Role</FieldLabel>
              <Select palette={palette} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: palette.dangerBg,
                color: palette.danger,
                fontFamily: baseFont,
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <GhostButton onClick={() => setShowNew(false)} palette={palette}>
              Cancel
            </GhostButton>
            <SolidButton type="submit" palette={palette} disabled={submitting} icon={Plus}>
              {submitting ? 'Creating…' : 'Create employee'}
            </SolidButton>
          </div>
        </form>
      </Modal>

      {/* Reset password modal — manual entry, with Forgot fallback */}
      <Modal
        open={!!resetting && !generatedPassword}
        onClose={closeResetModal}
        title={resetting ? `Reset password · ${resetting.name}` : ''}
        palette={palette}
        width={460}
      >
        {resetting && (
          <form onSubmit={onSubmitManualReset}>
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginBottom: 16, lineHeight: 1.55 }}>
              Choose a new password for <span style={{ color: palette.text, fontWeight: 500 }}>{resetting.email}</span>.
              They'll start using it immediately on their next login.
            </div>
            <div style={{ marginBottom: 12 }}>
              <FieldLabel palette={palette}>New password (8+ characters)</FieldLabel>
              <TextInput
                palette={palette}
                type="password"
                autoFocus
                value={resetPwd}
                onChange={(e) => setResetPwd(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <FieldLabel palette={palette}>Re-enter new password</FieldLabel>
              <TextInput
                palette={palette}
                type="password"
                value={resetPwdConfirm}
                onChange={(e) => setResetPwdConfirm(e.target.value)}
              />
            </div>

            {resetError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: palette.dangerBg,
                  color: palette.danger,
                  fontFamily: baseFont,
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {resetError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
              <GhostButton onClick={closeResetModal} palette={palette}>
                Cancel
              </GhostButton>
              <SolidButton type="submit" palette={palette} disabled={resetSubmitting} icon={Check}>
                {resetSubmitting ? 'Saving…' : 'Update password'}
              </SolidButton>
            </div>

            <div style={{ paddingTop: 14, borderTop: `1px solid ${palette.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}>
                Don't want to pick one yourself?
              </div>
              <button
                type="button"
                onClick={onForgotGenerate}
                disabled={resetSubmitting}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: baseFont,
                  fontSize: 13,
                  color: palette.accent,
                  fontWeight: 500,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Forgot password? Generate one
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit employee modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit · ${editing.name}` : ''} palette={palette} width={520}>
        {editing && (
          <form onSubmit={onSaveEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <FieldLabel palette={palette}>Full name</FieldLabel>
                <TextInput palette={palette} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <FieldLabel palette={palette}>Job title</FieldLabel>
                <TextInput palette={palette} value={editForm.jobTitle} onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <FieldLabel palette={palette}>Role</FieldLabel>
              <Select palette={palette} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
              <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 8 }}>
                Leave allowances are set company-wide on the Leaves page.
              </div>
            </div>

            {editError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: palette.dangerBg,
                  color: palette.danger,
                  fontFamily: baseFont,
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {editError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <GhostButton onClick={() => setEditing(null)} palette={palette}>
                Cancel
              </GhostButton>
              <SolidButton type="submit" palette={palette} disabled={editSubmitting}>
                {editSubmitting ? 'Saving…' : 'Save changes'}
              </SolidButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Generated password modal */}
      <Modal open={!!generatedPassword} onClose={closePasswordModal} title="Password generated" palette={palette} width={460}>
        <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.textDim, marginBottom: 12, lineHeight: 1.55 }}>
          Share this password with <span style={{ color: palette.text, fontWeight: 500 }}>{generatedFor}</span> through a
          secure channel. This is the <strong>only time</strong> you'll see it.
        </div>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            backgroundColor: palette.surfaceAlt,
            border: `1px solid ${palette.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <code
            style={{
              fontFamily: monoFont,
              fontSize: 17,
              color: palette.text,
              letterSpacing: '0.02em',
              userSelect: 'all',
              wordBreak: 'break-all',
            }}
          >
            {generatedPassword}
          </code>
          <button
            type="button"
            onClick={copyPassword}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              backgroundColor: copied ? palette.accentBg : palette.surface,
              color: copied ? palette.accent : palette.text,
              border: `1px solid ${copied ? palette.accent : palette.border}`,
              fontFamily: baseFont,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SolidButton onClick={closePasswordModal} palette={palette}>
            Done
          </SolidButton>
        </div>
      </Modal>
    </div>
  );
}
