import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Paperclip,
  FileText,
  ExternalLink,
  Heart,
  Wallet,
  Coins,
  Calendar,
  AlertCircle,
  Check,
  X as XIcon,
  Upload,
} from 'lucide-react';
import { teamLeavesAPI } from '../teamAPI';
import { useTeamAuth } from '../TeamAuthContext';
import { baseFont, serifFont, monoFont } from '../theme';
import { Avatar, Card, GhostButton, SolidButton } from '../components/Primitives';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
function fmtBytes(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const CATEGORY_META = {
  sick: { label: 'Sick leave', color: '#7C3AED', bg: '#F5F3FF', icon: Heart },
  paid: { label: 'Paid leave', color: '#0E7490', bg: '#ECFEFF', icon: Wallet },
  unpaid: { label: 'Unpaid leave', color: '#6B7280', bg: '#F3F4F6', icon: Coins },
};
const STATUS_STYLES = {
  pending: { bg: '#FFFBEB', color: '#92400E', label: 'Pending' },
  approved: { bg: '#ECFDF5', color: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEF2F2', color: '#991B1B', label: 'Rejected' },
};
const DURATION_LABEL = {
  full: 'Full day',
  half: 'Half day',
  hours: 'Few hours',
};

function MetaRow({ palette, label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 16,
        padding: '12px 20px',
        borderTop: `1px solid ${palette.border}`,
      }}
    >
      <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Calendar size={12} style={{ color: palette.textMute }} />
        {label}
      </div>
      <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text }}>{value || '—'}</div>
    </div>
  );
}

