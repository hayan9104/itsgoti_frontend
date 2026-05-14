import { baseFont, serifFont, monoFont, statusMeta } from '../theme';

export function Avatar({ initials, size = 36, palette }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.accentBg,
        color: palette.accent,
        fontFamily: baseFont,
        fontSize: size * 0.36,
        fontWeight: 500,
        letterSpacing: '0.02em',
      }}
    >
      {initials || '?'}
    </div>
  );
}

export function StatusPill({ status, palette, isDark }) {
  const m = statusMeta(palette, isDark)[status] || statusMeta(palette, isDark).offline;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 999,
        backgroundColor: m.bg,
        color: m.text,
        fontFamily: baseFont,
        fontSize: 11.5,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m.dot }} />
      {m.label}
    </span>
  );
}

export function PageHeader({ kicker, title, accentWord, right, palette }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 40,
        paddingBottom: 24,
        borderBottom: `1px solid ${palette.border}`,
        gap: 24,
      }}
    >
      <div>
        {kicker && (
          <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {kicker}
          </div>
        )}
        <h1
          style={{
            fontFamily: serifFont,
            fontSize: 40,
            fontWeight: 400,
            color: palette.text,
            letterSpacing: '-0.02em',
            marginTop: kicker ? 6 : 0,
            marginBottom: 0,
            lineHeight: 1.05,
          }}
        >
          {title}
          {accentWord && (
            <>
              {' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{accentWord}</em>
            </>
          )}
        </h1>
      </div>
      {right}
    </div>
  );
}

export function SolidButton({ children, onClick, icon: Icon, palette, type = 'button', disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 8,
        backgroundColor: palette.accent,
        color: palette.accentText,
        border: 'none',
        fontFamily: baseFont,
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'opacity 120ms',
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.opacity = '0.88')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.opacity = '1')}
    >
      {Icon && <Icon size={14} strokeWidth={2} />} {children}
    </button>
  );
}

export function GhostButton({ children, onClick, icon: Icon, palette, type = 'button', disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 8,
        backgroundColor: palette.surfaceAlt,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        fontFamily: baseFont,
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {Icon && <Icon size={13} strokeWidth={2} />} {children}
    </button>
  );
}

export function Card({ children, palette, padding = 24, style }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatTile({ label, value, sub, palette }) {
  return (
    <div style={{ padding: 24, backgroundColor: palette.surface }}>
      <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 12 }}>{label}</div>
      <div style={{ fontFamily: serifFont, fontSize: 36, fontWeight: 300, color: palette.text, lineHeight: 1 }}>
        {value}
        {sub && <span style={{ fontSize: 14, color: palette.textMute, marginLeft: 6 }}>{sub}</span>}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint, palette }) {
  return (
    <div style={{ padding: 32, textAlign: 'center', fontFamily: baseFont }}>
      <div style={{ fontSize: 14, color: palette.textDim, fontWeight: 500 }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5, color: palette.textMute, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, palette, width = 480 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 14,
          padding: 24,
          width: '100%',
          maxWidth: width,
        }}
      >
        {title && (
          <h3 style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 500, color: palette.text, margin: 0, marginBottom: 18 }}>
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}

export function FieldLabel({ children, palette }) {
  return (
    <label style={{ display: 'block', fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500, marginBottom: 6 }}>
      {children}
    </label>
  );
}

export function TextInput({ palette, style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        backgroundColor: palette.surfaceAlt,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontFamily: baseFont,
        fontSize: 13.5,
        outline: 'none',
        ...style,
      }}
    />
  );
}

export function Select({ palette, children, style, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        backgroundColor: palette.surfaceAlt,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontFamily: baseFont,
        fontSize: 13.5,
        outline: 'none',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

export function Textarea({ palette, style, ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        backgroundColor: palette.surfaceAlt,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontFamily: baseFont,
        fontSize: 13.5,
        outline: 'none',
        resize: 'vertical',
        ...style,
      }}
    />
  );
}
