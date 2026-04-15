import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlutioCopyLayout from '../components/PlutioCopyLayout';
import { usePlutioCopyAuth } from '../context/PlutioCopyAuthContext';

/* ─── Helpers ─── */
const Icon = ({ d, size = 16, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <path d={d} />
  </svg>
);

const ICONS = {
  search:      'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  table:       'M4 4h16v4H4zm0 6h7v10H4zm9 0h7v4h-7zm0 6h7v4h-7z',
  editView:    'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  filter:      'M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z',
  group:       'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  order:       'M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z',
  archived:    'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5z',
  import:      'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  plus:        'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  chevDown:    'M7 10l5 5 5-5z',
  info:        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  people:      'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  check:       'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  enter:       'M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7h-2z',
};

const ROLES = ['Client', 'Co-owner', 'Contributor'];

const RoleCell = ({ member, activeRoleDropdown, setActiveRoleDropdown, handleRoleChange, dropdownRef }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = activeRoleDropdown === member.id;

  return (
    <td 
      style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563', borderLeft: '1px solid #f0f0f5', position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={() => setActiveRoleDropdown(isActive ? null : member.id)}
        style={{ 
          cursor: 'pointer', 
          padding: '6px 12px', 
          borderRadius: '8px', 
          background: isActive ? '#fff' : 'transparent', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          border: isActive || isHovered ? '1px dotted #d1d5db' : '1px solid transparent',
          transition: 'all 0.2s'
        }}
      >
        {member.role}
      </div>

      {isActive && (
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute', top: '100%', left: '16px', marginTop: '4px',
            background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb', zIndex: 1000, width: '180px', overflow: 'hidden'
          }}
        >
          {ROLES.map(role => (
            <div 
              key={role}
              onClick={() => handleRoleChange(member.id, role)}
              style={{ 
                padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: '13px', color: member.role === role ? '#1f2937' : '#6b7280',
                background: '#fff'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <span>{role}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {role === 'Client' && <Icon d={ICONS.enter} size={14} color="#d1d5db" />}
                {member.role === role && <Icon d={ICONS.check} size={14} color="#6d28d9" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </td>
  );
};

const Contacts = () => {
  const navigate = useNavigate();
  const { members, setMembers } = usePlutioCopyAuth();
  const [activeTab, setActiveTab] = useState('People');
  const [activeRoleDropdown, setActiveRoleDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveRoleDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = [
    { label: 'Contacts', count: members.length, color: '#1f2937' },
    { label: 'Pending',  count: 0, color: '#f97316' },
    { label: 'Active',   count: 0, color: '#22c55e' },
    { label: 'Inactive', count: members.length, color: '#6b7280' },
  ];

  const handleRoleChange = (memberId, newRole) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    setActiveRoleDropdown(null);
  };

  const columns = [
    { key: 'name',      label: 'Name',      width: '250px' },
    { key: 'role',      label: 'User role', width: '180px' },
    { key: 'company',   label: 'Company',   width: '180px' },
    { key: 'status',    label: 'Status',    width: '120px' },
    { key: 'email',     label: 'Email address', width: '300px' },
    { key: 'phone',     label: 'Phone number',  width: '180px' },
    { key: 'country',   label: 'Country',       width: '180px' },
  ];

  return (
    <PlutioCopyLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0ec' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', color: '#6b7280' }}>Contacts</span>
            <span style={{ color: '#d1d5db', fontSize: '15px' }}>/</span>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>People</span>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            {['People', 'Companies'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '4px 0 12px', background: 'none', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #6d28d9' : '2px solid transparent',
                  fontSize: '14px', fontWeight: activeTab === tab ? '700' : '500',
                  color: activeTab === tab ? '#1f2937' : '#9ca3af',
                  cursor: 'pointer'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 20px', borderBottom: '1px solid #e0e0ec',
          background: '#fff', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#f9fafb', minWidth: '180px' }}>
            <Icon d={ICONS.search} size={14} color="#9ca3af" />
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Search</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>
            <Icon d={ICONS.table} size={14} color="#6b7280" />
            <span style={{ fontSize: '13px', color: '#374151' }}>Table</span>
            <Icon d={ICONS.chevDown} size={14} color="#9ca3af" />
          </div>

          {[
            { label: 'Edit view', icon: 'editView' },
            { label: 'Filter',    icon: 'filter' },
            { label: 'Group',     icon: 'group' },
            { label: 'Order',     icon: 'order' },
            { label: 'Archived',  icon: 'archived' },
            { label: 'Import / Export', icon: 'import' },
          ].map(item => (
            <button key={item.label} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px',
              background: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151'
            }}>
              <Icon d={ICONS[item.icon]} size={14} color="#6b7280" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e0e0ec' }}>
          {stats.map((stat, i) => (
            <div key={stat.label} style={{
              flex: 1, padding: '8px 16px', borderLeft: i === 0 ? 'none' : '1px solid #e0e0ec',
              display: 'flex', alignItems: 'center', gap: '10px',
              background: stat.label === 'Contacts' ? '#475569' : stat.label === 'Pending' ? '#f97316' : stat.label === 'Active' ? '#22c55e' : '#64748b',
              color: '#fff'
            }}>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{stat.count}</span>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowX: 'auto', background: '#fff' }}>
          <table style={{ width: '100%', minWidth: '1300px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                <th style={{ width: '40px', padding: '12px', textAlign: 'left' }}>
                  <input type="checkbox" style={{ accentColor: '#6d28d9' }} />
                </th>
                {columns.map(col => (
                  <th key={col.key} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '12px', fontWeight: '600', color: '#6b7280',
                    width: col.width,
                    borderLeft: '1px solid #f0f0f5'
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id} style={{ borderBottom: '1px solid #f0f0f5' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" style={{ accentColor: '#6d28d9' }} />
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', borderLeft: '1px solid #f0f0f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon d={ICONS.people} size={16} color="#94a3b8" />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{member.name}</span>
                    </div>
                  </td>
                  <RoleCell 
                    member={member} 
                    activeRoleDropdown={activeRoleDropdown}
                    setActiveRoleDropdown={setActiveRoleDropdown}
                    handleRoleChange={handleRoleChange}
                    dropdownRef={dropdownRef}
                  />
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563', borderLeft: '1px solid #f0f0f5' }}>{member.company || ''}</td>
                  <td style={{ padding: '12px 16px', borderLeft: '1px solid #f0f0f5' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                      background: '#64748b', color: '#fff'
                    }}>
                      {member.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563', borderLeft: '1px solid #f0f0f5' }}>{member.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563', borderLeft: '1px solid #f0f0f5' }}>{member.phone}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563', borderLeft: '1px solid #f0f0f5' }}>{member.country || ''}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={8} style={{ padding: '12px 16px' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb',
                    borderRadius: '6px', color: '#4b5563', fontSize: '13px', fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    <Icon d={ICONS.plus} size={14} />
                    Add someone
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PlutioCopyLayout>
  );
};

export default Contacts;
