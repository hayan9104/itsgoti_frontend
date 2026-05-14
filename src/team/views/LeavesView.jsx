import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check, X as XIcon, Heart, Wallet, Coins, Minus, Pencil, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { teamLeavesAPI, teamSettingsAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont } from '../theme';
import { Avatar, PageHeader, Card, SolidButton, GhostButton, Modal, FieldLabel, TextInput, Textarea } from '../components/Primitives';

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STATUS_STYLES = {
  pending: { bg: '#FFFBEB', color: '#92400E', label: 'Pending' },
  approved: { bg: '#ECFDF5', color: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEF2F2', color: '#991B1B', label: 'Rejected' },
};

const CATEGORY_META = {
  sick: { label: 'Sick', color: '#7C3AED', bg: '#F5F3FF', icon: Heart },
  paid: { label: 'Paid', color: '#0E7490', bg: '#ECFEFF', icon: Wallet },
  unpaid: { label: 'Unpaid', color: '#6B7280', bg: '#F3F4F6', icon: Coins },
};

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.paid;
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        backgroundColor: meta.bg,
        color: meta.color,
        fontFamily: baseFont,
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      <Icon size={11} strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}

/**
 * Stepper used inside the company-wide allowance editor (draft mode only).
 * Does NOT save on its own — the parent collects the value and commits on Apply.
 */
