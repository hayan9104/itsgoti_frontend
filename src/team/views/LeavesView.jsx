import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check, X as XIcon, Heart, Wallet, Coins, Minus, Pencil, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { teamLeavesAPI, teamSettingsAPI, teamSessionsAPI } from '../teamAPI';
import { getCached, setCached, invalidate } from '../teamCache';
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

function BalanceTile({ palette, label, big, bigLabel, subText, accentColor, icon: Icon, progressPct, onClick }) {
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        if (interactive) e.currentTarget.style.backgroundColor = palette.surfaceAlt;
      }}
      onMouseLeave={(e) => {
        if (interactive) e.currentTarget.style.backgroundColor = palette.surface;
      }}
      style={{
        padding: 22,
        backgroundColor: palette.surface,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'background-color 120ms',
      }}
    >
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
        <span style={{ fontFamily: serifFont, fontSize: 36, fontWeight: 300, color: palette.text, lineHeight: 1 }}>{big}</span>
        <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>{bigLabel}</span>
      </div>
      {subText && (
        <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginTop: 6 }}>{subText}</div>
      )}
      {progressPct != null && (
        <div style={{ marginTop: 14, height: 4, borderRadius: 4, backgroundColor: palette.surfaceAlt, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, progressPct)}%`, height: '100%', backgroundColor: accentColor, borderRadius: 4 }} />
        </div>
      )}
    </div>
  );
}

function fmtNum(n) {
  if (n === 0 || n == null) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function LeavesView({ palette, isDark, isAdmin, currentUserId, highlightLeaveId, clearHighlight, openLeave, openLeaveCategory }) {
  // Seed from cache so the list paints instantly on tab switch.
  const cachedLeaves = getCached('leaves:list');
  const cachedAllBalances = getCached('leaves:balances:all');
  const cachedMyBalance = getCached('leaves:balance:me');
  const [leaves, setLeaves] = useState(cachedLeaves?.leaves || []);
  const [loading, setLoading] = useState(!cachedLeaves);
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

  // Balance state — seeded from cache if available.
  const [myBalance, setMyBalance] = useState(cachedMyBalance?.balance || null);
  const [allBalances, setAllBalances] = useState(cachedAllBalances?.balances || []);
  const [settings, setSettings] = useState(cachedAllBalances?.settings || null); // company-wide allowance
  const [editAllowance, setEditAllowance] = useState(false);
  const [draftAllowance, setDraftAllowance] = useState({ sick: 12, paid: 12 });
  const [savingAllowance, setSavingAllowance] = useState(false);

  const refresh = async () => {
    const { data } = await teamLeavesAPI.list();
    if (data?.success) {
      setLeaves(data.leaves || []);
      setCached('leaves:list', data);
    }

    if (isAdmin) {
      const { data: bData } = await teamLeavesAPI.allBalances();
      if (bData?.success) {
        setAllBalances(bData.balances || []);
        if (bData.settings) setSettings(bData.settings);
        setCached('leaves:balances:all', bData);
      }
    } else {
      const { data: bData } = await teamLeavesAPI.myBalance();
      if (bData?.success) {
        setMyBalance(bData.balance);
        setCached('leaves:balance:me', bData);
      }
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

  // Map of day → leaves on that day. Includes pending too; rejected ones are skipped.
  const leavesByDay = useMemo(() => {
    const map = new Map();
    for (const l of leaves) {
      if (l.status === 'rejected') continue;
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

  // Hover state for the quick-apply pill (employee only).
  const [hoverDay, setHoverDay] = useState(null);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const openApplyForDate = (year, month, day) => {
    const ymdStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setForm((f) => ({ ...f, startDate: ymdStr, endDate: '' }));
    setShowApply(true);
  };

  // Past-day session log tooltip (employee only).
  const [mySessions, setMySessions] = useState({}); // { 'YYYY-MM-DD': session }
  const [pastHover, setPastHover] = useState(null); // { session, x, y } | null

  // Pre-load 120 days of own sessions so any month within the last ~4 months has data.
  useEffect(() => {
    if (isAdmin) return;
    teamSessionsAPI
      .historyMe(120)
      .then(({ data }) => {
        if (data?.success && data.sessions) {
          const map = {};
          for (const s of data.sessions) map[s.date] = s;
          setMySessions(map);
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  const showPastHover = (e, dateStr) => {
    if (isAdmin) return;
    const session = mySessions[dateStr];
    if (!session) return;
    setPastHover({ session, x: e.clientX, y: e.clientY });
  };
  const movePastHover = (e) => {
    setPastHover((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
  };
  const hidePastHover = () => setPastHover(null);

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
      const replaced = new Set((data.replacedIds || []).map(String));
      setLeaves((prev) => [data.leave, ...prev.filter((l) => !replaced.has(String(l._id)))]);
      invalidate('leaves:*');
      teamLeavesAPI.myBalance().then(({ data }) => {
        if (data?.success) {
          setMyBalance(data.balance);
          setCached('leaves:balance:me', data);
        }
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
      invalidate('leaves:*');
      // Approving consumes a quota — refresh admin balances panel
      if (isAdmin) {
        const { data: bData } = await teamLeavesAPI.allBalances();
        if (bData?.success) {
          setAllBalances(bData.balances || []);
          setCached('leaves:balances:all', bData);
        }
      }
    }
  };

  const onCancel = async (leave) => {
    if (!window.confirm('Cancel this leave request?')) return;
    const { data } = await teamLeavesAPI.cancel(leave._id);
    if (data?.success) {
      setLeaves((prev) => prev.filter((l) => l._id !== leave._id));
      invalidate('leaves:*');
    }
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
            gridTemplateColumns: 'repeat(3, 1fr)',
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
            big={fmtNum(myBalance.sick.available)}
            bigLabel="this month"
            subText={`${fmtNum(myBalance.sick.used)} used · ${fmtNum(myBalance.sick.expired)} expired`}
            accentColor={CATEGORY_META.sick.color}
            icon={Heart}
            progressPct={myBalance.sick.total ? (myBalance.sick.used / myBalance.sick.total) * 100 : 0}
            onClick={openLeaveCategory ? () => openLeaveCategory(currentUserId, 'sick') : undefined}
          />
          <BalanceTile
            palette={palette}
            label={`Paid leave · ${myBalance.year}`}
            big={fmtNum(myBalance.paid.available)}
            bigLabel="available"
            subText={`${fmtNum(myBalance.paid.used)} used · carries forward`}
            accentColor={CATEGORY_META.paid.color}
            icon={Wallet}
            progressPct={myBalance.paid.total ? (myBalance.paid.used / myBalance.paid.total) * 100 : 0}
            onClick={openLeaveCategory ? () => openLeaveCategory(currentUserId, 'paid') : undefined}
          />
          <BalanceTile
            palette={palette}
            label={`Unpaid leave · ${myBalance.year}`}
            big={fmtNum(myBalance.unpaid?.used || 0)}
            bigLabel="used"
            subText="No limit on unpaid"
            accentColor={CATEGORY_META.unpaid.color}
            icon={Coins}
            onClick={openLeaveCategory ? () => openLeaveCategory(currentUserId, 'unpaid') : undefined}
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
              gridTemplateColumns: 'minmax(0, 2fr) 1fr 1fr 1fr',
              gap: 16,
              padding: '12px 20px',
              borderBottom: `1px solid ${palette.border}`,
              backgroundColor: palette.surfaceAlt,
            }}
          >
            {['EMPLOYEE', 'SICK', 'PAID', 'UNPAID'].map((h, i) => (
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
          {allBalances.map((row, i) => {
            const sick = row.balance.sick;
            const paid = row.balance.paid;
            const unpaid = row.balance.unpaid || { used: 0 };
            const cellBtn = (extra = {}) => ({
              background: 'none',
              border: 'none',
              cursor: openLeaveCategory ? 'pointer' : 'default',
              padding: 0,
              textAlign: 'right',
              fontFamily: 'inherit',
              color: 'inherit',
              ...extra,
            });
            return (
              <div
                key={row.employee.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 2fr) 1fr 1fr 1fr',
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
                <button
                  type="button"
                  onClick={() => openLeaveCategory && openLeaveCategory(row.employee.id, 'sick')}
                  style={cellBtn()}
                >
                  <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text }}>
                    {fmtNum(sick.used)} <span style={{ color: palette.textMute }}>/ {fmtNum(sick.total)}</span>
                  </div>
                  <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute, marginTop: 2 }}>
                    {fmtNum(sick.available)} this month{sick.expired ? ` · ${fmtNum(sick.expired)} expired` : ''}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openLeaveCategory && openLeaveCategory(row.employee.id, 'paid')}
                  style={cellBtn()}
                >
                  <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text }}>
                    {fmtNum(paid.used)} <span style={{ color: palette.textMute }}>/ {fmtNum(paid.total)}</span>
                  </div>
                  <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute, marginTop: 2 }}>
                    {fmtNum(paid.available)} balance
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => openLeaveCategory && openLeaveCategory(row.employee.id, 'unpaid')}
                  style={cellBtn()}
                >
                  <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text }}>
                    {fmtNum(unpaid.used)}
                  </div>
                  <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute, marginTop: 2 }}>
                    no limit
                  </div>
                </button>
              </div>
            );
          })}
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
            const cellDate = new Date(cursor.getFullYear(), cursor.getMonth(), day);
            const isSunday = cellDate.getDay() === 0;
            const isFutureOrToday = cellDate.getTime() >= todayMidnight;
            const isPast = cellDate.getTime() < todayMidnight;
            const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const onLeave = leavesByDay.get(day) || [];
            const visible = onLeave.slice(0, 3);
            const overflow = onLeave.length - visible.length;
            const showApplyHint = !isAdmin && isFutureOrToday && hoverDay === day;
            const hasPastSession = !isAdmin && isPast && !!mySessions[dateStr];

            // Sunday tint or normal surface.
            const cellBg = isSunday ? (isDark ? '#241f1a' : '#FAF6EF') : palette.surface;

            return (
              <div
                key={day}
                onMouseEnter={(e) => {
                  setHoverDay(day);
                  if (hasPastSession) showPastHover(e, dateStr);
                }}
                onMouseMove={(e) => {
                  if (hasPastSession) movePastHover(e);
                }}
                onMouseLeave={() => {
                  setHoverDay((d) => (d === day ? null : d));
                  hidePastHover();
                }}
                style={{
                  minHeight: 96,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 8,
                  backgroundColor: cellBg,
                  gap: 6,
                  position: 'relative',
                }}
                title={
                  onLeave.length
                    ? onLeave.map((l) => {
                        const statusLabel = l.status === 'pending' ? 'PENDING' : l.status === 'approved' ? 'APPROVED' : (l.status || '').toUpperCase();
                        return `${l.employee?.name || 'Unknown'} — ${(l.category || 'paid').toUpperCase()} · ${statusLabel}${l.type === 'half' ? ' (½ day)' : ''}`;
                      }).join('\n')
                    : ''
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 12,
                      color: isToday ? palette.accent : (isSunday ? palette.textDim : palette.text),
                      fontWeight: isToday ? 600 : 400,
                    }}
                  >
                    {day}
                  </span>
                  {isSunday && (
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: 8.5,
                        color: palette.textMute,
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                      }}
                    >
                      OFF
                    </span>
                  )}
                </div>
                {visible.map((l, vi) => {
                  const isApproved = l.status === 'approved';
                  const bg = isApproved ? '#ECFDF5' : '#FEF2F2';
                  const fg = isApproved ? '#065F46' : '#991B1B';
                  return (
                    <div
                      key={l._id + vi}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 5px 2px 4px',
                        borderRadius: 4,
                        backgroundColor: bg,
                        color: fg,
                        fontFamily: baseFont,
                        fontSize: 10.5,
                        fontWeight: 500,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                      }}
                    >
                      <span style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: fg, flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.employee?.name?.split(' ')[0] || '?'}
                        {l.type === 'half'
                          ? ' ½'
                          : l.type === 'hours'
                          ? ` ${l.durationHours || 0}h`
                          : ''}
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

                {/* Quick-apply pill — employee only, future dates only.
                    Labels Update if the employee already has a leave on this date. */}
                {showApplyHint && (
                  <button
                    type="button"
                    onClick={() => openApplyForDate(cursor.getFullYear(), cursor.getMonth(), day)}
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      left: 6,
                      right: 6,
                      padding: '4px 6px',
                      borderRadius: 6,
                      backgroundColor: onLeave.length > 0 ? palette.warn : palette.accent,
                      color: onLeave.length > 0 ? '#fff' : palette.accentText,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: baseFont,
                      fontSize: 10.5,
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    }}
                  >
                    {onLeave.length > 0 ? (
                      <>
                        <Pencil size={10} strokeWidth={2.5} /> Update leave
                      </>
                    ) : (
                      <>
                        <Plus size={10} strokeWidth={2.5} /> Apply leave
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Calendar legend — status-based + holiday tint */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#ECFDF5', border: '1px solid #06593F40' }} />
            <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>Approved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#FEF2F2', border: '1px solid #991B1B40' }} />
            <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: isDark ? '#241f1a' : '#FAF6EF', border: `1px solid ${palette.border}` }} />
            <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>Sunday (off)</span>
          </div>
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
                    {range} · {l.type === 'half'
                      ? 'Half day'
                      : l.type === 'hours'
                      ? `${l.durationHours || 0} hour${l.durationHours === 1 ? '' : 's'}`
                      : 'Full day'}
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
                {form.category === 'sick' && `${fmtNum(myBalance.sick.available)} sick day(s) available this month · expires at month end`}
                {form.category === 'paid' && `${fmtNum(myBalance.paid.available)} paid day(s) available · carries forward`}
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
                  {[2, 6].map((h) => (
                    <option key={h} value={h}>
                      {h} hours
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

      {/* Past-day session log tooltip — follows cursor */}
      {pastHover && <PastDayLogTooltip palette={palette} session={pastHover.session} x={pastHover.x} y={pastHover.y} />}
    </div>
  );
}

// Compact session-log popover that follows the cursor.
function PastDayLogTooltip({ palette, session, x, y }) {
  if (!session) return null;
  const events = [];
  if (session.startedAt) events.push({ time: session.startedAt, label: 'Joined', color: '#10B981' });
  for (const a of session.afkPeriods || []) {
    if (a.startedAt) events.push({ time: a.startedAt, label: a.reason ? `AFK · ${a.reason}` : 'AFK', color: '#A78BFA' });
    if (a.endedAt) events.push({ time: a.endedAt, label: 'Resumed', color: '#10B981' });
  }
  if (session.endedAt) events.push({ time: session.endedAt, label: 'Ended', color: '#6B7280' });
  events.sort((p, q) => new Date(p.time) - new Date(q.time));

  // Position 14px to the right + below the cursor; clamp to viewport.
  const W = 220;
  const H = 36 + events.length * 20;
  let left = x + 14;
  let top = y + 14;
  if (typeof window !== 'undefined') {
    if (left + W + 8 > window.innerWidth) left = x - W - 14;
    if (top + H + 8 > window.innerHeight) top = y - H - 14;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
  }

  const fmt = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const totals = session.totals || {};

  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        width: W,
        zIndex: 1000,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 10,
        boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        padding: '10px 12px',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 8 }}>
        {(totals.activeSec / 3600 || 0).toFixed(1)}H ACTIVE · {Math.round((totals.afkSec || 0) / 60)}M AFK
      </div>
      {events.length === 0 ? (
        <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textMute }}>No activity recorded.</div>
      ) : (
        events.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: e.color, flexShrink: 0 }} />
            <span style={{ fontFamily: monoFont, fontSize: 11.5, color: palette.text, fontWeight: 500, minWidth: 40 }}>
              {fmt(e.time)}
            </span>
            <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {e.label}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
