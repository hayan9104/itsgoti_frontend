import { useState, useEffect } from 'react';
import { contactsAPI } from '../services/api';

const ContactsManager = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [sourceFilter, setSourceFilter] = useState('all'); // all, Contact Page, Landing Page, Landing Page 2
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

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

    // Source filter
    if (sourceFilter !== 'all' && contact.sourcePage !== sourceFilter) return false;

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

  // Source counts
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
    switch (sourcePage) {
      case 'Landing Page 2':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'Landing Page':
        return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
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

        {/* Search */}
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
      </div>

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

        {/* Source Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Sources</option>
            <option value="Contact Page">Contact Page ({sourceStats['Contact Page']})</option>
            <option value="Landing Page">Landing Page ({sourceStats['Landing Page']})</option>
            <option value="Landing Page 2">Landing Page 2 ({sourceStats['Landing Page 2']})</option>
          </select>
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
    </div>
  );
};

export default ContactsManager;
