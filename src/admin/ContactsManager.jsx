import { useState, useEffect } from 'react';
import { contactsAPI } from '../services/api';

const API_BASE = '/api';

const ContactsManager = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [sourceFilter, setSourceFilter] = useState('all'); // all, Contact Page, Landing Page, Landing Page 2
  const [searchQuery, setSearchQuery] = useState('');
  const [mainTab, setMainTab] = useState('all'); // all, lp1, lp2, lp3, contact
  const [lp3SubTab, setLp3SubTab] = useState('all'); // all, hero, plan1, plan2, contactForm
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [initialNotificationSettings, setInitialNotificationSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Check if settings have changed
  const hasSettingsChanged = () => {
    if (!notificationSettings || !initialNotificationSettings) return false;
    return JSON.stringify(notificationSettings) !== JSON.stringify(initialNotificationSettings);
  };

  useEffect(() => {
    fetchContacts();
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const settings = data.data.contactNotification || {
          enabled: false,
          adminNumbers: [],
          reminderInterval: 5,
          maxReminders: 0,
        };
        setNotificationSettings(settings);
        setInitialNotificationSettings(JSON.parse(JSON.stringify(settings)));
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const saveNotificationSettings = async () => {
    setSavingSettings(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactNotification: notificationSettings }),
      });
      const data = await res.json();
      if (data.success) {
        setInitialNotificationSettings(JSON.parse(JSON.stringify(notificationSettings)));
        alert('Settings saved successfully!');
      } else {
        alert('Error saving settings');
      }
    } catch (error) {
      alert('Error saving settings');
    }
    setSavingSettings(false);
  };

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getAll();
      setContacts(response.data.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await contactsAPI.update(id, { read: true });
      setContacts(contacts.map(c => c._id === id ? { ...c, read: true } : c));
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleMarkAsUnread = async (id) => {
    try {
      await contactsAPI.update(id, { read: false });
      setContacts(contacts.map(c => c._id === id ? { ...c, read: false } : c));
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await contactsAPI.delete(id);
        setSelectedContact(null);
        fetchContacts();
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    // Read/Unread filter
    if (filter === 'unread' && contact.read) return false;
    if (filter === 'read' && !contact.read) return false;

    // Main tab filter
    if (mainTab !== 'all') {
      switch (mainTab) {
        case 'lp1':
          if (contact.sourcePage !== 'Landing Page' && contact.sourcePage !== 'Landing Page 1') return false;
          break;
        case 'lp2':
          if (contact.sourcePage !== 'Landing Page 2') return false;
          break;
        case 'lp3':
          if (!contact.sourcePage?.startsWith('LP3') && contact.sourcePage !== 'Landing Page 3') return false;
          // LP3 sub-tab filter
          if (lp3SubTab !== 'all') {
            switch (lp3SubTab) {
              case 'hero':
                if (contact.sourcePage !== 'LP3 - Hero Button') return false;
                break;
              case 'plan1':
                if (contact.sourcePage !== 'LP3 - Plan 1 Button') return false;
                break;
              case 'plan2':
                if (contact.sourcePage !== 'LP3 - Plan 2 Button') return false;
                break;
              case 'contactForm':
                if (contact.sourcePage !== 'LP3 - Contact Form') return false;
                break;
            }
          }
          break;
        case 'contact':
          if (contact.sourcePage !== 'Contact Page' && contact.sourcePage) return false;
          break;
      }
    }

    // Legacy source filter (dropdown) - only applies when mainTab is 'all'
    if (mainTab === 'all' && sourceFilter !== 'all' && contact.sourcePage !== sourceFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.subject?.toLowerCase().includes(query) ||
        contact.message?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Count stats
  const unreadCount = contacts.filter(c => !c.read).length;
  const totalCount = contacts.length;

  // Source counts for main tabs
  const mainTabCounts = {
    all: contacts.length,
    lp1: contacts.filter(c => c.sourcePage === 'Landing Page' || c.sourcePage === 'Landing Page 1').length,
    lp2: contacts.filter(c => c.sourcePage === 'Landing Page 2').length,
    lp3: contacts.filter(c => c.sourcePage?.startsWith('LP3') || c.sourcePage === 'Landing Page 3').length,
    contact: contacts.filter(c => c.sourcePage === 'Contact Page' || !c.sourcePage).length,
  };

  // LP3 sub-tab counts
  const lp3SubCounts = {
    all: contacts.filter(c => c.sourcePage?.startsWith('LP3') || c.sourcePage === 'Landing Page 3').length,
    hero: contacts.filter(c => c.sourcePage === 'LP3 - Hero Button').length,
    plan1: contacts.filter(c => c.sourcePage === 'LP3 - Plan 1 Button').length,
    plan2: contacts.filter(c => c.sourcePage === 'LP3 - Plan 2 Button').length,
    contactForm: contacts.filter(c => c.sourcePage === 'LP3 - Contact Form').length,
  };

  // Legacy source counts (keep for dropdown compatibility)
  const sourceStats = {
    'Contact Page': contacts.filter(c => c.sourcePage === 'Contact Page' || !c.sourcePage).length,
    'Landing Page': contacts.filter(c => c.sourcePage === 'Landing Page').length,
    'Landing Page 2': contacts.filter(c => c.sourcePage === 'Landing Page 2').length,
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getSourceColor = (sourcePage) => {
    // LP3 sources
    if (sourcePage?.startsWith('LP3')) {
      switch (sourcePage) {
        case 'LP3 - Hero Button':
          return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
        case 'LP3 - Plan 1 Button':
          return { bg: '#FEF9C3', text: '#A16207', border: '#FDE047' };
        case 'LP3 - Plan 2 Button':
          return { bg: '#E0E7FF', text: '#4338CA', border: '#A5B4FC' };
        case 'LP3 - Contact Form':
          return { bg: '#FCE7F3', text: '#BE185D', border: '#F9A8D4' };
        default:
          return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
      }
    }

    switch (sourcePage) {
      case 'Landing Page 2':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'Landing Page':
      case 'Landing Page 1':
        return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
      case 'Landing Page 3':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'Contact Page':
      default:
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#6b7280',
      }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Contact Messages
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} • {totalCount} total messages
          </p>
        </div>

        {/* Search and Settings */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <svg
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: showSettings ? '2px solid #2563eb' : '1px solid #e5e7eb',
              backgroundColor: showSettings ? '#EFF6FF' : '#fff',
              color: showSettings ? '#2563eb' : '#374151',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && notificationSettings && (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                WhatsApp Notification Settings
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Send WhatsApp notifications to admins when contact form is submitted
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={notificationSettings.enabled || false}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Enable</span>
              </label>
              <button
                onClick={saveNotificationSettings}
                disabled={savingSettings || !hasSettingsChanged()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: hasSettingsChanged() ? '#2563eb' : '#9ca3af',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: (savingSettings || !hasSettingsChanged()) ? 'not-allowed' : 'pointer',
                  opacity: (savingSettings || !hasSettingsChanged()) ? 0.7 : 1,
                }}
              >
                {savingSettings ? 'Saving...' : hasSettingsChanged() ? 'Save Settings' : 'Saved'}
              </button>
            </div>
          </div>

          {notificationSettings.enabled && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              {/* Admin WhatsApp Numbers */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    Admin WhatsApp Numbers (Max 10)
                  </label>
                  <button
                    onClick={() => {
                      if ((notificationSettings.adminNumbers || []).length >= 10) {
                        alert('Maximum 10 admin numbers allowed');
                        return;
                      }
                      setNotificationSettings(prev => ({
                        ...prev,
                        adminNumbers: [...(prev.adminNumbers || []), '']
                      }));
                    }}
                    disabled={(notificationSettings.adminNumbers || []).length >= 10}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: (notificationSettings.adminNumbers || []).length >= 10 ? '#9ca3af' : '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: (notificationSettings.adminNumbers || []).length >= 10 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    + Add Number
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                  Add WhatsApp numbers with country code (e.g., 919876543210)
                </p>

                {(notificationSettings.adminNumbers || []).length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    No admin numbers added. Click "+ Add Number" to add WhatsApp numbers.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                    {(notificationSettings.adminNumbers || []).map((number, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280', minWidth: '24px' }}>{index + 1}.</span>
                        <input
                          type="text"
                          placeholder="e.g., 919876543210"
                          value={number}
                          onChange={(e) => {
                            const updated = [...(notificationSettings.adminNumbers || [])];
                            updated[index] = e.target.value.replace(/\D/g, ''); // Only allow digits
                            setNotificationSettings(prev => ({ ...prev, adminNumbers: updated }));
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            fontSize: '14px',
                          }}
                        />
                        <button
                          onClick={() => {
                            const updated = (notificationSettings.adminNumbers || []).filter((_, i) => i !== index);
                            setNotificationSettings(prev => ({ ...prev, adminNumbers: updated }));
                          }}
                          style={{
                            padding: '10px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminder Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Reminder Interval */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                    Reminder Interval
                  </label>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
                    Send reminders until admin clicks "Ok"
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      value={
                        [0, 2, 5, 10].includes(notificationSettings.reminderInterval)
                          ? notificationSettings.reminderInterval ?? 5
                          : 'custom'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setNotificationSettings(prev => ({ ...prev, reminderInterval: parseInt(val) }));
                        } else {
                          setNotificationSettings(prev => ({ ...prev, reminderInterval: 3 }));
                        }
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px',
                        minWidth: '160px',
                      }}
                    >
                      <option value={0}>No reminders</option>
                      <option value={2}>Every 2 minutes</option>
                      <option value={5}>Every 5 minutes</option>
                      <option value={10}>Every 10 minutes</option>
                      <option value="custom">Custom</option>
                    </select>

                    {![0, 2, 5, 10].includes(notificationSettings.reminderInterval) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          min={1}
                          value={notificationSettings.reminderInterval ?? 5}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setNotificationSettings(prev => ({ ...prev, reminderInterval: Math.max(1, val) }));
                          }}
                          style={{
                            width: '70px',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            fontSize: '14px',
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>min</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Max Reminders */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                    Maximum Reminders
                  </label>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
                    Limit reminders (0 = unlimited)
                  </p>
                  <select
                    value={notificationSettings.maxReminders ?? 0}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, maxReminders: parseInt(e.target.value) }))}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      minWidth: '160px',
                    }}
                  >
                    <option value={0}>Unlimited</option>
                    <option value={3}>3 reminders</option>
                    <option value={5}>5 reminders</option>
                    <option value={10}>10 reminders</option>
                    <option value={20}>20 reminders</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Hidden when settings is open */}
      {!showSettings && (
        <>
          {/* Main Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '12px',
          }}>
            {[
              { value: 'all', label: 'All', count: mainTabCounts.all },
              { value: 'lp1', label: 'Landing Page 1', count: mainTabCounts.lp1 },
              { value: 'lp2', label: 'Landing Page 2', count: mainTabCounts.lp2 },
              { value: 'lp3', label: 'Landing Page 3', count: mainTabCounts.lp3 },
              { value: 'contact', label: 'Contact Page', count: mainTabCounts.contact },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  setMainTab(tab.value);
                  setLp3SubTab('all');
                  setSourceFilter('all');
                }}
                style={{
                  padding: '8px 16px',
              borderRadius: '8px',
              border: mainTab === tab.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
              fontSize: '13px',
              fontWeight: mainTab === tab.value ? 600 : 400,
              backgroundColor: mainTab === tab.value ? '#EFF6FF' : '#fff',
              color: mainTab === tab.value ? '#2563eb' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
            <span style={{
              backgroundColor: mainTab === tab.value ? '#2563eb' : '#e5e7eb',
              color: mainTab === tab.value ? '#fff' : '#6b7280',
              padding: '2px 8px',
              borderRadius: '100px',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* LP3 Sub-tabs (only show when LP3 is selected) */}
      {mainTab === 'lp3' && (
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '12px',
          paddingLeft: '8px',
        }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', alignSelf: 'center', marginRight: '4px' }}>Filter by:</span>
          {[
            { value: 'all', label: 'All', count: lp3SubCounts.all },
            { value: 'hero', label: 'Hero Button', count: lp3SubCounts.hero },
            { value: 'plan1', label: 'Plan 1 Button', count: lp3SubCounts.plan1 },
            { value: 'plan2', label: 'Plan 2 Button', count: lp3SubCounts.plan2 },
            { value: 'contactForm', label: 'Contact Form', count: lp3SubCounts.contactForm },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setLp3SubTab(tab.value)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: lp3SubTab === tab.value ? '1.5px solid #15803D' : '1px solid #e5e7eb',
                fontSize: '12px',
                fontWeight: lp3SubTab === tab.value ? 600 : 400,
                backgroundColor: lp3SubTab === tab.value ? '#DCFCE7' : '#fff',
                color: lp3SubTab === tab.value ? '#15803D' : '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              <span style={{
                backgroundColor: lp3SubTab === tab.value ? '#15803D' : '#f3f4f6',
                color: lp3SubTab === tab.value ? '#fff' : '#6b7280',
                padding: '1px 6px',
                borderRadius: '100px',
                fontSize: '10px',
                fontWeight: 600,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        {/* Read/Unread Filter */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: `Unread (${unreadCount})` },
            { value: 'read', label: 'Read' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '13px',
                fontWeight: filter === opt.value ? 600 : 400,
                backgroundColor: filter === opt.value ? '#fff' : 'transparent',
                color: filter === opt.value ? '#111827' : '#6b7280',
                cursor: 'pointer',
                boxShadow: filter === opt.value ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedContact ? '400px 1fr' : '1fr',
        gap: '20px',
        flex: 1,
        overflow: 'hidden',
      }}>
        {/* Messages List */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafafa',
          }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              {filteredContacts.length} message{filteredContacts.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => fetchContacts()}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Refresh"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredContacts.length === 0 ? (
              <div style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: '#6b7280',
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.5 }}>
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <p style={{ fontWeight: 500 }}>No messages found</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>
                  {searchQuery ? 'Try a different search term' : 'Messages will appear here'}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const sourceColor = getSourceColor(contact.sourcePage);
                const isSelected = selectedContact?._id === contact._id;
                const isUnread = !contact.read;

                return (
                  <div
                    key={contact._id}
                    onClick={() => {
                      setSelectedContact(contact);
                      if (!contact.read) {
                        handleMarkAsRead(contact._id);
                      }
                    }}
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: isSelected ? '#EFF6FF' : isUnread ? '#FAFBFF' : '#fff',
                      borderLeft: isUnread ? '3px solid #2563eb' : '3px solid transparent',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = isUnread ? '#FAFBFF' : '#fff';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        {/* Unread indicator dot */}
                        {isUnread && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#2563eb',
                            flexShrink: 0,
                          }} />
                        )}
                        <span style={{
                          fontWeight: isUnread ? 700 : 500,
                          color: isUnread ? '#111827' : '#374151',
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {contact.name}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        color: isUnread ? '#111827' : '#9ca3af',
                        fontWeight: isUnread ? 600 : 400,
                        flexShrink: 0,
                        marginLeft: '8px',
                      }}>
                        {formatDate(contact.createdAt)}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '13px',
                      color: isUnread ? '#374151' : '#6b7280',
                      fontWeight: isUnread ? 500 : 400,
                      marginBottom: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {contact.subject || 'No subject'}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '100px',
                        backgroundColor: sourceColor.bg,
                        color: sourceColor.text,
                        border: `1px solid ${sourceColor.border}`,
                        fontWeight: 500,
                      }}>
                        {contact.sourcePage || 'Contact Page'}
                      </span>
                      {contact.source && (
                        <span style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                        }}>
                          via {contact.source}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message Detail */}
        {selectedContact && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Detail Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: '#fafafa',
            }}>
              <div>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '4px',
                }}>
                  {selectedContact.subject || 'No subject'}
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  From: <strong>{selectedContact.name}</strong> &lt;{selectedContact.email}&gt;
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => selectedContact.read ? handleMarkAsUnread(selectedContact._id) : handleMarkAsRead(selectedContact._id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title={selectedContact.read ? 'Mark as unread' : 'Mark as read'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {selectedContact.read ? (
                      <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
                    ) : (
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />
                    )}
                  </svg>
                  {selectedContact.read ? 'Mark unread' : 'Mark read'}
                </button>
                <button
                  onClick={() => handleDelete(selectedContact._id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
                  </svg>
                  Delete
                </button>
                <button
                  onClick={() => setSelectedContact(null)}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Contact Info Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Email</div>
                  <a href={`mailto:${selectedContact.email}`} style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '14px',
                  }}>
                    {selectedContact.email}
                  </a>
                </div>

                {selectedContact.phone && (
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Phone</div>
                    <a href={`tel:${selectedContact.phone}`} style={{
                      color: '#2563eb',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: '14px',
                    }}>
                      {selectedContact.phone}
                    </a>
                  </div>
                )}

                {selectedContact.company && (
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Company</div>
                    <div style={{ fontWeight: 500, fontSize: '14px', color: '#111827' }}>
                      {selectedContact.company}
                    </div>
                  </div>
                )}

                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Source</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '13px',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      backgroundColor: getSourceColor(selectedContact.sourcePage).bg,
                      color: getSourceColor(selectedContact.sourcePage).text,
                      border: `1px solid ${getSourceColor(selectedContact.sourcePage).border}`,
                      fontWeight: 500,
                    }}>
                      {selectedContact.sourcePage || 'Contact Page'}
                    </span>
                    {selectedContact.source && (
                      <span style={{
                        fontSize: '13px',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        backgroundColor: '#E1FFA0',
                        color: '#166534',
                        fontWeight: 500,
                      }}>
                        {selectedContact.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div style={{
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>Message</div>
                <p style={{
                  whiteSpace: 'pre-wrap',
                  color: '#374151',
                  lineHeight: 1.7,
                  fontSize: '15px',
                }}>
                  {selectedContact.message}
                </p>
              </div>

              {/* Timestamp */}
              <div style={{
                marginTop: '16px',
                fontSize: '13px',
                color: '#9ca3af',
                textAlign: 'right',
              }}>
                Received: {new Date(selectedContact.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default ContactsManager;
