import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlutioCopyLayout from '../components/PlutioCopyLayout';
import { usePlutioCopyAuth } from '../context/PlutioCopyAuthContext';
import { plutioContactsAPI } from '../../services/api';

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
  dots:        'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  edit:        'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  pin:         'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', // Placeholder for pin
  view:        'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  deactivate:  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5-9h10v2H7z',
  archive:     'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27z',
  delete:      'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  close:       'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  userPlus:    'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  toggleOn:    'M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  toggleOff:   'M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-10 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  help:        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-3h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z',
};

const TASK_SET_COLORS = ['#6366f1', '#4b5563', '#22c55e', '#f97316', '#eab308', '#3b82f6', '#f1f1f1', '#e5e7eb'];
const ROLES = ['Client', 'Co-owner', 'Contributor'];

/* ─── Modal Component ─── */
const Modal = ({ title, onClose, children, footer, width = '540px' }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 10000, padding: '10px',
  }}>
    <div style={{
      background: '#fff', borderRadius: '16px', width: '100%', maxWidth: width,
      maxHeight: 'calc(100vh - 20px)', display: 'flex', flexDirection: 'column',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, borderBottom: '1px solid #f3f4f6'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>{title}</h3>
        <button onClick={onClose} style={{ 
          background: 'none', border: '1px solid #f3f4f6', cursor: 'pointer', 
          padding: '6px', color: '#9ca3af', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s'
        }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
          <Icon d={ICONS.close} size={14} />
        </button>
      </div>
      <div style={{ 
        padding: '20px 24px', 
        overflowY: 'auto', 
        flex: 1,
      }} className="hide-scrollbar">
        {children}
      </div>
      {footer && (
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #f3f4f6', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          flexShrink: 0,
          background: '#fff'
        }}>
          {footer}
        </div>
      )}
    </div>
  </div>
);

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
  const [activeActionsDropdown, setActiveActionsDropdown] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const actionsRef = useRef(null);
  const roleRef = useRef(null);

  // Profile Modal State
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [inviteToWorkspace, setInviteToWorkspace] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveRoleDropdown(null);
      }
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setActiveActionsDropdown(null);
      }
      if (roleRef.current && !roleRef.current.contains(event.target)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = [
    { label: 'Contacts', count: members.length, color: '#1f2937' },
    { label: 'Pending',  count: members.filter(m => m.status === 'Pending').length, color: '#f97316' },
    { label: 'Active',   count: members.filter(m => m.status === 'Active').length, color: '#22c55e' },
    { label: 'Inactive', count: members.filter(m => m.status === 'Inactive').length, color: '#6b7280' },
  ];

  const fetchContacts = async () => {
    try {
      const res = await plutioContactsAPI.getAll();
      if (res.data.success) {
        setMembers(res.data.data.map(m => ({
          id: m._id,
          name: `${m.firstName} ${m.lastName}`.trim(),
          email: m.email,
          role: m.role,
          company: m.company,
          status: m.status,
          phone: m.phone,
          avatarColor: m.avatarColor
        })));
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await plutioContactsAPI.update(memberId, { role: newRole });
      if (res.data.success) {
        setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
    setActiveRoleDropdown(null);
  };

  const handleDeleteContact = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const res = await plutioContactsAPI.delete(memberId);
        if (res.data.success) {
          setMembers(members.filter(m => m.id !== memberId));
        }
      } catch (error) {
        console.error('Failed to delete contact:', error);
      }
    }
    setActiveActionsDropdown(null);
  };

  const handleCreateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!profileFirstName.trim()) return;
    
    try {
      const res = await plutioContactsAPI.create({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        email: profileEmail,
        phone: profilePhone,
        company: profileCompany,
        role: profileRole || 'Client',
        status: 'Active',
        avatarColor: TASK_SET_COLORS[Math.floor(Math.random() * TASK_SET_COLORS.length)]
      });
      
      if (res.data.success) {
        const newContact = res.data.data;
        const formattedMember = {
          id: newContact._id,
          name: `${newContact.firstName} ${newContact.lastName}`.trim(),
          email: newContact.email,
          role: newContact.role,
          company: newContact.company,
          status: newContact.status,
          phone: newContact.phone,
          avatarColor: newContact.avatarColor
        };
        setMembers(prev => [...prev, formattedMember]);
        
        setProfileFirstName('');
        setProfileLastName('');
        setProfileEmail('');
        setProfilePhone('');
        setProfileCompany('');
        setProfileRole('');
        setShowRoleDropdown(false);
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
      alert(error.response?.data?.message || 'Failed to create contact');
    }
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
                <tr 
                  key={member.id} 
                  style={{ borderBottom: '1px solid #f0f0f5', position: 'relative' }} 
                  onMouseEnter={() => {
                    e => e.currentTarget.style.background = '#fafafa';
                    setHoveredRow(member.id);
                  }} 
                  onMouseLeave={() => {
                    e => e.currentTarget.style.background = 'none';
                    setHoveredRow(null);
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" style={{ accentColor: '#6d28d9' }} />
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', borderLeft: '1px solid #f0f0f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: member.avatarColor || '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '700' }}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{member.name}</span>
                      
                      {/* Three dots on hover */}
                      {(hoveredRow === member.id || activeActionsDropdown === member.id) && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionsDropdown(activeActionsDropdown === member.id ? null : member.id);
                          }}
                          style={{ 
                            marginLeft: 'auto', cursor: 'pointer', padding: '4px', borderRadius: '4px',
                            background: activeActionsDropdown === member.id ? '#f3f4f6' : 'transparent',
                            display: 'flex', alignItems: 'center'
                          }}
                        >
                          <Icon d={ICONS.dots} size={16} color="#9ca3af" />
                        </div>
                      )}

                      {/* Actions Dropdown */}
                      {activeActionsDropdown === member.id && (
                        <div 
                          ref={actionsRef}
                          style={{
                            position: 'absolute', top: '100%', left: '100px', marginTop: '4px',
                            background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            border: '1px solid #f0f0f7', width: '220px', zIndex: 1001, padding: '8px'
                          }}
                        >
                          {/* Color strip */}
                          <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', marginBottom: '4px' }}>
                            {['#6366f1', '#4b5563', '#22c55e', '#f97316', '#eab308', '#3b82f6'].map(c => (
                              <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />
                            ))}
                          </div>

                          {[
                            { label: 'Edit contact', icon: 'edit' },
                            { label: 'Pin to menu',  icon: 'pin' },
                            { label: 'View as',      icon: 'view' },
                            { label: 'Deactivate',   icon: 'deactivate' },
                            { label: 'Archive contact', icon: 'archive' },
                            { label: 'Delete contact', icon: 'delete', color: '#ef4444' },
                          ].map((act) => (
                            <button
                              key={act.label}
                              onClick={() => {
                                if (act.label === 'Delete contact') {
                                  handleDeleteContact(member.id);
                                } else {
                                  setActiveActionsDropdown(null);
                                }
                              }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', borderRadius: '8px', border: 'none',
                                background: 'none', cursor: 'pointer', fontSize: '13px',
                                color: act.color || '#374151', textAlign: 'left',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            >
                              <Icon d={ICONS[act.icon]} size={14} color={act.color || "#6b7280"} />
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
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
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb',
                      borderRadius: '6px', color: '#4b5563', fontSize: '13px', fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon d={ICONS.plus} size={14} />
                    Add someone
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Profile Modal */}
        {showProfileModal && (
          <Modal 
            title="Create profile" 
            onClose={() => setShowProfileModal(false)}
            footer={(
              <button 
                onClick={handleCreateProfile}
                disabled={!profileFirstName.trim()}
                style={{
                  background: profileFirstName.trim() ? '#22c55e' : '#e5e7eb',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '12px 28px', fontSize: '14px', fontWeight: '700',
                  cursor: profileFirstName.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                Create <Icon d={ICONS.enter} size={14} color="#fff" />
              </button>
            )}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>First name*</label>
                  <input 
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    placeholder="First name"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #f3f4f6', fontSize: '14px', outline: 'none', background: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>Last name</label>
                  <input 
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    placeholder="Last name"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #f3f4f6', fontSize: '14px', outline: 'none', background: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>User role</label>
                <div 
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #f3f4f6', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}
                >
                  <span style={{ color: profileRole ? '#1f2937' : '#9ca3af' }}>{profileRole || 'Select role'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon d={ICONS.help} size={14} color="#3b82f6" />
                    <Icon d={ICONS.chevDown} size={14} color="#9ca3af" />
                  </div>
                </div>
                {showRoleDropdown && (
                  <div 
                    ref={roleRef}
                    style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', zIndex: 1001, overflow: 'hidden' }}
                  >
                    {ROLES.map(role => (
                      <div 
                        key={role}
                        onClick={() => { setProfileRole(role); setShowRoleDropdown(false); }}
                        style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '14px', color: profileRole === role ? '#6d28d9' : '#374151', background: profileRole === role ? '#f5f3ff' : '#fff' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = profileRole === role ? '#f5f3ff' : '#fff'}
                      >
                        {role}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>Email address</label>
                <input 
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="Email address"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #f3f4f6', fontSize: '14px', outline: 'none', background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>Phone number</label>
                <input 
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Phone number"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #f3f4f6', fontSize: '14px', outline: 'none', background: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>Company name</label>
                  <input 
                    value={profileCompany}
                    onChange={(e) => setProfileCompany(e.target.value)}
                    placeholder="Company name"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #f3f4f6', fontSize: '14px', outline: 'none', background: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px' }}>Role</label>
                  <input 
                    value={profileRole}
                    readOnly
                    placeholder="Role"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #f3f4f6', fontSize: '14px', outline: 'none', background: '#f9fafb', color: '#9ca3af' }}
                  />
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderRadius: '10px', border: '1px dashed #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon d={ICONS.plus} size={14} color="#9ca3af" />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>Add custom field</span>
                </div>
                <Icon d={ICONS.help} size={14} color="#3b82f6" />
              </div>

              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>More options</span>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div onClick={() => setIsManager(!isManager)} style={{ cursor: 'pointer' }}>
                        <Icon d={isManager ? ICONS.toggleOn : ICONS.toggleOff} size={32} color={isManager ? '#22c55e' : '#d1d5db'} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>Manager</span>
                      <Icon d={ICONS.help} size={14} color="#3b82f6" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div onClick={() => setInviteToWorkspace(!inviteToWorkspace)} style={{ cursor: 'pointer' }}>
                        <Icon d={inviteToWorkspace ? ICONS.toggleOn : ICONS.toggleOff} size={32} color={inviteToWorkspace ? '#22c55e' : '#d1d5db'} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>Invite to workspace</span>
                      <Icon d={ICONS.help} size={14} color="#3b82f6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PlutioCopyLayout>
  );
};

export default Contacts;
