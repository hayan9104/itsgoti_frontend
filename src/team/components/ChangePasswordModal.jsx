import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { teamAuthAPI } from '../teamAPI';
import { baseFont } from '../theme';
import { Modal, FieldLabel, TextInput, SolidButton } from './Primitives';

export default function ChangePasswordModal({ open, palette, onDone }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError('New password must be at least 8 characters');
    if (next !== confirm) return setError('New passwords do not match');
    setSubmitting(true);
    try {
      const { data } = await teamAuthAPI.changePassword(current, next);
      setSubmitting(false);
      if (data?.success) {
        onDone();
      } else {
        setError(data?.message || 'Could not change password');
      }
    } catch (err) {
      setSubmitting(false);
      setError(err?.response?.data?.message || 'Could not change password');
    }
  };

  return (
    <Modal open={open} onClose={() => {}} title="Set your password" palette={palette} width={460}>
      <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.textDim, marginBottom: 16, lineHeight: 1.55 }}>
        For security, please change the temporary password your admin gave you.
      </div>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <FieldLabel palette={palette}>Current password</FieldLabel>
          <TextInput palette={palette} type="password" autoFocus value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <FieldLabel palette={palette}>New password (8+ characters)</FieldLabel>
          <TextInput palette={palette} type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <FieldLabel palette={palette}>Confirm new password</FieldLabel>
          <TextInput palette={palette} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
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
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            {error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SolidButton type="submit" palette={palette} disabled={submitting} icon={Lock}>
            {submitting ? 'Saving…' : 'Save new password'}
          </SolidButton>
        </div>
      </form>
    </Modal>
  );
}