export default function LeaveDetailView({ palette, isDark, leaveId, onBack }) {
  const { user } = useTeamAuth();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileInputRef = useRef(null);

  const fetchLeave = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await teamLeavesAPI.get(leaveId);
      if (data?.success) setLeave(data.leave);
      else setError(data?.message || 'Leave not found');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load leave');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveId]);

  const isAdmin = user?.role === 'admin';
  const isOwner = leave && user && (leave.employee?._id || leave.employeeId)?.toString?.() === user.id?.toString?.();
  const canAttach = isAdmin || isOwner;

  const onPickFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploadErr('');
    setUploading(true);
    try {
      const up = await teamLeavesAPI.uploadFiles(Array.from(fileList));
      if (!up.data?.success) {
        setUploadErr(up.data?.message || 'Upload failed');
        return;
      }
      const add = await teamLeavesAPI.addAttachments(leaveId, up.data.files);
      if (add.data?.success && add.data.leave) {
        setLeave(add.data.leave);
      } else {
        setUploadErr(add.data?.message || 'Could not attach');
      }
    } catch (err) {
      setUploadErr(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  if (loading) {
    return (
      <div>
        <BackBar palette={palette} onBack={onBack} />
        <div style={{ padding: 60, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Loading…</div>
      </div>
    );
  }
  if (error || !leave) {
    return (
      <div>
        <BackBar palette={palette} onBack={onBack} />
        <div style={{ padding: 60, textAlign: 'center', color: palette.danger, fontFamily: baseFont, fontSize: 13.5 }}>
          {error || 'Leave not available.'}
        </div>
      </div>
    );
  }

  const catM = CATEGORY_META[leave.category || 'paid'];
  const statM = STATUS_STYLES[leave.status] || STATUS_STYLES.pending;
  const CatIcon = catM.icon;
  const isSick = leave.category === 'sick';
  const hasAttachments = (leave.attachments || []).length > 0;
  const showMissingBanner = isSick && !hasAttachments;

  const rangeLabel =
    new Date(leave.startDate).toDateString() === new Date(leave.endDate).toDateString()
      ? fmtDate(leave.startDate)
      : `${fmtDate(leave.startDate)} – ${fmtDate(leave.endDate)}`;

  const durationLabel =
    leave.type === 'hours'
      ? `${leave.durationHours || 0} hour${leave.durationHours === 1 ? '' : 's'}`
      : DURATION_LABEL[leave.type] || leave.type;

  return (
    <div>
      <BackBar palette={palette} onBack={onBack} />

      {/* Header */}
      <div style={{ paddingBottom: 24, borderBottom: `1px solid ${palette.border}`, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              backgroundColor: catM.bg,
              color: catM.color,
              fontFamily: baseFont,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <CatIcon size={11} strokeWidth={2.25} />
            {catM.label}
          </span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              backgroundColor: statM.bg,
              color: statM.color,
              fontFamily: baseFont,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {statM.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Avatar initials={leave.employee?.avatar || '?'} size={48} palette={palette} />
          <div>
            <h1 style={{ fontFamily: serifFont, fontSize: 30, fontWeight: 400, color: palette.text, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
              {leave.employee?.name || 'Employee'}
            </h1>
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 4 }}>
              {leave.employee?.jobTitle || 'Team member'}
            </div>
          </div>
        </div>
      </div>

      {/* Missing prescription banner */}
      {showMissingBanner && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: 16,
            borderRadius: 10,
            backgroundColor: palette.warnBg,
            color: palette.warn,
            border: `1px solid ${palette.warn}55`,
            marginBottom: 24,
            fontFamily: baseFont,
            fontSize: 13.5,
            lineHeight: 1.55,
          }}
        >
          <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>No prescription attached</div>
            {canAttach ? (
              <div>
                Please attach a doctor's prescription (image or PDF) for this sick leave.
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={uploading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      backgroundColor: palette.warn,
                      color: '#fff',
                      border: 'none',
                      fontFamily: baseFont,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: uploading ? 'wait' : 'pointer',
                    }}
                  >
                    <Upload size={13} /> {uploading ? 'Uploading…' : 'Attach prescription'}
                  </button>
                </div>
              </div>
            ) : (
              <div>The employee hasn't uploaded a prescription yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Detail card */}
      <Card palette={palette} padding={0} style={{ marginBottom: 24 }}>
        <div
          style={{
            padding: '12px 20px',
            borderBottom: `1px solid ${palette.border}`,
            fontFamily: monoFont,
            fontSize: 10.5,
            color: palette.textMute,
            letterSpacing: '0.08em',
            backgroundColor: palette.surfaceAlt,
          }}
        >
          REQUEST DETAILS
        </div>
        <MetaRow palette={palette} label="When" value={rangeLabel} />
        <MetaRow palette={palette} label="Duration" value={durationLabel} />
        <MetaRow palette={palette} label="Category" value={catM.label} />
        <MetaRow palette={palette} label="Applied on" value={fmtDateTime(leave.createdAt)} />
        {leave.reviewedAt && <MetaRow palette={palette} label="Reviewed on" value={fmtDateTime(leave.reviewedAt)} />}
      </Card>

      {/* Reason */}
      {leave.reason && (
        <Card palette={palette} padding={20} style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 8 }}>
            REASON
          </div>
          <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            {leave.reason}
          </div>
        </Card>
      )}

      {/* Attachments */}
      <Card palette={palette} padding={20}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasAttachments ? 14 : 0, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Paperclip size={14} style={{ color: palette.textMute }} />
            <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>
              {isSick ? 'PRESCRIPTION' : 'ATTACHMENTS'}
              {hasAttachments && ` · ${leave.attachments.length}`}
            </span>
          </div>
          {canAttach && (
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                backgroundColor: palette.surfaceAlt,
                color: palette.text,
                border: `1px solid ${palette.border}`,
                fontFamily: baseFont,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: uploading ? 'wait' : 'pointer',
              }}
            >
              <Upload size={12} /> {uploading ? 'Uploading…' : hasAttachments ? 'Add more' : 'Attach file'}
            </button>
          )}
        </div>

        {uploadErr && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              backgroundColor: palette.dangerBg,
              color: palette.danger,
              fontFamily: baseFont,
              fontSize: 13,
              marginTop: 12,
            }}
          >
            {uploadErr}
          </div>
        )}

        {!hasAttachments && !showMissingBanner && (
          <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute, marginTop: 12 }}>
            {canAttach ? 'No files yet. Use the button above to upload one.' : 'No files have been attached.'}
          </div>
        )}

        {hasAttachments && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {leave.attachments.map((a, idx) => {
              const isImg = (a.mimetype || '').startsWith('image/');
              return (
                <a
                  key={a.url + idx}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.surface,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: palette.text,
                    transition: 'border-color 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = palette.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = palette.border)}
                >
                  {isImg ? (
                    <img src={a.url} alt={a.originalName} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div
                      style={{
                        height: 110,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: palette.surfaceAlt,
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <FileText size={28} style={{ color: palette.textMute }} />
                        <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, marginTop: 6, letterSpacing: '0.06em' }}>
                          {(a.originalName?.split('.').pop() || 'FILE').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '8px 10px' }}>
                    <div
                      style={{
                        fontFamily: baseFont,
                        fontSize: 12.5,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={a.originalName}
                    >
                      {a.originalName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute }}>{fmtBytes(a.size)}</span>
                      <ExternalLink size={11} style={{ color: palette.textMute }} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept="image/*,application/pdf"
        onChange={(e) => {
          onPickFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function BackBar({ palette, onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        marginBottom: 20,
        fontFamily: baseFont,
        fontSize: 12.5,
        color: palette.textDim,
      }}
    >
      <ChevronLeft size={14} /> Back to leaves
    </button>
  );
}
