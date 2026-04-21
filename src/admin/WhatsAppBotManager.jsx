import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Routes, Route } from 'react-router-dom';
import { whatsappFlowsAPI, uploadAPI } from '../services/api';
import FlowBuilder from './whatsappBot/FlowBuilder';

const API_BASE = '/api';

// Trigger type labels
const triggerLabels = {
  new_booking: 'New Booking',
  booking_confirmed: 'Booking Confirmed',
  booking_denied: 'Booking Denied',
  reschedule_request: 'Reschedule Request',
  user_message: 'User Message',
  button_click: 'Button Click',
  keyword: 'Keyword Match',
  scheduled: 'Scheduled',
  manual: 'Manual Trigger',
};

// Main WhatsApp Bot Manager
const WhatsAppBotManager = ({ basePath }) => {
  return (
    <Routes>
      <Route index element={<FlowsList basePath={basePath} />} />
      <Route path="new" element={<FlowBuilder basePath={basePath} />} />
      <Route path=":flowId/edit" element={<FlowBuilder basePath={basePath} />} />
    </Routes>
  );
};

// Standalone popup — must be outside FlowsList so React doesn't remount it on every keystroke
const AddPopup = ({ title, form, setForm, formErrors, setFormErrors, onSave, saving, onClose }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
    <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>✕</button>
      </div>
      {[
        { key: 'name', label: 'Name', placeholder: 'Enter full name', type: 'text', maxLength: undefined },
        { key: 'phone', label: 'Mobile', placeholder: 'Enter 10-digit number', type: 'tel', maxLength: 10 },
        { key: 'email', label: 'Email', placeholder: 'Enter email address', type: 'email', maxLength: undefined },
      ].map(field => (
        <div key={field.key} style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            {field.label} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={form[field.key]}
            maxLength={field.maxLength}
            onChange={e => {
              const val = field.key === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
              setForm(p => ({ ...p, [field.key]: val }));
              setFormErrors(p => ({ ...p, [field.key]: '' }));
            }}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${formErrors[field.key] ? '#dc2626' : '#e5e7eb'}`, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
          />
          {formErrors[field.key] && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0 0' }}>{formErrors[field.key]}</p>}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 14, background: '#fff' }}>Cancel</button>
        <button onClick={onSave} disabled={saving} style={{ flex: 1, padding: '11px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  </div>
);

// Flows List Component
const FlowsList = ({ basePath }) => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Main tab: 'flow' | 'reminder'
  const [mainTab, setMainTab] = useState('flow');
  // Reminder sub-tab: 'admin' | 'client'
  const [reminderTab, setReminderTab] = useState('admin');
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);

  // Reminder system state
  const [allowedNumbers, setAllowedNumbers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [reminderCounts, setReminderCounts] = useState({}); // phone → count

  // Admin detail view
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminReminders, setAdminReminders] = useState([]);
  const [loadingAdminReminders, setLoadingAdminReminders] = useState(false);
  const [adminDetailTab, setAdminDetailTab] = useState('list');
  const [adminCalendarMonth, setAdminCalendarMonth] = useState(new Date());
  const [tooltip, setTooltip] = useState(null); // { x, y, type:'client'|'reminder', ...fields }

  // Search & filter state
  const [adminSearch, setAdminSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Popup modals
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [showClientPopup, setShowClientPopup] = useState(false);
  const emptyForm = { name: '', phone: '', email: '' };
  const [adminForm, setAdminForm] = useState(emptyForm);
  const [clientForm, setClientForm] = useState(emptyForm);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Meeting Reminders state
  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState({
    reminder1: { enabled: true, minutesBefore: 120, messageToUser: '', messageToAdmin: '', showButtons: true },
    reminder2: { enabled: true, minutesBefore: 30, messageToUser: '', messageToAdmin: '', showButtons: true },
    reminder3: { enabled: false, minutesBefore: 10, messageToUser: '', messageToAdmin: '', showButtons: false },
  });
  const [initialReminders, setInitialReminders] = useState(null);
  const [savingReminders, setSavingReminders] = useState(false);

  // Check if reminders have unsaved changes
  const hasReminderChanges = initialReminders && JSON.stringify(reminders) !== JSON.stringify(initialReminders);

  // Scheduled Content state
  const [showScheduledContent, setShowScheduledContent] = useState(false);
  const [scheduledContent, setScheduledContent] = useState({
    enabled: false,
    startTime: '19:00',
    endTime: '21:00',
    items: [],
  });
  const [initialScheduledContent, setInitialScheduledContent] = useState(null);
  const [savingScheduledContent, setSavingScheduledContent] = useState(false);

  // Check if scheduled content has unsaved changes
  const hasScheduledContentChanges = initialScheduledContent && JSON.stringify(scheduledContent) !== JSON.stringify(initialScheduledContent);

  useEffect(() => {
    fetchFlows();
    fetchTemplates();
    fetchReminders();
    fetchScheduledContent();
    fetchAllowedNumbers();
    fetchContacts();
  }, []);

  const fetchAllReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reminders`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAllReminders(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAllowedNumbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const [adminsRes, remindersRes] = await Promise.all([
        fetch(`${API_BASE}/reminders/allowed-numbers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/reminders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const adminsData = await adminsRes.json();
      const remindersData = await remindersRes.json();
      setAllowedNumbers(adminsData.data || []);
      const counts = {};
      (remindersData.data || []).forEach(r => {
        const key = (r.fromPhone || '').replace(/\D/g, '').slice(-10);
        counts[key] = (counts[key] || 0) + 1;
      });
      setReminderCounts(counts);
    } catch (e) { console.error(e); }
  };

  const handleToggleAdmin = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/reminders/allowed-numbers/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setAllowedNumbers(prev => prev.map(u => u._id === id ? { ...u, isActive: data.data.isActive } : u));
    }
  };

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reminders/contacts`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setContacts(data.data || []);
    } catch (e) { console.error(e); }
  };

  const validateForm = (form) => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.phone.trim()) errors.phone = 'Mobile is required';
    else if (!/^\d{10}$/.test(form.phone)) errors.phone = 'Enter a valid 10-digit number';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email';
    return errors;
  };

  const handleAddAdmin = async () => {
    const errors = validateForm(adminForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSavingAdmin(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/reminders/allowed-numbers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });
      setAdminForm(emptyForm);
      setFormErrors({});
      setShowAdminPopup(false);
      fetchAllowedNumbers();
    } catch (e) { console.error(e); }
    setSavingAdmin(false);
  };

  const handleDeleteAdmin = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/reminders/allowed-numbers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAllowedNumbers();
  };

  const handleAddContact = async () => {
    const errors = validateForm(clientForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSavingClient(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/reminders/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm),
      });
      setClientForm(emptyForm);
      setFormErrors({});
      setShowClientPopup(false);
      fetchContacts();
    } catch (e) { console.error(e); }
    setSavingClient(false);
  };

  const handleDeleteContact = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/reminders/contacts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchContacts();
  };

  const handleDeleteReminder = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/reminders/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setAdminReminders(p => p.filter(r => r._id !== id));
  };

  const fetchAdminReminders = async (phone) => {
    setLoadingAdminReminders(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reminders`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAdminReminders((data.data || []).filter(r => (r.fromPhone || '').replace(/\D/g, '').slice(-10) === (phone || '').replace(/\D/g, '').slice(-10)));
    } catch (e) { console.error(e); }
    setLoadingAdminReminders(false);
  };

  const handleOpenAdmin = (admin) => {
    setSelectedAdmin(admin);
    setAdminDetailTab('list');
    setAdminCalendarMonth(new Date());
    fetchAdminReminders(admin.phone);
  };

  // AddPopup is defined outside FlowsList (top-level) to prevent remount on each keystroke

  const fetchFlows = async () => {
    try {
      const res = await whatsappFlowsAPI.getAll();
      setFlows(res.data.data || []);
    } catch (error) {
      console.error('Error fetching flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await whatsappFlowsAPI.getTemplates();
      setTemplates(res.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleToggle = async (flowId) => {
    try {
      await whatsappFlowsAPI.toggle(flowId);
      fetchFlows();
    } catch (error) {
      console.error('Error toggling flow:', error);
    }
  };

  const handleDuplicate = async (flowId) => {
    try {
      await whatsappFlowsAPI.duplicate(flowId);
      fetchFlows();
    } catch (error) {
      console.error('Error duplicating flow:', error);
    }
  };

  const handleDelete = async (flowId) => {
    setDeleting(true);
    try {
      await whatsappFlowsAPI.delete(flowId);
      setShowDeleteModal(null);
      fetchFlows();
    } catch (error) {
      console.error('Error deleting flow:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateFromTemplate = async (templateId) => {
    try {
      const res = await whatsappFlowsAPI.createFromTemplate(templateId, {});
      setShowTemplateModal(false);
      navigate(`${basePath}/${res.data.data._id}/edit`);
    } catch (error) {
      console.error('Error creating from template:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.meetingReminders) {
        setReminders(data.data.meetingReminders);
        setInitialReminders(data.data.meetingReminders);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const saveReminders = async () => {
    setSavingReminders(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingReminders: reminders }),
      });
      const data = await res.json();
      if (data.success) {
        setInitialReminders(reminders);
        alert('Reminders saved successfully!');
      } else {
        alert('Failed to save reminders');
      }
    } catch (error) {
      console.error('Error saving reminders:', error);
      alert('Failed to save reminders');
    } finally {
      setSavingReminders(false);
    }
  };

  const fetchScheduledContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.autoMessages) {
        setScheduledContent(data.data.autoMessages);
        setInitialScheduledContent(data.data.autoMessages);
      }
    } catch (error) {
      console.error('Error fetching scheduled content:', error);
    }
  };

  const saveScheduledContent = async () => {
    setSavingScheduledContent(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/meeting-settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoMessages: scheduledContent }),
      });
      const data = await res.json();
      if (data.success) {
        setInitialScheduledContent(scheduledContent);
        alert('Scheduled content saved successfully!');
      } else {
        alert('Failed to save scheduled content');
      }
    } catch (error) {
      console.error('Error saving scheduled content:', error);
      alert('Failed to save scheduled content');
    } finally {
      setSavingScheduledContent(false);
    }
  };

  const addScheduledItem = () => {
    setScheduledContent(prev => ({
      ...prev,
      items: [...(prev.items || []), {
        text: '',
        mediaType: 'video',
        mediaUrl: '',
        filename: '',
        delayHours: 6, // Default: send 6 hours after booking
        order: (prev.items?.length || 0),
      }]
    }));
  };

  const updateScheduledItem = (index, field, value) => {
    setScheduledContent(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeScheduledItem = (index) => {
    setScheduledContent(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Upload state for scheduled content items
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const fileInputRefs = useRef({});
  const reminderDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (reminderDropdownRef.current && !reminderDropdownRef.current.contains(e.target)) {
        setShowReminderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleScheduledFileUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size based on type
    const maxSizes = {
      video: 16 * 1024 * 1024, // 16MB
      image: 5 * 1024 * 1024,  // 5MB
      document: 100 * 1024 * 1024, // 100MB
    };
    const mediaType = scheduledContent.items[index]?.mediaType || 'video';
    const maxSize = maxSizes[mediaType] || maxSizes.video;

    if (file.size > maxSize) {
      alert(`File too large! Maximum size for ${mediaType}: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.uploadFile(formData);

      // Update the item with the uploaded URL
      updateScheduledItem(index, 'mediaUrl', res.data.url);

      // Also store original filename for documents
      if (mediaType === 'document' && !scheduledContent.items[index]?.filename) {
        updateScheduledItem(index, 'filename', file.name);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploadingIndex(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div style={{ color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>WhatsApp Bot</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Manage flows and AI reminders</p>
        </div>
        {mainTab === 'flow' && (
          <button
            onClick={() => navigate(`${basePath}/new`)}
            style={{ padding: '10px 20px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Flow
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e5e7eb', paddingBottom: 0 }}>
        {/* Flow tab */}
        <button
          onClick={() => { setMainTab('flow'); setShowReminderDropdown(false); }}
          style={{
            padding: '10px 24px', background: 'none', border: 'none',
            borderBottom: mainTab === 'flow' ? '2px solid #25D366' : '2px solid transparent',
            marginBottom: -2, fontWeight: mainTab === 'flow' ? 700 : 500,
            color: mainTab === 'flow' ? '#25D366' : '#6b7280', cursor: 'pointer', fontSize: 15,
          }}
        >
          Flow
        </button>

      </div>

      {/* ==================== FLOW TAB ==================== */}
      {mainTab === 'flow' && <>

      {/* Flows Grid */}
      {flows.length === 0 ? (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 60,
          textAlign: 'center',
          border: '2px dashed #e5e7eb',
        }}>
          <div style={{ marginBottom: 16 }}>
            <svg width="48" height="48" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            No flows yet
          </h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            Create your first WhatsApp conversation flow to automate booking communications.
          </p>
          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              padding: '10px 24px',
              backgroundColor: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Start with a Template
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {flows.map((flow) => (
            <div
              key={flow._id}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: flow.isActive ? '2px solid #25D366' : '1px solid #e5e7eb',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Flow Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                      {flow.name}
                    </h3>
                    {flow.isActive && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: '#25D366',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                    {flow.description || 'No description'}
                  </p>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(flow._id)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: flow.isActive ? '#25D366' : '#e5e7eb',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: flow.isActive ? 23 : 3,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>

              {/* Trigger Badge */}
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#7c3aed',
                  backgroundColor: '#ede9fe',
                  padding: '4px 10px',
                  borderRadius: 6,
                }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {triggerLabels[flow.trigger?.type] || flow.trigger?.type}
                </span>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{flow.stats?.totalRuns || 0}</span> runs
                </div>
                <div>
                  <span style={{ fontWeight: 500 }}>{flow.stats?.completedRuns || 0}</span> completed
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => navigate(`${basePath}/${flow._id}/edit`)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(flow._id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                  title="Duplicate"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteModal(flow._id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                  title="Delete"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meeting Reminders Section */}
      <div style={{ marginTop: 32 }}>
        <div
          onClick={() => setShowReminders(!showReminders)}
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="20" height="20" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                  Meeting Reminders
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  Send reminder messages before confirmed meetings
                </p>
              </div>
            </div>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="#9ca3af"
              viewBox="0 0 24 24"
              style={{ transform: showReminders ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {showReminders && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '0 0 12px 12px',
            padding: 20,
            marginTop: -10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
          }}>
            {/* Reminder 1 */}
            <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reminders.reminder1?.enabled ?? true}
                    onChange={(e) => setReminders(prev => ({
                      ...prev,
                      reminder1: { ...prev.reminder1, enabled: e.target.checked }
                    }))}
                    style={{ width: 16, height: 16, marginRight: 8 }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Reminder 1</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={reminders.reminder1?.minutesBefore ?? 120}
                    onChange={(e) => setReminders(prev => ({
                      ...prev,
                      reminder1: { ...prev.reminder1, minutesBefore: parseInt(e.target.value) }
                    }))}
                    min={1}
                    style={{ width: 80, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                  />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>min before</span>
                </div>
              </div>
              {reminders.reminder1?.enabled !== false && (
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                  Uses template: <code style={{ backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: 4 }}>meeting_reminder</code>
                </p>
              )}
            </div>

            {/* Reminder 2 */}
            <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reminders.reminder2?.enabled ?? true}
                    onChange={(e) => setReminders(prev => ({
                      ...prev,
                      reminder2: { ...prev.reminder2, enabled: e.target.checked }
                    }))}
                    style={{ width: 16, height: 16, marginRight: 8 }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Reminder 2</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={reminders.reminder2?.minutesBefore ?? 30}
                    onChange={(e) => setReminders(prev => ({
                      ...prev,
                      reminder2: { ...prev.reminder2, minutesBefore: parseInt(e.target.value) }
                    }))}
                    min={1}
                    style={{ width: 80, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                  />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>min before</span>
                </div>
              </div>
              {reminders.reminder2?.enabled !== false && (
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                  Uses template: <code style={{ backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: 4 }}>meeting_reminder</code>
                </p>
              )}
            </div>

            {/* Reminder 3 */}
            <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reminders.reminder3?.enabled ?? false}
                    onChange={(e) => setReminders(prev => ({
                      ...prev,
                      reminder3: { ...prev.reminder3, enabled: e.target.checked }
                    }))}
                    style={{ width: 16, height: 16, marginRight: 8 }}
                  />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Reminder 3</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={reminders.reminder3?.minutesBefore ?? 10}
                    onChange={(e) => setReminders(prev => ({
                      ...prev,
                      reminder3: { ...prev.reminder3, minutesBefore: parseInt(e.target.value) }
                    }))}
                    min={1}
                    style={{ width: 80, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                  />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>min before</span>
                </div>
              </div>
              {reminders.reminder3?.enabled && (
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                  Uses template: <code style={{ backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: 4 }}>meeting_reminder</code>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                Buttons: Reschedule | Cancel Meeting
              </p>
              <button
                onClick={saveReminders}
                disabled={savingReminders || !hasReminderChanges}
                style={{
                  padding: '8px 20px',
                  backgroundColor: hasReminderChanges ? '#25D366' : '#9ca3af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: savingReminders || !hasReminderChanges ? 'not-allowed' : 'pointer',
                  opacity: savingReminders || !hasReminderChanges ? 0.7 : 1,
                }}
              >
                {savingReminders ? 'Saving...' : 'Save Reminders'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scheduled Content Section */}
      <div style={{ marginTop: 16 }}>
        <div
          onClick={() => setShowScheduledContent(!showScheduledContent)}
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="20" height="20" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                  Scheduled Content
                </h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                  Send videos/media to new clients at specific times (e.g., 7-9 PM)
                </p>
              </div>
            </div>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="#9ca3af"
              viewBox="0 0 24 24"
              style={{ transform: showScheduledContent ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {showScheduledContent && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '0 0 12px 12px',
            padding: 20,
            marginTop: -10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
          }}>
            {/* Enable Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={scheduledContent.enabled ?? false}
                  onChange={(e) => setScheduledContent(prev => ({ ...prev, enabled: e.target.checked }))}
                  style={{ width: 16, height: 16, marginRight: 8 }}
                />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Enable Scheduled Content</span>
              </label>
            </div>

            {/* Time Window */}
            <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500, fontSize: 14, color: '#374151' }}>Send between</span>
                <input
                  type="time"
                  value={scheduledContent.startTime || '19:00'}
                  onChange={(e) => setScheduledContent(prev => ({ ...prev, startTime: e.target.value }))}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                />
                <span style={{ fontSize: 14, color: '#6b7280' }}>and</span>
                <input
                  type="time"
                  value={scheduledContent.endTime || '21:00'}
                  onChange={(e) => setScheduledContent(prev => ({ ...prev, endTime: e.target.value }))}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                />
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0 0' }}>
                Content will be sent to users who booked today within this time window
              </p>
            </div>

            {/* Content Items */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Content Items</span>
                <button
                  onClick={addScheduledItem}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
              </div>

              {(!scheduledContent.items || scheduledContent.items.length === 0) ? (
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                  padding: 24,
                  textAlign: 'center',
                  border: '2px dashed #e5e7eb',
                }}>
                  <svg width="32" height="32" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ margin: '0 auto 8px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                    No content items yet. Add videos or media to send to clients.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {scheduledContent.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: 8,
                        padding: 16,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <span style={{ fontWeight: 500, fontSize: 13, color: '#374151' }}>Item {index + 1}</span>
                        <button
                          onClick={() => removeScheduledItem(index)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Send After Hours */}
                      <div style={{
                        marginBottom: 12,
                        padding: '10px 12px',
                        backgroundColor: '#eff6ff',
                        borderRadius: 6,
                        border: '1px solid #bfdbfe',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <svg width="16" height="16" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span style={{ fontSize: 13, color: '#1e40af' }}>Send after</span>
                        <input
                          type="number"
                          min="1"
                          max="72"
                          value={item.delayHours ?? 6}
                          onChange={(e) => updateScheduledItem(index, 'delayHours', parseInt(e.target.value) || 6)}
                          style={{
                            width: 60,
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid #93c5fd',
                            fontSize: 14,
                            textAlign: 'center',
                            fontWeight: 600,
                            color: '#1e40af',
                          }}
                        />
                        <span style={{ fontSize: 13, color: '#1e40af' }}>hours from booking</span>
                      </div>

                      {/* Media Type */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>
                          Media Type
                        </label>
                        <select
                          value={item.mediaType || 'video'}
                          onChange={(e) => updateScheduledItem(index, 'mediaType', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid #e5e7eb',
                            fontSize: 14,
                            backgroundColor: '#fff',
                          }}
                        >
                          <option value="video">Video</option>
                          <option value="image">Image</option>
                          <option value="document">Document (PDF)</option>
                          <option value="none">Text Only</option>
                        </select>
                      </div>

                      {/* Media Upload & URL */}
                      {item.mediaType !== 'none' && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 8 }}>
                            Upload Media
                          </label>

                          {/* Upload Button */}
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                              type="file"
                              ref={el => fileInputRefs.current[index] = el}
                              onChange={(e) => handleScheduledFileUpload(index, e)}
                              accept={
                                item.mediaType === 'image' ? 'image/*' :
                                item.mediaType === 'video' ? 'video/*' :
                                item.mediaType === 'document' ? '.pdf,.doc,.docx' : '*/*'
                              }
                              style={{ display: 'none' }}
                            />
                            <button
                              onClick={() => fileInputRefs.current[index]?.click()}
                              disabled={uploadingIndex === index}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: uploadingIndex === index ? '#9ca3af' : '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: uploadingIndex === index ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              {uploadingIndex === index ? (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ animation: 'spin 1s linear infinite' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  Choose {item.mediaType === 'image' ? 'Image' : item.mediaType === 'video' ? 'Video' : 'File'}
                                </>
                              )}
                            </button>
                            <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
                              {item.mediaType === 'video' ? 'Max 16MB' : item.mediaType === 'image' ? 'Max 5MB' : 'Max 100MB'}
                            </span>
                          </div>

                          {/* Show uploaded file */}
                          {item.mediaUrl && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 12px',
                              backgroundColor: '#dcfce7',
                              borderRadius: 6,
                              marginBottom: 8,
                            }}>
                              <svg width="16" height="16" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span style={{ fontSize: 12, color: '#16a34a', flex: 1, wordBreak: 'break-all' }}>
                                {item.mediaUrl}
                              </span>
                              <button
                                onClick={() => updateScheduledItem(index, 'mediaUrl', '')}
                                style={{
                                  padding: '2px 6px',
                                  backgroundColor: 'transparent',
                                  color: '#dc2626',
                                  border: 'none',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )}

                          {/* Or enter URL manually */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>or enter URL</span>
                            <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
                          </div>
                          <input
                            type="text"
                            value={item.mediaUrl || ''}
                            onChange={(e) => updateScheduledItem(index, 'mediaUrl', e.target.value)}
                            placeholder="https://itsgoti.in/videos/video.mp4"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border: '1px solid #e5e7eb',
                              fontSize: 13,
                            }}
                          />
                        </div>
                      )}

                      {/* Filename (for documents) */}
                      {item.mediaType === 'document' && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>
                            Filename
                          </label>
                          <input
                            type="text"
                            value={item.filename || ''}
                            onChange={(e) => updateScheduledItem(index, 'filename', e.target.value)}
                            placeholder="Brochure.pdf"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border: '1px solid #e5e7eb',
                              fontSize: 14,
                            }}
                          />
                        </div>
                      )}

                      {/* Caption/Text */}
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>
                          Caption / Message
                        </label>
                        <textarea
                          value={item.text || ''}
                          onChange={(e) => updateScheduledItem(index, 'text', e.target.value)}
                          placeholder="Why most Shopify owners fail..."
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid #e5e7eb',
                            fontSize: 14,
                            resize: 'vertical',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                Runs every 10 minutes during time window
              </p>
              <button
                onClick={saveScheduledContent}
                disabled={savingScheduledContent || !hasScheduledContentChanges}
                style={{
                  padding: '8px 20px',
                  backgroundColor: hasScheduledContentChanges ? '#25D366' : '#9ca3af',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: savingScheduledContent || !hasScheduledContentChanges ? 'not-allowed' : 'pointer',
                  opacity: savingScheduledContent || !hasScheduledContentChanges ? 0.7 : 1,
                }}
              >
                {savingScheduledContent ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </div>
        )}
      </div>

      </> } {/* end Flow tab */}

      {false && (
        <div>
          {selectedAdmin ? (

            /* ===== ADMIN DETAIL VIEW ===== */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                <button onClick={() => setSelectedAdmin(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600 }}>
                  ← Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5, #6ee7b7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#059669', fontSize: 20 }}>
                    {selectedAdmin.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{selectedAdmin.name}</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{selectedAdmin.phone}{selectedAdmin.email ? ` · ${selectedAdmin.email}` : ''}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1.5px solid #f3f4f6' }}>
                {[{ k: 'list', l: 'Reminders List' }, { k: 'calendar', l: 'Calendar' }].map(t => (
                  <button key={t.k} onClick={() => setAdminDetailTab(t.k)} style={{
                    padding: '9px 22px', background: 'none', border: 'none',
                    borderBottom: adminDetailTab === t.k ? '2px solid #10b981' : '2px solid transparent',
                    marginBottom: -1.5, fontWeight: adminDetailTab === t.k ? 700 : 500,
                    color: adminDetailTab === t.k ? '#10b981' : '#9ca3af', cursor: 'pointer', fontSize: 14,
                  }}>{t.l}</button>
                ))}
              </div>

              {adminDetailTab === 'list' && (() => {
                const filteredReminders = adminReminders.filter(r => {
                  if (filterTo === 'self' && !r.isSelf) return false;
                  if (filterTo && filterTo !== 'self') {
                    const contact = contacts.find(c => (c.phone || '').replace(/\D/g, '').slice(-10) === (r.toPhone || '').replace(/\D/g, '').slice(-10));
                    if (!contact || contact.name !== filterTo) return false;
                  }
                  if (filterStatus === 'sent' && !r.sent) return false;
                  if (filterStatus === 'failed' && !r.failed) return false;
                  if (filterStatus === 'scheduled' && (r.sent || r.failed || r.status !== 'confirmed')) return false;
                  if (filterStatus === 'pending' && r.status !== 'pending_confirmation') return false;
                  if (filterDateFrom && new Date(r.scheduledAt) < new Date(filterDateFrom)) return false;
                  if (filterDateTo) { const to = new Date(filterDateTo); to.setHours(23,59,59,999); if (new Date(r.scheduledAt) > to) return false; }
                  return true;
                });
                const hasFilters = filterTo || filterStatus || filterDateFrom || filterDateTo;
                const toOptions = ['self', ...contacts.map(c => c.name)];
                return (
                <div>
                  {/* Filter bar */}
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', padding: '16px 20px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {/* To filter */}
                    <select value={filterTo} onChange={e => setFilterTo(e.target.value)}
                      style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: filterTo ? '#111827' : '#9ca3af', background: '#f9fafb', cursor: 'pointer', outline: 'none' }}>
                      <option value=''>All Recipients</option>
                      <option value='self'>Self</option>
                      {contacts.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                    {/* Status pills */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[['', 'All'], ['scheduled', 'Scheduled'], ['sent', 'Sent'], ['failed', 'Failed'], ['pending', 'Pending']].map(([val, label]) => (
                        <button key={val} onClick={() => setFilterStatus(val)} style={{
                          padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                          background: filterStatus === val ? '#10b981' : '#f3f4f6',
                          color: filterStatus === val ? '#fff' : '#6b7280',
                        }}>{label}</button>
                      ))}
                    </div>
                    {/* Date range */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type='date' value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#374151', background: '#f9fafb', outline: 'none' }} />
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>→</span>
                      <input type='date' value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#374151', background: '#f9fafb', outline: 'none' }} />
                    </div>
                    {hasFilters && (
                      <button onClick={() => { setFilterTo(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                        style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Clear
                      </button>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>{filteredReminders.length} of {adminReminders.length}</span>
                  </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  {loadingAdminReminders ? (
                    <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Loading...</div>
                  ) : filteredReminders.length === 0 ? (
                    <div style={{ padding: 56, textAlign: 'center' }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{hasFilters ? 'No matches' : 'No reminders yet'}</div>
                      <div style={{ fontSize: 13, color: '#9ca3af' }}>{hasFilters ? 'Try adjusting your filters' : `Reminders sent from ${selectedAdmin.name}'s number will appear here`}</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                          {['#', 'Date', 'Time', 'Message', 'To', 'Status', ''].map((h, i) => (
                            <th key={i} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReminders.map((r, i) => {
                          const dt = new Date(r.scheduledAt);
                          const sc = r.sent ? { bg: '#d1fae5', text: '#059669', label: 'Sent' }
                            : r.status === 'failed' ? { bg: '#fee2e2', text: '#dc2626', label: 'Failed' }
                            : r.status === 'pending_confirmation' ? { bg: '#fef3c7', text: '#d97706', label: 'Pending' }
                            : { bg: '#dbeafe', text: '#2563eb', label: 'Scheduled' };
                          return (
                            <tr key={r._id} style={{ borderBottom: '1px solid #f9fafb' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                              <td style={{ padding: '14px 18px', fontSize: 13, color: '#c4c9d4', fontWeight: 600 }}>{i + 1}</td>
                              <td style={{ padding: '14px 18px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                                {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td style={{ padding: '14px 18px', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
                                {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td style={{ padding: '14px 18px', fontSize: 13, color: '#111827', maxWidth: 280 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.message}>{r.message}</div>
                              </td>
                              <td style={{ padding: '14px 18px', fontSize: 13, whiteSpace: 'nowrap' }}>
                                {r.isSelf ? (
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '3px 9px', borderRadius: 20 }}>Self</span>
                                ) : (() => {
                                  const contact = contacts.find(c => c.phone === r.toPhone);
                                  return contact ? (
                                    <span
                                      style={{ color: '#374151', cursor: 'default', borderBottom: '1px dashed #d1d5db' }}
                                      onMouseMove={e => setTooltip({ x: e.clientX, y: e.clientY, type: 'client', name: contact.name, phone: contact.phone, email: contact.email })}
                                      onMouseLeave={() => setTooltip(null)}
                                    >
                                      {contact.name}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#d1d5db' }}>—</span>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: sc.bg, color: sc.text }}>{sc.label}</span>
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                <button onClick={() => handleDeleteReminder(r._id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e5e7eb', fontSize: 16, lineHeight: 1, padding: 2 }}
                                  onMouseEnter={e => e.target.style.color = '#ef4444'}
                                  onMouseLeave={e => e.target.style.color = '#e5e7eb'}>✕</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                </div>
                );
              })()}

              {adminDetailTab === 'calendar' && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                      {adminCalendarMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { const d = new Date(adminCalendarMonth); d.setMonth(d.getMonth() - 1); setAdminCalendarMonth(d); }}
                        style={{ padding: '7px 14px', border: '1px solid #f3f4f6', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 15, color: '#6b7280' }}>‹</button>
                      <button onClick={() => { const d = new Date(adminCalendarMonth); d.setMonth(d.getMonth() + 1); setAdminCalendarMonth(d); }}
                        style={{ padding: '7px 14px', border: '1px solid #f3f4f6', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 15, color: '#6b7280' }}>›</button>
                    </div>
                  </div>
                  {(() => {
                    const year = adminCalendarMonth.getFullYear();
                    const month = adminCalendarMonth.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const days = [];
                    for (let i = 0; i < firstDay; i++) days.push(null);
                    for (let d = 1; d <= daysInMonth; d++) days.push(d);
                    const remForDay = d => adminReminders.filter(r => { const rd = new Date(r.scheduledAt); return rd.getFullYear() === year && rd.getMonth() === month && rd.getDate() === d; });
                    const today = new Date();
                    return (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 10 }}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#c4c9d4', paddingBottom: 8 }}>{d}</div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                          {days.map((day, i) => {
                            const rems = day ? remForDay(day) : [];
                            const isToday = day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                            return (
                              <div key={i} style={{ minHeight: 76, padding: '7px 8px', borderRadius: 10, backgroundColor: isToday ? '#f0fdf9' : day ? '#fafafa' : 'transparent', border: isToday ? '1.5px solid #6ee7b7' : day ? '1px solid #f3f4f6' : 'none' }}>
                                {day && (
                                  <>
                                    <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? '#059669' : '#374151', marginBottom: 4 }}>{day}</div>
                                    {rems.map(r => {
                                      const sc = r.sent ? { bg: '#d1fae5', text: '#059669' } : r.status === 'failed' ? { bg: '#fee2e2', text: '#dc2626' } : { bg: '#dbeafe', text: '#2563eb' };
                                      const statusLabel = r.sent ? 'Sent' : r.status === 'failed' ? 'Failed' : r.status === 'pending_confirmation' ? 'Pending' : 'Scheduled';
                                      const toLabel = r.isSelf ? 'Self' : (contacts.find(c => c.phone === r.toPhone)?.name || r.toName || r.toPhone || '—');
                                      return (
                                        <div key={r._id}
                                          style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, marginBottom: 2, backgroundColor: sc.bg, color: sc.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, cursor: 'default' }}
                                          onMouseMove={e => setTooltip({ x: e.clientX, y: e.clientY, type: 'reminder', message: r.message, to: toLabel, time: new Date(r.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), status: statusLabel, statusColor: sc.text })}
                                          onMouseLeave={() => setTooltip(null)}
                                        >
                                          {new Date(r.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      );
                                    })}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

          ) : reminderTab === 'admin' ? (

            /* ===== ADMIN LIST ===== */
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f9fafb' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Admin Numbers</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9ca3af' }}>Team members allowed to send reminders via WhatsApp</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>🔍</span>
                    <input
                      value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                      placeholder='Search name, number, email...'
                      style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', background: '#f9fafb', outline: 'none', width: 220 }}
                    />
                  </div>
                  <button onClick={() => { setAdminForm(emptyForm); setFormErrors({}); setShowAdminPopup(true); }}
                    style={{ padding: '9px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                    + Add Admin
                  </button>
                </div>
              </div>
              {(() => {
                const filteredAdmins = allowedNumbers.filter(u => {
                  const q = adminSearch.toLowerCase();
                  return !q || u.name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.email?.toLowerCase().includes(q);
                });
                return filteredAdmins.length === 0 ? (
                <div style={{ padding: 56, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👤</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{adminSearch ? 'No results found' : 'No admins yet'}</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>{adminSearch ? 'Try a different search term' : 'Add team members who can send reminders via WhatsApp'}</div>
                </div>
              ) : filteredAdmins.map((u, i) => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: i < filteredAdmins.length - 1 ? '1px solid #f9fafb' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5, #6ee7b7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#059669', fontSize: 17, flexShrink: 0 }}>
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{u.phone}{u.email ? ` · ${u.email}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>({reminderCounts[u.phone] || 0})</span>
                  {/* Toggle */}
                  <div onClick={() => handleToggleAdmin(u._id)} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ width: 38, height: 21, borderRadius: 11, backgroundColor: u.isActive !== false ? '#10b981' : '#d1d5db', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
                      <div style={{ width: 17, height: 17, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 2, left: u.isActive !== false ? 19 : 2, transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: u.isActive !== false ? '#10b981' : '#9ca3af', minWidth: 42 }}>
                      {u.isActive !== false ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <button onClick={() => handleOpenAdmin(u)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>
                    View →
                  </button>
                  <button onClick={() => handleDeleteAdmin(u._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e5e7eb', fontSize: 18, flexShrink: 0, padding: 4, lineHeight: 1 }}
                    onMouseEnter={e => e.target.style.color = '#ef4444'}
                    onMouseLeave={e => e.target.style.color = '#e5e7eb'}>✕</button>
                </div>
              ))
            })()}
            </div>

          ) : (

            /* ===== CLIENT LIST ===== */
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f9fafb' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Clients</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#9ca3af' }}>Add clients so reminders can be sent to them by mentioning their name</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>🔍</span>
                    <input
                      value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                      placeholder='Search name, number, email...'
                      style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', background: '#f9fafb', outline: 'none', width: 220 }}
                    />
                  </div>
                  <button onClick={() => { setClientForm(emptyForm); setFormErrors({}); setShowClientPopup(true); }}
                    style={{ padding: '9px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                    + Add Client
                  </button>
                </div>
              </div>
              {(() => {
                const filteredContacts = contacts.filter(c => {
                  const q = clientSearch.toLowerCase();
                  return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
                });
                return filteredContacts.length === 0 ? (
                <div style={{ padding: 56, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{clientSearch ? 'No results found' : 'No clients yet'}</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>{clientSearch ? 'Try a different search term' : 'Add clients by name to send them reminders'}</div>
                </div>
              ) : filteredContacts.map((c, i) => (
                <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: i < filteredContacts.length - 1 ? '1px solid #f9fafb' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#2563eb', fontSize: 17, flexShrink: 0 }}>
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{c.phone}{c.email ? ` · ${c.email}` : ''}{c.note ? ` · ${c.note}` : ''}</div>
                  </div>
                  <button onClick={() => handleDeleteContact(c._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e5e7eb', fontSize: 18, padding: 4, lineHeight: 1 }}
                    onMouseEnter={e => e.target.style.color = '#ef4444'}
                    onMouseLeave={e => e.target.style.color = '#e5e7eb'}>✕</button>
                </div>
              ))
            })()}
            </div>

          )}
        </div>
      )}

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 10,
          backgroundColor: '#1f2937', color: '#fff', borderRadius: 10,
          padding: '10px 14px', fontSize: 12, lineHeight: 1.7,
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)', zIndex: 9000,
          pointerEvents: 'none', whiteSpace: 'nowrap', maxWidth: 280,
        }}>
          {tooltip.type === 'client' ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 3, fontSize: 13 }}>{tooltip.name}</div>
              {tooltip.phone && <div style={{ color: '#9ca3af' }}>📱 {tooltip.phone}</div>}
              {tooltip.email && <div style={{ color: '#9ca3af' }}>✉ {tooltip.email}</div>}
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12, color: '#f9fafb', whiteSpace: 'normal', maxWidth: 260 }}>{tooltip.message}</div>
              <div style={{ color: '#9ca3af' }}>🕐 {tooltip.time}</div>
              <div style={{ color: '#9ca3af' }}>👤 {tooltip.to}</div>
              <div style={{ color: tooltip.statusColor, fontWeight: 700, marginTop: 2 }}>{tooltip.status}</div>
            </>
          )}
        </div>
      )}

      {/* Admin Number Popup */}
      {showAdminPopup && (
        <AddPopup
          title="Add Admin Number"
          form={adminForm}
          setForm={setAdminForm}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          onSave={handleAddAdmin}
          saving={savingAdmin}
          onClose={() => { setShowAdminPopup(false); setFormErrors({}); }}
        />
      )}

      {/* Client Popup */}
      {showClientPopup && (
        <AddPopup
          title="Add Client"
          form={clientForm}
          setForm={setClientForm}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          onSave={handleAddContact}
          saving={savingClient}
          onClose={() => { setShowClientPopup(false); setFormErrors({}); }}
        />
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxWidth: 600,
            width: '100%',
            maxHeight: '80vh',
            overflow: 'hidden',
            margin: 16,
          }}>
            <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>
                Choose a Template
              </h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Start with a pre-built flow or create from scratch
              </p>
            </div>
            <div style={{ padding: 24, maxHeight: 400, overflowY: 'auto' }}>
              {/* Blank Flow Option */}
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  navigate(`${basePath}/new`);
                }}
                style={{
                  width: '100%',
                  padding: 16,
                  backgroundColor: '#f9fafb',
                  border: '2px dashed #d1d5db',
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="24" height="24" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                      Start from Scratch
                    </h3>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                      Create a blank flow and build your own
                    </p>
                  </div>
                </div>
              </button>

              {/* Template Options */}
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCreateFromTemplate(template.id)}
                  style={{
                    width: '100%',
                    padding: 16,
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: 12,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#25D366';
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="24" height="24" fill="#25D366" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                        {template.name}
                      </h3>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                        {template.description}
                      </p>
                      <span style={{
                        display: 'inline-block',
                        marginTop: 6,
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#7c3aed',
                        backgroundColor: '#ede9fe',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}>
                        {triggerLabels[template.trigger?.type] || template.trigger?.type}
                      </span>
                    </div>
                    <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
              <button
                onClick={() => setShowTemplateModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 400,
            width: '100%',
            margin: 16,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 12 }}>
              Delete Flow?
            </h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
              This action cannot be undone. The flow and all its data will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: deleting ? 'wait' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppBotManager;
