import { useState, useEffect } from 'react';
import { workspaceBoardsAPI } from '../../services/api';

// Default settings fallback
const DEFAULT_SETTINGS = {
  types: [
    { id: 'operational', label: 'Operational', color: '#22c55e' },
    { id: 'strategic', label: 'Strategic', color: '#3b82f6' },
    { id: 'tactical', label: 'Tactical', color: '#f59e0b' },
    { id: 'administrative', label: 'Administrative', color: '#8b5cf6' },
  ],
  statuses: [
    { id: 'open', label: 'Open', color: '#6b7280' },
    { id: 'todo', label: 'To-Do', color: '#3b82f6' },
    { id: 'doing', label: 'Doing', color: '#f59e0b' },
    { id: 'done', label: 'Done', color: '#22c55e' },
  ],
  priorities: [
    { id: 'none', label: 'None', color: '#9ca3af' },
    { id: 'low', label: 'Low', color: '#3b82f6' },
    { id: 'medium', label: 'Medium', color: '#eab308' },
    { id: 'high', label: 'High', color: '#f97316' },
    { id: 'critical', label: 'Critical', color: '#ef4444' },
  ],
  tags: [
    { id: 'bug', name: 'Bug', color: '#ef4444' },
    { id: 'feature', name: 'Feature', color: '#22c55e' },
    { id: 'improvement', name: 'Improvement', color: '#3b82f6' },
    { id: 'urgent', name: 'Urgent', color: '#f97316' },
    { id: 'documentation', name: 'Documentation', color: '#8b5cf6' },
  ],
};

const BoardSettingsView = ({ boardId, boardName }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('types');
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ label: '', name: '', color: '#3b82f6' });
  const [showAddForm, setShowAddForm] = useState(false);

  const tabs = [
    { id: 'types', label: 'Types', icon: 'type' },
    { id: 'priorities', label: 'Priorities', icon: 'priority' },
    { id: 'tags', label: 'Tags', icon: 'tag' },
  ];

  const defaultColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
    '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6', '#f59e0b'
  ];

  useEffect(() => {
    loadSettings();
  }, [boardId]);

  const loadSettings = async () => {
    setError(null);
    try {
      const response = await workspaceBoardsAPI.getSettings(boardId);
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings. Using defaults.');
      // Keep using default settings
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.label && !newItem.name) return;

    setSaving(true);
    try {
      const itemData = {
        id: (newItem.label || newItem.name).toLowerCase().replace(/\s+/g, '-'),
        color: newItem.color,
      };

      // Tags use 'name' field, others use 'label'
      if (activeTab === 'tags') {
        itemData.name = newItem.name || newItem.label;
      } else {
        itemData.label = newItem.label || newItem.name;
      }

      const response = await workspaceBoardsAPI.addSettingItem(boardId, activeTab, itemData);
      if (response.data.success) {
        setSettings(response.data.data);
        setNewItem({ label: '', name: '', color: '#3b82f6' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    setSaving(true);
    try {
      const response = await workspaceBoardsAPI.updateSettingItem(boardId, activeTab, itemId, updates);
      if (response.data.success) {
        setSettings(response.data.data);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setSaving(true);
    try {
      const response = await workspaceBoardsAPI.deleteSettingItem(boardId, activeTab, itemId);
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setSaving(false);
    }
  };

  const getItems = () => {
    if (!settings) return [];
    return settings[activeTab] || [];
  };

  const getItemLabel = (item) => {
    return item.label || item.name || '';
  };

  const icons = {
    type: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
    priority: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
      </svg>
    ),
    tag: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
      </svg>
    ),
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      padding: '0 24px 24px 24px',
      overflow: 'auto',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    }}>
      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
          Board Settings
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Customize task types, priorities, and tags for {boardName}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '12px',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setShowAddForm(false);
              setEditingItem(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: activeTab === tab.id ? '#2558BF' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {icons[tab.icon]}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}>
        {/* List Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#fafafa',
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            {tabs.find(t => t.id === activeTab)?.label} ({getItems().length})
          </span>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#2558BF',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Add {activeTab === 'tags' ? 'Tag' : activeTab.slice(0, -2).charAt(0).toUpperCase() + activeTab.slice(0, -2).slice(1)}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                  {activeTab === 'tags' ? 'Tag Name' : 'Label'}
                </label>
                <input
                  type="text"
                  value={activeTab === 'tags' ? newItem.name : newItem.label}
                  onChange={(e) => setNewItem({
                    ...newItem,
                    [activeTab === 'tags' ? 'name' : 'label']: e.target.value
                  })}
                  placeholder={`Enter ${activeTab === 'tags' ? 'tag name' : 'label'}`}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2558BF'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                  Color
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '180px' }}>
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewItem({ ...newItem, color })}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: color,
                        border: newItem.color === color ? '2px solid #111827' : '2px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddItem}
                  disabled={saving || (!newItem.label && !newItem.name)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: saving || (!newItem.label && !newItem.name) ? '#d1d5db' : '#22c55e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: saving || (!newItem.label && !newItem.name) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewItem({ label: '', name: '', color: '#3b82f6' });
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div>
          {getItems().length === 0 ? (
            <div style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '14px',
            }}>
              No {activeTab} configured yet. Click "Add" to create one.
            </div>
          ) : (
            getItems().map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 20px',
                  borderBottom: index < getItems().length - 1 ? '1px solid #f3f4f6' : 'none',
                }}
              >
                {editingItem?.id === item.id ? (
                  // Edit Mode
                  <>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: activeTab === 'priorities' ? '50%' : '6px',
                        backgroundColor: editingItem.color,
                      }}
                    />
                    <input
                      type="text"
                      value={activeTab === 'tags' ? editingItem.name : editingItem.label}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        [activeTab === 'tags' ? 'name' : 'label']: e.target.value,
                      })}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #2558BF',
                        borderRadius: '6px',
                        outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {defaultColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, color })}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            backgroundColor: color,
                            border: editingItem.color === color ? '2px solid #111827' : '2px solid transparent',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleUpdateItem(item.id, editingItem)}
                        disabled={saving}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  // View Mode
                  <>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: activeTab === 'priorities' ? '50%' : '6px',
                        backgroundColor: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    />
                    <span style={{ flex: 1, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                      {getItemLabel(item)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {item.id}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => setEditingItem({ ...item })}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'transparent',
                          color: '#6b7280',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={saving}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '24px',
        padding: '16px 20px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bae6fd',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#0369a1' }}>
              About Board Settings
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#0284c7' }}>
              {activeTab === 'types' && 'Task types help categorize tasks. They appear as labels on task cards.'}
              {activeTab === 'priorities' && 'Priorities help team members understand task urgency and importance.'}
              {activeTab === 'tags' && 'Tags are flexible labels you can add to tasks for better organization and filtering.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardSettingsView;
