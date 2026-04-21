import { useState, useEffect } from 'react';

const API_BASE = '/api';

const RemindersSidebar = ({ selected, onSelect }) => {
  const [adminCount, setAdminCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    Promise.all([
      fetch(`${API_BASE}/reminders/allowed-numbers`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/reminders/contacts`, { headers }).then(r => r.json()),
    ]).then(([admins, clients]) => {
      setAdminCount((admins.data || []).length);
      setClientCount((clients.data || []).length);
    }).catch(() => {});
  }, []);

  const items = [
    { key: 'admin', label: 'Admin', count: adminCount },
    { key: 'client', label: 'Client', count: clientCount },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 10px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Reminders
      </div>
      {items.map(item => {
        const isSelected = selected === item.key;
        return (
          <div key={item.key} onClick={() => onSelect(item.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', margin: '1px 8px', borderRadius: 8,
              cursor: 'pointer', transition: 'background 0.15s',
              backgroundColor: isSelected ? '#2e2f31' : 'transparent',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#252628'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: item.key === 'admin'
                ? 'linear-gradient(135deg, #064e3b, #065f46)'
                : 'linear-gradient(135deg, #1e3a5f, #1e40af)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.key === 'admin' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={item.key === 'admin' ? '#6ee7b7' : '#93c5fd'}>
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#93c5fd">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#e5e7eb' : '#9ca3af', flex: 1 }}>
              {item.label}
            </span>
            {item.count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                backgroundColor: item.key === 'admin' ? '#064e3b' : '#172554',
                color: item.key === 'admin' ? '#6ee7b7' : '#93c5fd',
              }}>
                {item.count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RemindersSidebar;
