import { useState, useEffect } from 'react';
import { workspaceUsersAPI } from '../../services/api';

const AdminsManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    status: 'active',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await workspaceUsersAPI.getAll();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'admin', status: 'active' });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
    });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required');
      return;
    }
    if (!editingUser && !formData.password) {
      setFormError('Password is required for new users');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (editingUser) {
        // Update user
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        const response = await workspaceUsersAPI.update(editingUser._id, updateData);
        if (response.data.success) {
          setUsers(users.map((u) => (u._id === editingUser._id ? response.data.data : u)));
          setShowModal(false);
        }
      } else {
        // Create user
        const response = await workspaceUsersAPI.create(formData);
        if (response.data.success) {
          setUsers([...users, response.data.data]);
          setShowModal(false);
        }
      }
    } catch (error) {
      setFormError(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
      await workspaceUsersAPI.delete(userId);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      await workspaceUsersAPI.resetPassword(userId, { password: newPassword });
      alert('Password reset successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const admins = filteredUsers.filter((u) => u.role === 'admin');
  const superAdmins = filteredUsers.filter((u) => u.role === 'super_admin');

  // User Table Component
  const UserTable = ({ usersList, title, showDeleteButton = true }) => (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        marginBottom: '24px',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          {title} ({usersList.length})
        </h3>
      </div>
      {usersList.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
          No {title.toLowerCase()} found
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Member
              </th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Status
              </th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Created
              </th>
              <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((user) => (
              <tr key={user._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: user.role === 'super_admin' ? '#22c55e' : '#2558BF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {user.initials || user.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                        {user.name}
                      </p>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>{user.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: user.status === 'active' ? '#22c55e' : '#ef4444',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: user.status === 'active' ? '#22c55e' : '#ef4444',
                      }}
                    />
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '13px' }}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(user)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#374151',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleResetPassword(user._id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fef3c7',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#92400e',
                      }}
                    >
                      Reset Password
                    </button>
                    {showDeleteButton && user.role !== 'super_admin' && (
                      <button
                        onClick={() => handleDelete(user._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          color: '#dc2626',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Manage Team Members
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            {superAdmins.length} super admin{superAdmins.length !== 1 ? 's' : ''}, {admins.length} admin{admins.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#2558BF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="#9ca3af"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 44px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#fff',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Users Tables */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading...</div>
      ) : filteredUsers.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#d1d5db" style={{ marginBottom: '16px' }}>
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          <h3 style={{ color: '#374151', fontSize: '18px', marginBottom: '8px' }}>No members found</h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Add team members to get started</p>
          <button
            onClick={openCreateModal}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2558BF',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Add Member
          </button>
        </div>
      ) : (
        <>
          {/* Super Admins Table */}
          <UserTable usersList={superAdmins} title="Super Admins" showDeleteButton={false} />

          {/* Admins Table */}
          <UserTable usersList={admins} title="Admins" showDeleteButton={true} />
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {editingUser ? 'Edit Member' : 'Add New Member'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {formError && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    color: '#dc2626',
                    fontSize: '14px',
                  }}
                >
                  {formError}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '••••••••' : ''}
                    style={{
                      width: '100%',
                      padding: '10px 44px 10px 14px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: formLoading ? '#93c5fd' : '#2558BF',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {formLoading ? 'Saving...' : editingUser ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminsManager;
