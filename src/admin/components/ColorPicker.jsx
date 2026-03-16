import { useState, useRef, useEffect } from 'react';

const ColorPicker = ({
  label,
  value = '#000000',
  onChange,
  description,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const pickerRef = useRef(null);
  const containerRef = useRef(null);

  // Sync input value with prop
  useEffect(() => {
    setInputValue(value || '#000000');
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e) => {
    let newValue = e.target.value;

    // Auto-add # if missing
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }

    setInputValue(newValue);

    // Validate hex color before calling onChange
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // If invalid, reset to previous valid value
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
      setInputValue(value || '#000000');
    }
  };

  // Preset colors
  const presetColors = [
    '#000000', '#ffffff', '#170935', '#2558BF', '#E1FFA0',
    '#ffa562', '#10b981', '#ef4444', '#f59e0b', '#6366f1',
    '#ec4899', '#14b8a6', '#fffdf8', '#f3f4f6', '#1f2937',
  ];

  return (
    <div ref={containerRef} style={{ marginBottom: '16px' }}>
      {/* Label */}
      {label && (
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          color: '#374151',
          marginBottom: '6px',
        }}>
          {label}
        </label>
      )}

      {/* Color picker container */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {/* Color swatch button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            backgroundColor: inputValue || '#000000',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: 0,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            opacity: disabled ? 0.5 : 1,
          }}
          title={disabled ? 'Disabled' : 'Click to pick color'}
        />

        {/* Hex input */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder="#000000"
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            outline: 'none',
            transition: 'border-color 0.2s',
            backgroundColor: disabled ? '#f9fafb' : '#fff',
            opacity: disabled ? 0.7 : 1,
          }}
          onFocus={(e) => e.target.style.borderColor = '#2563eb'}
          onBlurCapture={(e) => e.target.style.borderColor = '#e5e7eb'}
        />

        {/* Hidden native color picker */}
        <input
          ref={pickerRef}
          type="color"
          value={inputValue || '#000000'}
          onChange={handleColorChange}
          disabled={disabled}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Dropdown with presets */}
      {isOpen && !disabled && (
        <div style={{
          marginTop: '8px',
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {/* Preset colors grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            marginBottom: '12px',
          }}>
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setInputValue(color);
                  onChange(color);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: inputValue === color ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  backgroundColor: color,
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title={color}
              />
            ))}
          </div>

          {/* Custom color picker button */}
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f9fafb'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Pick Custom Color
          </button>
        </div>
      )}

      {/* Description */}
      {description && (
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '4px',
          marginBottom: 0,
        }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default ColorPicker;
