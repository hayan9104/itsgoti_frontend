import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AccountManager = () => {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helper to get current user ID (handles both 'id' and '_id')
  const getCurrentUserId = () => currentUser?.id || currentUser?._id;

  // Helper to check if a user is the current logged-in user
  const isCurrentUser = (user) => {
    const currentId = getCurrentUserId();
    return user?._id === currentId || user?.id === currentId;
  };
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (addForm.password !== addForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    try {
      await usersAPI.create({
        name: addForm.name,
        email: addForm.email,
        password: addForm.password,
        role: 'admin',
      });
      setMessage({ type: 'success', text: 'Admin user created successfully' });
      setAddForm({ name: '', email: '', password: '', confirmPassword: '' });
      setShowAddForm(false);
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create user' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      // Success - show modal to force re-login
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      setShowSuccessModal(true);
    } catch (error) {
      // Error - show message but DON'T log out
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      setMessage({ type: 'error', text: errorMessage });
      // Keep the form open so user can try again
    }
  };

  const handleSuccessModalLogin = () => {
    logout();
    navigate('/admin/login');
  };

  const handleDeleteUser = async (userId) => {
    const currentId = getCurrentUserId();
    if (userId === currentId) {
      setMessage({ type: 'error', text: 'You cannot delete your own account' });
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(userId);
      setMessage({ type: 'success', text: 'User deleted successfully' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Account & Permissions
        </h1>
      </div>

      {/* Message */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '14px',
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Left Column - Users List */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
              Admin Users
            </h2>
            <button
              onClick={() => { setShowAddForm(true); setSelectedUser(null); setShowChangePassword(false); }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Admin
            </button>
          </div>

          {/* Users List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {users.map((user) => (
              <div
                key={user._id}
                onClick={() => { setSelectedUser(user); setShowAddForm(false); setShowChangePassword(false); }}
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  backgroundColor: selectedUser?._id === user._id ? '#eff6ff' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}>
                    {user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: 0 }}>
                      {user.name}
                      {isCurrentUser(user) && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>(You)</span>
                      )}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{user.email}</p>
                  </div>
                  {/* Arrow */}
                  <svg width="20" height="20" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Details / Forms */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          {/* Add New Admin Form */}
          {showAddForm && (
            <>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Add New Admin
                </h2>
              </div>
              <form onSubmit={handleAddUser} style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter name"
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter email"
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter password"
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={addForm.confirmPassword}
                    onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Re-enter password"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Selected User Details */}
          {selectedUser && !showAddForm && !showChangePassword && (
            <>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  User Details
                </h2>
              </div>
              <div style={{ padding: '24px' }}>
                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: 600,
                  }}>
                    {selectedUser.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {selectedUser.name}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{selectedUser.role}</p>
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
                    Email
                  </label>
                  <p style={{ fontSize: '15px', color: '#111827', margin: 0 }}>{selectedUser.email}</p>
                </div>

                {/* Password (masked) */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '4px' }}>
                    Password
                  </label>
                  <p style={{ fontSize: '15px', color: '#111827', margin: 0, letterSpacing: '2px' }}>••••••••</p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {isCurrentUser(selectedUser) ? (
                    <button
                      onClick={() => setShowChangePassword(true)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Change Password
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeleteUser(selectedUser._id)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Delete User
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Change Password Form */}
          {showChangePassword && selectedUser && (
            <>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Change Password
                </h2>
              </div>
              <form onSubmit={handleChangePassword} style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter current password"
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter new password"
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Re-enter new password"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Empty State */}
          {!selectedUser && !showAddForm && (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <svg width="48" height="48" fill="none" stroke="#d1d5db" viewBox="0 0 24 24" style={{ margin: '0 auto 16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                Select a user to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal - Force Re-login */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            {/* Success Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="32" height="32" fill="none" stroke="#059669" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 12px 0',
            }}>
              Password Changed Successfully
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 24px 0',
              lineHeight: '1.5',
            }}>
              Your password has been updated. Please login again with your new password to continue.
            </p>

            <button
              onClick={handleSuccessModalLogin}
              style={{
                width: '100%',
                padding: '14px 24px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Login Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
