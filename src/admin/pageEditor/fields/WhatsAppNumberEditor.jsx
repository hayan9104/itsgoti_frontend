import { useState, useEffect } from 'react';

// Country codes with flags and dial codes
const countryCodes = [
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'NP', name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { code: 'LK', name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
];

// Validation rules per country
const getValidationRules = (countryCode) => {
  const rules = {
    IN: { minLength: 10, maxLength: 10, pattern: /^[6-9]\d{9}$/, example: '9876543210' },
    US: { minLength: 10, maxLength: 10, pattern: /^\d{10}$/, example: '2025551234' },
    GB: { minLength: 10, maxLength: 11, pattern: /^\d{10,11}$/, example: '7911123456' },
    AE: { minLength: 9, maxLength: 9, pattern: /^\d{9}$/, example: '501234567' },
    SA: { minLength: 9, maxLength: 9, pattern: /^\d{9}$/, example: '512345678' },
    default: { minLength: 6, maxLength: 15, pattern: /^\d{6,15}$/, example: '1234567890' },
  };
  return rules[countryCode] || rules.default;
};

const WhatsAppNumberEditor = ({ field, value, onChange }) => {
  // Parse existing value (format: "countryCode:phoneNumber" e.g., "IN:9876543210")
  const parseValue = (val) => {
    if (!val) return { countryCode: 'IN', phoneNumber: '' };
    if (val.includes(':')) {
      const [cc, phone] = val.split(':');
      return { countryCode: cc, phoneNumber: phone };
    }
    // Legacy format - try to detect country code from number
    if (val.startsWith('91') && val.length >= 12) {
      return { countryCode: 'IN', phoneNumber: val.substring(2) };
    }
    return { countryCode: 'IN', phoneNumber: val };
  };

  const initialParsed = parseValue(value);
  const [countryCode, setCountryCode] = useState(initialParsed.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialParsed.phoneNumber);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const selectedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0];
  const validationRules = getValidationRules(countryCode);

  // Validate phone number
  const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';

    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < validationRules.minLength) {
      return `Phone number must be at least ${validationRules.minLength} digits`;
    }
    if (cleanPhone.length > validationRules.maxLength) {
      return `Phone number must not exceed ${validationRules.maxLength} digits`;
    }
    if (!validationRules.pattern.test(cleanPhone)) {
      return `Invalid phone number format for ${selectedCountry.name}`;
    }
    return '';
  };

  // Update parent when values change
  useEffect(() => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone) {
      // Store as "countryCode:phoneNumber" format
      onChange(`${countryCode}:${cleanPhone}`);
    }
  }, [countryCode, phoneNumber]);

  // Validate on change
  useEffect(() => {
    if (touched) {
      setError(validatePhone(phoneNumber));
    }
  }, [phoneNumber, countryCode, touched]);

  const handlePhoneChange = (e) => {
    const input = e.target.value;
    // Only allow digits, spaces, and dashes for formatting
    const cleaned = input.replace(/[^\d\s-]/g, '');
    setPhoneNumber(cleaned);
    setTouched(true);
  };

  const handleCountryChange = (e) => {
    setCountryCode(e.target.value);
    // Re-validate with new country rules
    if (touched) {
      setError(validatePhone(phoneNumber));
    }
  };

  // Generate WhatsApp URL for preview
  const getWhatsAppUrl = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const dialCode = selectedCountry.dial.replace('+', '');
    return `https://wa.me/${dialCode}${cleanPhone}`;
  };

  const isValid = !error && phoneNumber.replace(/\D/g, '').length >= validationRules.minLength;

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Label */}
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '6px',
      }}>
        {field.label}
      </label>

      {/* Hint */}
      {field.hint && (
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: '0 0 8px 0',
        }}>
          {field.hint}
        </p>
      )}

      {/* Input Container */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
      }}>
        {/* Country Code Dropdown */}
        <div style={{ position: 'relative', minWidth: '160px' }}>
          <select
            value={countryCode}
            onChange={handleCountryChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            {countryCodes.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.dial} ({country.code})
              </option>
            ))}
          </select>
          {/* Dropdown arrow */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {/* Phone Number Input */}
        <div style={{ flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              onBlur={() => setTouched(true)}
              placeholder={validationRules.example}
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                fontSize: '14px',
                border: `1px solid ${error && touched ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
            {/* WhatsApp icon */}
            <div style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && touched && (
        <p style={{
          fontSize: '12px',
          color: '#ef4444',
          margin: '6px 0 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}

      {/* Preview Link */}
      {isValid && (
        <div style={{
          marginTop: '10px',
          padding: '10px 12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <p style={{
                fontSize: '12px',
                color: '#166534',
                margin: '0 0 4px 0',
                fontWeight: 500,
              }}>
                WhatsApp Link Preview
              </p>
              <p style={{
                fontSize: '13px',
                color: '#15803d',
                margin: 0,
                fontFamily: 'monospace',
              }}>
                {getWhatsAppUrl()}
              </p>
            </div>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 12px',
                backgroundColor: '#25D366',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Test
            </a>
          </div>
        </div>
      )}

      {/* Full Number Display */}
      {isValid && (
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: '8px 0 0 0',
        }}>
          Full number: <strong>{selectedCountry.dial} {phoneNumber.replace(/\D/g, '')}</strong>
        </p>
      )}
    </div>
  );
};

export default WhatsAppNumberEditor;
