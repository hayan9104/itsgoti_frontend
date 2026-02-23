import { useState, useEffect } from 'react';
import { contactsAPI } from '../services/api';

const ContactsManager = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);

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
      fetchContacts();
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Contact Messages</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Messages List */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {contacts.length === 0 ? (
              <p style={{ padding: '16px', color: '#6b7280', textAlign: 'center' }}>No messages yet.</p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => {
                    setSelectedContact(contact);
                    if (!contact.read) {
                      handleMarkAsRead(contact._id);
                    }
                  }}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: selectedContact?._id === contact._id ? '#eff6ff' : '#fff',
                    borderLeft: !contact.read ? '4px solid #2563eb' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontWeight: 500, color: '#111827' }}>{contact.name}</h3>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.subject}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          {selectedContact ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                    {selectedContact.subject}
                  </h2>
                  <p style={{ color: '#4b5563' }}>From: {selectedContact.name}</p>
                </div>
                <button
                  onClick={() => handleDelete(selectedContact._id)}
                  style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Email:</span>
                  <p style={{ color: '#111827' }}>{selectedContact.email}</p>
                </div>
                {selectedContact.phone && (
                  <div>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Phone:</span>
                    <p style={{ color: '#111827' }}>{selectedContact.phone}</p>
                  </div>
                )}
                {selectedContact.company && (
                  <div>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>Company:</span>
                    <p style={{ color: '#111827' }}>{selectedContact.company}</p>
                  </div>
                )}
                {selectedContact.source && (
                  <div>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>How they found us:</span>
                    <p style={{ color: '#111827' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: '#E1FFA0',
                        borderRadius: '100px',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}>
                        {selectedContact.source}
                      </span>
                    </p>
                  </div>
                )}
                <div>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Message:</span>
                  <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap', color: '#111827' }}>
                    {selectedContact.message}
                  </p>
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Received:{' '}
                  {new Date(selectedContact.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>
              Select a message to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsManager;