function AllowanceStepper({ palette, value, onChange }) {
  const setVal = (n) => onChange(Math.max(0, Math.min(365, Math.round(Number(n) || 0))));
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <button
        type="button"
        onClick={() => setVal(value - 1)}
        disabled={value <= 0}
        style={{
          width: 26,
          height: 26,
          padding: 0,
          borderRadius: 6,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.surface,
          color: palette.textDim,
          cursor: value <= 0 ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: value <= 0 ? 0.4 : 1,
        }}
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setVal(e.target.value)}
        style={{
          width: 50,
          padding: '4px 0',
          borderRadius: 6,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.surface,
          color: palette.text,
          fontFamily: monoFont,
          fontSize: 13.5,
          textAlign: 'center',
          outline: 'none',
          MozAppearance: 'textfield',
        }}
      />
      <button
        type="button"
        onClick={() => setVal(value + 1)}
        style={{
          width: 26,
          height: 26,
          padding: 0,
          borderRadius: 6,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.surface,
          color: palette.textDim,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

function BalanceTile({ palette, label, used, total, available, accentColor, icon: Icon }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div style={{ padding: 22, backgroundColor: palette.surface }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: accentColor + '22',
            color: accentColor,
          }}
        >
          <Icon size={13} strokeWidth={2} />
        </span>
        <span style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: serifFont, fontSize: 36, fontWeight: 300, color: palette.text, lineHeight: 1 }}>{available}</span>
        <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
          available <span style={{ color: palette.textDim }}>· {used} used / {total} total</span>
        </span>
      </div>
      <div style={{ marginTop: 14, height: 4, borderRadius: 4, backgroundColor: palette.surfaceAlt, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: accentColor, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function LeavesView({ palette, isDark, isAdmin, highlightLeaveId, clearHighlight, openLeave }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({
    startDate: ymd(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    endDate: '',
    type: 'full',
    durationHours: 2,
    category: 'paid',
    reason: '',
  });
  const [applyAttachments, setApplyAttachments] = useState([]);
  const [applyUploading, setApplyUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(startOfMonth(new Date()));

  // Balance state
  const [myBalance, setMyBalance] = useState(null);
  const [allBalances, setAllBalances] = useState([]);
  const [settings, setSettings] = useState(null); // company-wide allowance
  const [editAllowance, setEditAllowance] = useState(false);
  const [draftAllowance, setDraftAllowance] = useState({ sick: 12, paid: 12 });
  const [savingAllowance, setSavingAllowance] = useState(false);

  const refresh = async () => {
    const { data } = await teamLeavesAPI.list();
    if (data?.success) setLeaves(data.leaves || []);

    if (isAdmin) {
      const { data: bData } = await teamLeavesAPI.allBalances();
      if (bData?.success) {
        setAllBalances(bData.balances || []);
        if (bData.settings) setSettings(bData.settings);
      }
    } else {
      const { data: bData } = await teamLeavesAPI.myBalance();
      if (bData?.success) setMyBalance(bData.balance);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [isAdmin]);

  // Flash the matching leave row when arriving from a notification.
  useEffect(() => {
    if (!highlightLeaveId || leaves.length === 0) return;
    const el = document.getElementById(`team-leave-${highlightLeaveId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const original = el.style.transition;
      el.style.transition = 'background-color 800ms ease';
      el.style.backgroundColor = palette.accentBg;
      setTimeout(() => {
        el.style.backgroundColor = 'transparent';
        setTimeout(() => {
          el.style.transition = original;
          clearHighlight && clearHighlight();
        }, 900);
      }, 2200);
    }
  }, [highlightLeaveId, leaves.length, palette.accentBg, clearHighlight]);

  const monthName = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const totalDays = daysInMonth(cursor);
  const firstDow = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7; // Mon=0
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === cursor.getFullYear() && today.getMonth() === cursor.getMonth();

  const leavesByDay = useMemo(() => {
    const map = new Map();
    for (const l of leaves) {
      if (l.status !== 'approved') continue;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()) {
          const key = d.getDate();
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(l);
        }
      }
    }
    return map;
  }, [leaves, cursor]);

  const onApply = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.startDate) return setError('Pick a start date');
    setSubmitting(true);
    const payload = {
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      type: form.type,
      category: form.category,
      reason: form.reason.trim(),
      attachments: applyAttachments,
    };
    if (form.type === 'hours') payload.durationHours = form.durationHours;
    const { data } = await teamLeavesAPI.apply(payload).catch((err) => ({ data: err.response?.data }));
    setSubmitting(false);
    if (data?.success) {
      setLeaves((prev) => [data.leave, ...prev]);
      teamLeavesAPI.myBalance().then(({ data }) => {
        if (data?.success) setMyBalance(data.balance);
      });
      setShowApply(false);
      setForm({ startDate: ymd(new Date(Date.now() + 24 * 60 * 60 * 1000)), endDate: '', type: 'full', durationHours: 2, category: 'paid', reason: '' });
      setApplyAttachments([]);
    } else {
      setError(data?.message || 'Could not apply');
    }
  };

  const onPickPrescription = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setApplyUploading(true);
    setError('');
    try {
      const { data } = await teamLeavesAPI.uploadFiles(Array.from(fileList));
      if (data?.success) setApplyAttachments((prev) => [...prev, ...(data.files || [])]);
      else setError(data?.message || 'Upload failed');
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setApplyUploading(false);
    }
  };
  const removeAttachment = (idx) => setApplyAttachments((prev) => prev.filter((_, i) => i !== idx));

  const onDecide = async (leave, decision) => {
    const { data } = await teamLeavesAPI.decide(leave._id, decision);
    if (data?.success) {
      setLeaves((prev) => prev.map((l) => (l._id === leave._id ? data.leave : l)));
      // Approving consumes a quota — refresh admin balances panel
      if (isAdmin) {
        const { data: bData } = await teamLeavesAPI.allBalances();
        if (bData?.success) setAllBalances(bData.balances || []);
      }
    }
  };

  const onCancel = async (leave) => {
    if (!window.confirm('Cancel this leave request?')) return;
    const { data } = await teamLeavesAPI.cancel(leave._id);
    if (data?.success) setLeaves((prev) => prev.filter((l) => l._id !== leave._id));
  };

  // Open the editor: snapshot current values into the draft.
  const startEditAllowance = () => {
    if (!settings) return;
    setDraftAllowance({
      sick: settings.sickLeaveAllowance,
      paid: settings.paidLeaveAllowance,
    });
    setEditAllowance(true);
  };

  const cancelEditAllowance = () => {
    setEditAllowance(false);
  };

  // Apply the draft allowance — this is the only path that hits the server.
  const applyAllowance = async () => {
    if (!settings) return;
    const payload = {
      sickLeaveAllowance: draftAllowance.sick,
      paidLeaveAllowance: draftAllowance.paid,
    };
    setSavingAllowance(true);
    try {
      const { data } = await teamSettingsAPI.update(payload);
      if (data?.success && data.settings) {
        setSettings(data.settings);
        setAllBalances((prev) =>
          prev.map((row) => ({
            ...row,
            balance: {
              ...row.balance,
              sick: {
                ...row.balance.sick,
                total: data.settings.sickLeaveAllowance,
                available: Math.max(0, data.settings.sickLeaveAllowance - row.balance.sick.used),
              },
              paid: {
                ...row.balance.paid,
                total: data.settings.paidLeaveAllowance,
                available: Math.max(0, data.settings.paidLeaveAllowance - row.balance.paid.used),
              },
            },
          }))
        );
      }
      setEditAllowance(false);
    } finally {
      setSavingAllowance(false);
    }
  };

  const allowanceDirty =
    settings && (draftAllowance.sick !== settings.sickLeaveAllowance || draftAllowance.paid !== settings.paidLeaveAllowance);

  const visibleLeaves = leaves.slice(0, 25);

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Leaves' : 'My leaves'}
        kicker={isAdmin ? `${leaves.length} TOTAL REQUESTS` : 'YOUR REQUESTS'}
        palette={palette}
        right={
          !isAdmin ? (
            <SolidButton onClick={() => setShowApply(true)} icon={Plus} palette={palette}>
              Apply leave
            </SolidButton>
          ) : null
        }
      />

      {/* Employee balance tiles */}
      {!isAdmin && myBalance && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            marginBottom: 28,
            backgroundColor: palette.border,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <BalanceTile
            palette={palette}
            label={`Sick leave · ${myBalance.year}`}
            used={myBalance.sick.used}
            total={myBalance.sick.total}
            available={myBalance.sick.available}
            accentColor={CATEGORY_META.sick.color}
            icon={Heart}
          />
          <BalanceTile
            palette={palette}
            label={`Paid leave · ${myBalance.year}`}
            used={myBalance.paid.used}
            total={myBalance.paid.total}
            available={myBalance.paid.available}
            accentColor={CATEGORY_META.paid.color}
            icon={Wallet}
          />
        </div>
      )}

      {/* Admin: company-wide allowance — read mode + explicit edit/apply */}
      {isAdmin && settings && (
        <Card palette={palette} padding={20} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h3 style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, margin: 0 }}>
                Company-wide leave allowance
              </h3>
              <p style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, margin: 0, marginTop: 4 }}>
                {editAllowance
                  ? 'Changes will apply to every employee. Click Apply to save.'
                  : 'One number for the whole team. Click Edit to change it.'}
              </p>
            </div>

            {!editAllowance ? (
              <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: CATEGORY_META.sick.bg,
                      color: CATEGORY_META.sick.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Heart size={12} strokeWidth={2.25} />
                  </span>
                  <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, fontWeight: 500 }}>Sick / year</span>
                  <span style={{ fontFamily: monoFont, fontSize: 18, color: palette.text, fontWeight: 500 }}>
                    {settings.sickLeaveAllowance}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: CATEGORY_META.paid.bg,
                      color: CATEGORY_META.paid.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Wallet size={12} strokeWidth={2.25} />
                  </span>
                  <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, fontWeight: 500 }}>Paid / year</span>
                  <span style={{ fontFamily: monoFont, fontSize: 18, color: palette.text, fontWeight: 500 }}>
                    {settings.paidLeaveAllowance}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={startEditAllowance}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    backgroundColor: palette.surfaceAlt,
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                    fontFamily: baseFont,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Pencil size={13} /> Edit
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: CATEGORY_META.sick.bg,
                      color: CATEGORY_META.sick.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Heart size={12} strokeWidth={2.25} />
                  </span>
                  <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, fontWeight: 500 }}>Sick / year</span>
                  <AllowanceStepper
                    palette={palette}
                    value={draftAllowance.sick}
                    onChange={(v) => setDraftAllowance((d) => ({ ...d, sick: v }))}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: CATEGORY_META.paid.bg,
                      color: CATEGORY_META.paid.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Wallet size={12} strokeWidth={2.25} />
                  </span>
                  <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, fontWeight: 500 }}>Paid / year</span>
                  <AllowanceStepper
                    palette={palette}
                    value={draftAllowance.paid}
                    onChange={(v) => setDraftAllowance((d) => ({ ...d, paid: v }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={cancelEditAllowance}
                    disabled={savingAllowance}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      backgroundColor: palette.surfaceAlt,
                      color: palette.textDim,
                      border: `1px solid ${palette.border}`,
                      fontFamily: baseFont,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyAllowance}
                    disabled={savingAllowance || !allowanceDirty}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      backgroundColor: allowanceDirty ? palette.accent : palette.surfaceAlt,
                      color: allowanceDirty ? palette.accentText : palette.textMute,
                      border: `1px solid ${allowanceDirty ? palette.accent : palette.border}`,
                      fontFamily: baseFont,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: allowanceDirty && !savingAllowance ? 'pointer' : 'not-allowed',
                      opacity: savingAllowance ? 0.7 : 1,
                    }}
                  >
                    <Check size={13} /> {savingAllowance ? 'Applying…' : 'Apply'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Admin: per-employee usage (admins not listed) */}
      {isAdmin && allBalances.length > 0 && (
        <Card palette={palette} padding={0} style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) 1fr 1fr',
              gap: 16,
              padding: '12px 20px',
              borderBottom: `1px solid ${palette.border}`,
              backgroundColor: palette.surfaceAlt,
            }}
          >
            {['EMPLOYEE', 'SICK USED', 'PAID USED'].map((h, i) => (
              <div
                key={h}
                style={{
                  fontFamily: monoFont,
                  fontSize: 10.5,
                  color: palette.textMute,
                  letterSpacing: '0.08em',
                  fontWeight: 500,
                  textAlign: i === 0 ? 'left' : 'right',
                }}
              >
                {h}
              </div>
            ))}
          </div>
          {allBalances.map((row, i) => (
            <div
              key={row.employee.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) 1fr 1fr',
                gap: 16,
                padding: '12px 20px',
                alignItems: 'center',
                borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar initials={row.employee.avatar} size={28} palette={palette} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.employee.name}
                  </div>
                  <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>{row.employee.jobTitle}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text }}>
                  {row.balance.sick.used} <span style={{ color: palette.textMute }}>/ {row.balance.sick.total}</span>
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 11, color: row.balance.sick.available <= 1 ? palette.danger : palette.textMute, marginTop: 2 }}>
                  {row.balance.sick.available} left
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text }}>
                  {row.balance.paid.used} <span style={{ color: palette.textMute }}>/ {row.balance.paid.total}</span>
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 11, color: row.balance.paid.available <= 1 ? palette.danger : palette.textMute, marginTop: 2 }}>
                  {row.balance.paid.available} left
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {isAdmin && allBalances.length === 0 && !loading && (
        <div
          style={{
            padding: 18,
            borderRadius: 10,
            backgroundColor: palette.surfaceAlt,
            border: `1px solid ${palette.border}`,
            fontFamily: baseFont,
            fontSize: 13,
            color: palette.textDim,
            marginBottom: 28,
          }}
        >
          No employees yet. Add one from the Team tab and they'll show up here.
        </div>
      )}

      {/* Calendar */}
      <Card palette={palette} padding={20} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0 }}>{monthName}</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, padding: 8, borderRadius: 8, cursor: 'pointer', color: palette.textDim }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, padding: 8, borderRadius: 8, cursor: 'pointer', color: palette.textDim }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1,
            backgroundColor: palette.border,
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div
              key={d}
              style={{
                padding: 8,
                textAlign: 'center',
                backgroundColor: palette.surfaceAlt,
                fontFamily: monoFont,
                fontSize: 11,
                color: palette.textMute,
                letterSpacing: '0.06em',
              }}
            >
              {d.toUpperCase()}
            </div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pad-${i}`} style={{ minHeight: 96, backgroundColor: palette.surface }} />
          ))}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const day = idx + 1;
            const isToday = isCurrentMonth && day === today.getDate();
            const onLeave = leavesByDay.get(day) || [];
            const visible = onLeave.slice(0, 3);
            const overflow = onLeave.length - visible.length;
            return (
              <div
                key={day}
                style={{
                  minHeight: 96,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 8,
                  backgroundColor: palette.surface,
                  gap: 6,
                }}
                title={
                  onLeave.length
                    ? onLeave.map((l) => `${l.employee?.name || 'Unknown'} — ${(l.category || 'paid').toUpperCase()}${l.type === 'half' ? ' (½ day)' : ''}`).join('\n')
                    : ''
                }
              >
                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 12,
                    color: isToday ? palette.accent : palette.text,
                    fontWeight: isToday ? 600 : 400,
                    alignSelf: 'flex-start',
                  }}
                >
                  {day}
                </span>
                {visible.map((l, vi) => {
                  const cat = CATEGORY_META[l.category || 'paid'];
                  return (
                    <div
                      key={l._id + vi}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 5px 2px 4px',
                        borderRadius: 4,
                        backgroundColor: cat.bg,
                        color: cat.color,
                        fontFamily: baseFont,
                        fontSize: 10.5,
                        fontWeight: 500,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                      }}
                    >
                      <span style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: cat.color, flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.employee?.name?.split(' ')[0] || '?'}
                        {l.type === 'half' ? ' ½' : ''}
                      </span>
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <div
                    style={{
                      fontFamily: monoFont,
                      fontSize: 10,
                      color: palette.textMute,
                      letterSpacing: '0.05em',
                    }}
                  >
                    +{overflow} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Calendar legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {(['sick', 'paid', 'unpaid']).map((c) => {
            const meta = CATEGORY_META[c];
            return (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: meta.bg, border: `1px solid ${meta.color}40` }} />
                <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>{meta.label} leave</span>
              </div>
            );
          })}
        </div>
      </Card>

      <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>
        {isAdmin ? 'Pending & upcoming' : 'Your requests'}
      </h3>
      <Card palette={palette} padding={0}>
        {loading ? (
          <div style={{ padding: 28, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>Loading…</div>
        ) : visibleLeaves.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
            {isAdmin ? 'No employee leave requests yet.' : 'No leave requests yet.'}
          </div>
        ) : (
          visibleLeaves.map((l, i) => {
            const styles = STATUS_STYLES[l.status];
            const range =
              ymd(new Date(l.startDate)) === ymd(new Date(l.endDate))
                ? new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : `${new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(
                    l.endDate
                  ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            return (
              <div
                key={l._id}
                id={`team-leave-${l._id}`}
                onClick={() => openLeave && openLeave(l._id)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                  transition: 'background-color 200ms ease',
                  cursor: openLeave ? 'pointer' : 'default',
                }}
              >
                <Avatar initials={l.employee?.avatar || '?'} size={32} palette={palette} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>
                      {l.employee?.name || 'Unknown'}
                    </span>
                    <CategoryBadge category={l.category || 'paid'} />
                  </div>
                  <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginTop: 4 }}>
                    {range} · {l.type === 'half' ? 'Half day' : 'Full day'}
                    {l.reason ? ` · ${l.reason}` : ''}
                  </div>
                </div>
                {isAdmin && l.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecide(l, 'approved');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        backgroundColor: palette.accentBg,
                        color: palette.accent,
                        border: `1px solid ${palette.accent}`,
                        fontFamily: baseFont,
                        fontSize: 12.5,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Check size={13} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecide(l, 'rejected');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        backgroundColor: palette.surfaceAlt,
                        color: palette.textDim,
                        border: `1px solid ${palette.border}`,
                        fontFamily: baseFont,
                        fontSize: 12.5,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 999,
                      backgroundColor: styles.bg,
                      color: styles.color,
                      fontFamily: baseFont,
                      fontSize: 11.5,
                      fontWeight: 500,
                    }}
                  >
                    {styles.label}
                  </span>
                )}
                {!isAdmin && l.status === 'pending' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(l);
                    }}
                    title="Cancel"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: palette.textMute }}
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </Card>

      {/* Apply leave (employee only) */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply leave" palette={palette} width={480}>
        <form onSubmit={onApply}>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Category</FieldLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'sick', label: 'Sick', meta: CATEGORY_META.sick },
                { v: 'paid', label: 'Paid', meta: CATEGORY_META.paid },
                { v: 'unpaid', label: 'Unpaid', meta: CATEGORY_META.unpaid },
              ].map((opt) => {
                const active = form.category === opt.v;
                const Icon = opt.meta.icon;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm({ ...form, category: opt.v })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      backgroundColor: active ? opt.meta.bg : palette.surfaceAlt,
                      color: active ? opt.meta.color : palette.text,
                      border: `1px solid ${active ? opt.meta.color : palette.border}`,
                      fontFamily: baseFont,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon size={13} strokeWidth={2.25} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {myBalance && (
              <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 6 }}>
                {form.category === 'sick' && `${myBalance.sick.available} of ${myBalance.sick.total} sick days available`}
                {form.category === 'paid' && `${myBalance.paid.available} of ${myBalance.paid.total} paid days available`}
                {form.category === 'unpaid' && 'Unpaid leave does not count against your quota.'}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <FieldLabel palette={palette}>Start date</FieldLabel>
              <TextInput
                palette={palette}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel palette={palette}>End date (optional)</FieldLabel>
              <TextInput
                palette={palette}
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Duration</FieldLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'full', label: 'Full day' },
                { v: 'half', label: 'Half day' },
                { v: 'hours', label: 'Hours' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setForm({ ...form, type: opt.v })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    backgroundColor: form.type === opt.v ? palette.accentBg : palette.surfaceAlt,
                    color: form.type === opt.v ? palette.accent : palette.text,
                    border: `1px solid ${form.type === opt.v ? palette.accent : palette.border}`,
                    fontFamily: baseFont,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.type === 'hours' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <span style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}>For</span>
                <select
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: palette.surfaceAlt,
                    border: `1px solid ${palette.border}`,
                    color: palette.text,
                    fontFamily: baseFont,
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                    <option key={h} value={h}>
                      {h} hour{h === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
                <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>(counted as {(form.durationHours / 8).toFixed(2)} day)</span>
              </div>
            )}
          </div>

          {form.category === 'sick' && (
            <div style={{ marginBottom: 14 }}>
              <FieldLabel palette={palette}>Prescription (optional, you can add it later)</FieldLabel>
              <label
                htmlFor="sick-prescription-input"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  backgroundColor: palette.surfaceAlt,
                  border: `1px dashed ${palette.border}`,
                  color: palette.textDim,
                  cursor: applyUploading ? 'wait' : 'pointer',
                  fontFamily: baseFont,
                  fontSize: 13,
                }}
              >
                <Paperclip size={13} />
                {applyUploading ? 'Uploading…' : 'Attach prescription'}
              </label>
              <input
                id="sick-prescription-input"
                type="file"
                hidden
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => {
                  onPickPrescription(e.target.files);
                  e.target.value = '';
                }}
              />
              {applyAttachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {applyAttachments.map((a, idx) => {
                    const isImg = (a.mimetype || '').startsWith('image/');
                    return (
                      <span
                        key={a.url + idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 6px 4px 8px',
                          borderRadius: 8,
                          backgroundColor: palette.surfaceAlt,
                          border: `1px solid ${palette.border}`,
                          fontFamily: baseFont,
                          fontSize: 12,
                          color: palette.text,
                          maxWidth: 240,
                        }}
                      >
                        {isImg ? <ImageIcon size={12} style={{ color: palette.textMute }} /> : <FileText size={12} style={{ color: palette.textMute }} />}
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.originalName}>
                          {a.originalName}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: 2, display: 'inline-flex' }}
                          title="Remove"
                        >
                          <XIcon size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Reason</FieldLabel>
            <Textarea
              palette={palette}
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="A quick note for your manager…"
            />
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
            <GhostButton onClick={() => setShowApply(false)} palette={palette}>
              Cancel
            </GhostButton>
            <SolidButton type="submit" palette={palette} disabled={submitting} icon={Plus}>
              {submitting ? 'Submitting…' : 'Submit'}
            </SolidButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
