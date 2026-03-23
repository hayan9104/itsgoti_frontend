import { useState, useEffect } from 'react';

const RangeFieldEditor = ({ field, value, onChange }) => {
  const min = field.min || 1;
  const max = field.max || 10;
  const step = field.step || 0.5;

  const [localValue, setLocalValue] = useState(value || min);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e) => {
    let newValue = parseFloat(e.target.value);
    if (isNaN(newValue)) newValue = min;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Calculate percentage for gradient
  const percentage = ((localValue - min) / (max - min)) * 100;

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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Range Slider */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleChange}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              appearance: 'none',
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
              cursor: 'pointer',
              outline: 'none',
            }}
          />
          {/* Min/Max labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{min}s</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{max}s</span>
          </div>
        </div>

        {/* Number Input */}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleInputChange}
          style={{
            width: '70px',
            padding: '8px 10px',
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            textAlign: 'center',
            outline: 'none',
          }}
        />
        <span style={{ fontSize: '14px', color: '#6b7280' }}>sec</span>
      </div>

      {field.hint && (
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          margin: '8px 0 0 0',
        }}>
          {field.hint}
        </p>
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default RangeFieldEditor;
