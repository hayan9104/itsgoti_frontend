const TextareaFieldEditor = ({ field, value, onChange }) => {
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
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
        rows={field.rows || 4}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          boxSizing: 'border-box',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#2563eb';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
        }}
      />
      {field.hint && (
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '4px',
          marginBottom: 0,
        }}>
          {field.hint}
        </p>
      )}
    </div>
  );
};

export default TextareaFieldEditor;
