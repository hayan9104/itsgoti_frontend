const ToggleFieldEditor = ({ field, value, onChange }) => {
  const isEnabled = value === true || value === 'true';

  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '6px',
      }}>
        {field.label}
      </label>

      <div
        onClick={() => onChange(!isEnabled)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Toggle Switch */}
        <div style={{
          width: '48px',
          height: '26px',
          borderRadius: '13px',
          backgroundColor: isEnabled ? '#10b981' : '#d1d5db',
          position: 'relative',
          transition: 'background-color 0.2s ease',
        }}>
          <div style={{
            position: 'absolute',
            top: '3px',
            left: isEnabled ? '25px' : '3px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s ease',
          }} />
        </div>

        {/* Status Text */}
        <span style={{
          fontSize: '14px',
          color: isEnabled ? '#10b981' : '#6b7280',
          fontWeight: 500,
        }}>
          {isEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      {field.hint && (
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: '6px 0 0 0',
        }}>
          {field.hint}
        </p>
      )}
    </div>
  );
};

export default ToggleFieldEditor;
