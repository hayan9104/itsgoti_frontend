import { useState } from 'react';
import {
  Lock,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Briefcase,
  Shield,
  LogOut,
  Pencil,
  Check,
  X as XIcon,
  Copy,
} from 'lucide-react';
import { teamAuthAPI } from '../teamAPI';
import { useTeamAuth } from '../TeamAuthContext';
import { baseFont, serifFont, monoFont } from '../theme';
import { Avatar, Card, PageHeader, FieldLabel, TextInput, SolidButton, GhostButton, Modal } from '../components/Primitives';

function MetaRow({ palette, icon: Icon, label, value, action }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr auto',
        gap: 16,
        padding: '12px 20px',
        alignItems: 'center',
        borderTop: `1px solid ${palette.border}`,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: baseFont,
          fontSize: 12.5,
          color: palette.textDim,
        }}
      >
        {Icon && <Icon size={13} style={{ color: palette.textMute }} />}
        {label}
      </div>
      <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text }}>{value || '—'}</div>
      <div>{action}</div>
    </div>
  );
}

export default function TeamSettingsView({ palette }) {
  const { user, logout, refresh, setUser } = useTeamAuth();

  // Name edit state
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  // Password section state
  const [pwdOpen, setPwdOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot flow state
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmForgot, setConfirmForgot] = useState(false);

  if (!user) return null;

  const startEditName = () => {
    setNameDraft(user.name || '');
    setNameError('');
    setEditingName(true);
  };
  const cancelEditName = () => {
    setEditingName(false);
    setNameError('');
  };
  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    if (trimmed === user.name) {
      setEditingName(false);
      return;
    }
    setNameSaving(true);
    try {
      const { data } = await teamAuthAPI.updateName(trimmed);
      if (data?.success && data.user) {
        setUser((u) => ({ ...(u || {}), ...data.user }));
        setEditingName(false);
      } else {
        setNameError(data?.message || 'Could not save name.');
      }
    } catch (err) {
      setNameError(err?.response?.data?.message || 'Could not save name.');
    } finally {
      setNameSaving(false);
    }
  };

  const onSubmitPwd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!current || !next || !confirm) return setError('Fill all three fields.');
    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (next !== confirm) return setError('New passwords do not match.');
    setSubmitting(true);
    try {
      const { data } = await teamAuthAPI.changePassword(current, next);
      if (data?.success) {
        setSuccess('Password updated.');
        setCurrent('');
        setNext('');
        setConfirm('');
        await refresh();
      } else {
        setError(data?.message || 'Could not change password.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = async () => {
    setConfirmForgot(false);
    setForgotSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await teamAuthAPI.forgotPassword();
      if (data?.success && data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword);
      } else {
        setError(data?.message || 'Could not generate a new password.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not generate a new password.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const closeGenerated = () => {
    setGeneratedPassword(null);
    setCopied(false);
  };

  const copyPwd = () => {
    if (!generatedPassword) return;
    navigator.clipboard?.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        kicker="YOUR ACCOUNT"
        palette={palette}
        right={
          <button
            type="button"
            onClick={logout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
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
            <LogOut size={13} /> Log out
          </button>
        }
      />

      {/* Profile card */}
      <Card palette={palette} padding={0} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24 }}>
          <Avatar initials={user.avatar} size={56} palette={palette} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: serifFont, fontSize: 24, color: palette.text, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {user.name}
            </div>
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 4 }}>
              {user.jobTitle || 'Team member'}
            </div>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              backgroundColor: user.role === 'admin' ? palette.accentBg : palette.surfaceAlt,
              color: user.role === 'admin' ? palette.accent : palette.textDim,
              fontFamily: monoFont,
              fontSize: 10.5,
              letterSpacing: '0.08em',
              fontWeight: 500,
              textTransform: 'uppercase',
            }}
          >
            {user.role === 'admin' ? 'ADMIN' : 'MEMBER'}
          </span>
        </div>

        <MetaRow
          palette={palette}
          icon={User}
          label="Name"
          value={
            editingName ? (
              <div>
                <TextInput
                  palette={palette}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  autoFocus
                  style={{ maxWidth: 320 }}
                />
                {nameError && (
                  <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.danger, marginTop: 6 }}>
                    {nameError}
                  </div>
                )}
              </div>
            ) : (
              user.name
            )
          }
          action={
            editingName ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={cancelEditName}
                  disabled={nameSaving}
                  title="Cancel"
                  style={{
                    padding: 6,
                    background: 'none',
                    border: `1px solid ${palette.border}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: palette.textDim,
                  }}
                >
                  <XIcon size={13} />
                </button>
                <button
                  type="button"
                  onClick={saveName}
                  disabled={nameSaving}
                  title="Save"
                  style={{
                    padding: 6,
                    background: palette.accent,
                    border: `1px solid ${palette.accent}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: palette.accentText,
                  }}
                >
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditName}
                title="Edit name"
                style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute }}
              >
                <Pencil size={13} />
              </button>
            )
          }
        />
        <MetaRow palette={palette} icon={Mail} label="Email" value={user.email} />
        <MetaRow palette={palette} icon={Briefcase} label="Job title" value={user.jobTitle} />
        <MetaRow palette={palette} icon={Shield} label="Role" value={user.role === 'admin' ? 'Admin' : 'Member'} />
        <MetaRow
          palette={palette}
          label="Joined"
          value={
            user.joinedAt
              ? new Date(user.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
              : '—'
          }
        />
      </Card>

      {/* Password card — collapsed by default */}
      <Card palette={palette} padding={24}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0 }}>
              Password
            </h3>
            <p style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, margin: 0, marginTop: 4 }}>
              {pwdOpen
                ? 'Use at least 8 characters. You’ll stay signed in after the change.'
                : 'Keep your account secure. Update it any time.'}
            </p>
          </div>
          {!pwdOpen && (
            <button
              type="button"
              onClick={() => {
                setPwdOpen(true);
                setError('');
                setSuccess('');
              }}
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
              <Lock size={13} /> Change password
            </button>
          )}
        </div>

        {pwdOpen && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${palette.border}` }}>
            <form onSubmit={onSubmitPwd}>
              <div style={{ marginBottom: 12 }}>
                <FieldLabel palette={palette}>Current password</FieldLabel>
                <TextInput
                  palette={palette}
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <FieldLabel palette={palette}>New password</FieldLabel>
                  <TextInput
                    palette={palette}
                    type="password"
                    autoComplete="new-password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel palette={palette}>Re-enter new password</FieldLabel>
                  <TextInput
                    palette={palette}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: palette.dangerBg,
                    color: palette.danger,
                    fontFamily: baseFont,
                    fontSize: 13,
                    marginBottom: 14,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </div>
              )}
              {success && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: palette.accentBg,
                    color: palette.accent,
                    fontFamily: baseFont,
                    fontSize: 13,
                    marginBottom: 14,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <CheckCircle2 size={14} />
                  {success}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setConfirmForgot(true)}
                  disabled={forgotSubmitting}
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
                  {forgotSubmitting ? 'Generating…' : 'Forgot password? Generate a new one'}
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <GhostButton
                    onClick={() => {
                      setPwdOpen(false);
                      setCurrent('');
                      setNext('');
                      setConfirm('');
                      setError('');
                      setSuccess('');
                    }}
                    palette={palette}
                  >
                    Cancel
                  </GhostButton>
                  <SolidButton type="submit" palette={palette} disabled={submitting} icon={Lock}>
                    {submitting ? 'Saving…' : 'Update password'}
                  </SolidButton>
                </div>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Forgot confirm modal */}
      <Modal
        open={confirmForgot}
        onClose={() => setConfirmForgot(false)}
        title="Generate a new password?"
        palette={palette}
        width={460}
      >
        <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.textDim, marginBottom: 18, lineHeight: 1.55 }}>
          We'll replace your current password with a fresh memorable one and show it once. Make sure to copy it before
          closing the dialog.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <GhostButton onClick={() => setConfirmForgot(false)} palette={palette}>
            Cancel
          </GhostButton>
          <SolidButton onClick={onForgot} palette={palette} disabled={forgotSubmitting}>
            {forgotSubmitting ? 'Generating…' : 'Yes, generate'}
          </SolidButton>
        </div>
      </Modal>

      {/* Password generated modal */}
      <Modal
        open={!!generatedPassword}
        onClose={closeGenerated}
        title="Password generated"
        palette={palette}
        width={460}
      >
        <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.textDim, marginBottom: 14, lineHeight: 1.55 }}>
          Save this password somewhere safe — this is the <strong>only time</strong> you'll see it. You can change it
          again from this page once you log in with it.
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
            onClick={copyPwd}
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
          <SolidButton onClick={closeGenerated} palette={palette}>
            Done
          </SolidButton>
        </div>
      </Modal>
    </div>
  );
}
