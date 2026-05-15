import { useState } from 'react';
import { X } from 'lucide-react';
import { teamCalendarAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont } from '../theme';

const TIME_OPTIONS = (() => {
  const a = [];
  for (let m = 360; m <= 1320; m += 30) {
    a.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return a;
})();
const fmt12 = (hhmm) => {
  let [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function BlockModal({ open, onClose, palette, onCreated }) {
  const [form, setForm] = useState({ title: '', date: todayKey(), start: '12:00', end: '13:00', repeat: 'NONE' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const close = () => {
    setForm({ title: '', date: todayKey(), start: '12:00', end: '13:00', repeat: 'NONE' });
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    setError(null);
    try {
      const res = await teamCalendarAPI.createBlock({
        title: form.title.trim(),
        dateKey: form.date,
        start: form.start,
        end: form.end,
        repeat: form.repeat,
      });
      onCreated(res.data.block);
      close();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save the block. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    backgroundColor: palette.surfaceAlt, color: palette.text,
    fontFamily: monoFont, fontSize: 13, border: `1px solid ${palette.border}`, outline: 'none',
  };
  const inputStyle = { ...selectStyle, fontFamily: baseFont };

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
          borderRadius: 14, padding: 24, width: '100%', maxWidth: 440,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 500, color: palette.text, margin: 0 }}>
            Add a personal block
          </h3>
          <button type="button" onClick={close} style={{ color: palette.textMute, border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, marginBottom: 16 }}>
          Mark internal time so it's not bookable. Only you see this.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle(palette)}>Title</label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Lunch, Team DSM, Focus block"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle(palette)}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle(palette)}>Start</label>
              <select value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} style={selectStyle}>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle(palette)}>End</label>
              <select value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} style={selectStyle}>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{fmt12(t)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle(palette)}>Repeat</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['NONE', 'Does not repeat'], ['WEEKDAYS', 'Every weekday'], ['WEEKLY', 'Weekly']].map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, repeat: v })}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    backgroundColor: form.repeat === v ? palette.accentBg : palette.surfaceAlt,
                    color: form.repeat === v ? palette.accent : palette.text,
                    border: `1px solid ${form.repeat === v ? palette.accent : palette.border}`,
                    fontFamily: baseFont, fontSize: 12, fontWeight: 500,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 14, fontFamily: baseFont, fontSize: 12, color: palette.danger }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            type="button"
            onClick={close}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 13, color: palette.textDim, fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!form.title.trim() || !form.date || saving}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              backgroundColor: palette.accent, color: palette.accentText,
              fontFamily: baseFont, fontSize: 13, fontWeight: 500,
              opacity: (form.title.trim() && form.date && !saving) ? 1 : 0.5,
            }}
          >
            {saving ? 'Saving…' : 'Add block'}
          </button>
        </div>
      </div>
    </div>
  );
}

function labelStyle(palette) {
  return { display: 'block', fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 6 };
}
