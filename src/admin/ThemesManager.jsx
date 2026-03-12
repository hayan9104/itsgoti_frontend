import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { themesAPI } from '../services/api';
import { getAvailableThemeCodes } from '../themes/themeRegistry';

const ThemesManager = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(null);
  const [newThemeCode, setNewThemeCode] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setOpenMenu(null);
    if (openMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openMenu]);

  const fetchThemes = async () => {
    try {
      const response = await themesAPI.getAll();
      setThemes(response.data.data);
    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const liveTheme = themes.find((t) => t.isLive);
  const draftThemes = themes.filter((t) => !t.isLive);

  const handleCreateTheme = async () => {
    if (!newThemeName.trim()) return;
    setActionLoading('create');
    try {
      await themesAPI.create({ name: newThemeName.trim(), migrateFromPages: true });
      setNewThemeName('');
      setShowCreateModal(false);
      showToastMsg('Theme created successfully!');
      await fetchThemes();
    } catch (error) {
      showToastMsg(error.response?.data?.message || 'Failed to create theme', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (themeId, themeName) => {
    setActionLoading(themeId);
    try {
      await themesAPI.duplicate(themeId, { name: `Copy of ${themeName}` });
      showToastMsg('Theme duplicated!');
      await fetchThemes();
    } catch (error) {
      showToastMsg('Failed to duplicate theme', 'error');
    } finally {
      setActionLoading(null);
      setOpenMenu(null);
    }
  };

  const handlePublish = async (themeId) => {
    setActionLoading(themeId);
    setShowPublishConfirm(null);
    try {
      await themesAPI.publish(themeId);
      showToastMsg('Theme published! It is now live.');
      await fetchThemes();
    } catch (error) {
      showToastMsg('Failed to publish theme', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (themeId) => {
    setActionLoading(themeId);
    setShowDeleteConfirm(null);
    try {
      await themesAPI.delete(themeId);
      showToastMsg('Theme deleted.');
      await fetchThemes();
    } catch (error) {
      showToastMsg(error.response?.data?.message || 'Failed to delete theme', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRename = async () => {
    if (!renameName.trim() || !showRenameModal) return;
    setActionLoading(showRenameModal);
    try {
      await themesAPI.update(showRenameModal, { name: renameName.trim() });
      setShowRenameModal(null);
      setRenameName('');
      showToastMsg('Theme renamed!');
      await fetchThemes();
    } catch (error) {
      showToastMsg('Failed to rename theme', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeCode = async () => {
    if (!newThemeCode.trim() || !showCodeModal) return;
    setActionLoading(showCodeModal);
    try {
      await themesAPI.update(showCodeModal, { themeCode: newThemeCode.trim().toLowerCase() });
      setShowCodeModal(null);
      setNewThemeCode('');
      showToastMsg('Theme code updated!');
      await fetchThemes();
    } catch (error) {
      showToastMsg('Failed to update theme code', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTheme = (themeId) => {
    navigate(`/admin/themes/${themeId}`);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#6b7280' }}>
        Loading themes...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, padding: '12px 20px', borderRadius: 8,
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', fontSize: 14, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Themes</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Manage your site themes. The live theme is what visitors see.</p>
        </div>
      </div>

      {/* No themes state */}
      {themes.length === 0 && (
        <div style={{
          backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: 60, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            No themes yet
          </h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            Create your first theme to get started. It will import all your current page content.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 24px', backgroundColor: '#2563eb', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            Create First Theme
          </button>
        </div>
      )}

      {/* Current Theme with Preview */}
      {liveTheme && (
        <div style={{
          backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: 32,
        }}>
          {/* Desktop + Mobile Preview */}
          <div style={{ overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
            <LiveThemePreview />
          </div>

          {/* Theme Info Card */}
          <div style={{ padding: 24, position: 'relative' }}>
            <ThemeCard
              theme={liveTheme}
              isLive={true}
              actionLoading={actionLoading}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              onEdit={() => handleEditTheme(liveTheme._id)}
              onDuplicate={() => handleDuplicate(liveTheme._id, liveTheme.name)}
              onRename={() => { setShowRenameModal(liveTheme._id); setRenameName(liveTheme.name); }}
              onChangeCode={() => { setShowCodeModal(liveTheme._id); const codes = getAvailableThemeCodes(); const current = liveTheme.themeCode || 'default'; setNewThemeCode(codes.includes(current) ? current : codes[0] || 'default'); }}
              formatDate={formatDate}
            />
          </div>
        </div>
      )}

      {/* Theme Library */}
      {(draftThemes.length > 0 || liveTheme) && (
        <div style={{
          backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: 24,
        }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
              Theme library
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              These themes are only visible to you. Publishing a theme from your library will switch it to your current theme.
            </p>
          </div>

          {draftThemes.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              No draft themes. Duplicate the live theme to create one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {draftThemes.map((theme) => (
                <ThemeCard
                  key={theme._id}
                  theme={theme}
                  isLive={false}
                  actionLoading={actionLoading}
                  openMenu={openMenu}
                  setOpenMenu={setOpenMenu}
                  onEdit={() => handleEditTheme(theme._id)}
                  onPublish={() => setShowPublishConfirm(theme._id)}
                  onDuplicate={() => handleDuplicate(theme._id, theme.name)}
                  onRename={() => { setShowRenameModal(theme._id); setRenameName(theme.name); }}
                  onChangeCode={() => { setShowCodeModal(theme._id); const codes = getAvailableThemeCodes(); const current = theme.themeCode || 'default'; setNewThemeCode(codes.includes(current) ? current : codes[0] || 'default'); }}
                  onDelete={() => setShowDeleteConfirm(theme._id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Theme Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            Create new theme
          </h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            This will create a new draft theme with all your current page content.
          </p>
          <input
            type="text"
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            placeholder="Theme name (e.g., Spring 2026 Redesign)"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTheme()}
            autoFocus
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 14, marginBottom: 20, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTheme}
              disabled={!newThemeName.trim() || actionLoading === 'create'}
              style={{
                padding: '8px 16px', backgroundColor: '#111827', color: '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
                opacity: !newThemeName.trim() || actionLoading === 'create' ? 0.5 : 1,
              }}
            >
              {actionLoading === 'create' ? 'Creating...' : 'Create theme'}
            </button>
          </div>
        </Modal>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <Modal onClose={() => setShowRenameModal(null)}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Rename theme
          </h3>
          <input
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 14, marginBottom: 20, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setShowRenameModal(null)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            <button onClick={handleRename} disabled={!renameName.trim()} style={{ padding: '8px 16px', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, opacity: !renameName.trim() ? 0.5 : 1 }}>Rename</button>
          </div>
        </Modal>
      )}

      {/* Publish Confirm Modal */}
      {showPublishConfirm && (
        <Modal onClose={() => setShowPublishConfirm(null)}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            Publish this theme?
          </h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            This will make it the live theme. The current live theme will be moved to your theme library. Visitors will immediately see the new theme.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setShowPublishConfirm(null)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            <button onClick={() => handlePublish(showPublishConfirm)} style={{ padding: '8px 16px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Yes, publish</button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(null)}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            Delete this theme?
          </h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            This action cannot be undone. All content in this theme will be permanently deleted.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            <button onClick={() => handleDelete(showDeleteConfirm)} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Delete</button>
          </div>
        </Modal>
      )}

      {/* Change Code Folder Modal */}
      {showCodeModal && (
        <Modal onClose={() => setShowCodeModal(null)}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            Change code folder
          </h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
            Select the theme code folder. This maps to <span style={{ fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>client/src/themes/&lt;code&gt;/</span> in your project.
          </p>
          <select
            value={newThemeCode}
            onChange={(e) => setNewThemeCode(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 14, marginBottom: 20, outline: 'none',
              boxSizing: 'border-box', fontFamily: 'monospace',
              backgroundColor: '#fff', cursor: 'pointer',
            }}
          >
            {getAvailableThemeCodes().map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={() => setShowCodeModal(null)}
              style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
            >
              Cancel
            </button>
            <button
              onClick={handleChangeCode}
              disabled={!newThemeCode.trim() || actionLoading === showCodeModal}
              style={{
                padding: '8px 16px', backgroundColor: '#111827', color: '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
                opacity: !newThemeCode.trim() || actionLoading === showCodeModal ? 0.5 : 1,
              }}
            >
              {actionLoading === showCodeModal ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Live Theme Preview (auto-scales iframes to fit container)
const LiveThemePreview = () => {
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);
  const [desktopScale, setDesktopScale] = useState(0.5);
  const [mobileScale, setMobileScale] = useState(0.4);

  const updateScales = useCallback(() => {
    if (desktopRef.current) {
      const w = desktopRef.current.offsetWidth;
      setDesktopScale(w / 1440);
    }
    if (mobileRef.current) {
      const w = mobileRef.current.offsetWidth;
      setMobileScale(w / 375);
    }
  }, []);

  useEffect(() => {
    updateScales();
    window.addEventListener('resize', updateScales);
    return () => window.removeEventListener('resize', updateScales);
  }, [updateScales]);

  const previewHeight = 280;

  return (
    <div style={{
      display: 'flex', gap: 16, padding: '24px 24px 0',
      backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb',
    }}>
      {/* Desktop */}
      <div style={{
        flex: '1 1 0', minWidth: 0, borderRadius: '8px 8px 0 0', overflow: 'hidden',
        border: '1px solid #e5e7eb', borderBottom: 'none', backgroundColor: '#fff',
      }}>
        <div style={{
          height: 28, backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
        </div>
        <div ref={desktopRef} style={{ height: previewHeight, overflow: 'hidden', position: 'relative' }}>
          <iframe
            src="/"
            title="Desktop Preview"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '1440px', height: '900px', border: 'none',
              transform: `scale(${desktopScale})`, transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Mobile */}
      <div style={{
        width: 150, flexShrink: 0, borderRadius: '8px 8px 0 0', overflow: 'hidden',
        border: '1px solid #e5e7eb', borderBottom: 'none', backgroundColor: '#fff',
      }}>
        <div style={{
          height: 28, backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
        </div>
        <div ref={mobileRef} style={{ height: previewHeight, overflow: 'hidden', position: 'relative' }}>
          <iframe
            src="/"
            title="Mobile Preview"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '375px', height: '812px', border: 'none',
              transform: `scale(${mobileScale})`, transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Theme Card Component
const ThemeCard = ({
  theme, isLive, actionLoading, openMenu, setOpenMenu,
  onEdit, onPublish, onDuplicate, onRename, onDelete, onChangeCode, formatDate,
}) => {
  const isLoading = actionLoading === theme._id;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isLive ? 0 : '16px 0',
      borderBottom: !isLive ? '1px solid #f3f4f6' : 'none',
      opacity: isLoading ? 0.6 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Left: Thumbnail + Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Thumbnail - live site preview */}
        <div style={{
          width: 100, height: 64, backgroundColor: '#fff', borderRadius: 8,
          border: '1px solid #e5e7eb', overflow: 'hidden',
          flexShrink: 0, position: 'relative',
        }}>
          <iframe
            src="/"
            title={`${theme.name} preview`}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '1440px', height: '900px', border: 'none',
              transform: `scale(${100 / 1440})`, transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{theme.name}</span>
            {isLive && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5',
                padding: '2px 8px', borderRadius: 10, border: '1px solid #a7f3d0',
              }}>
                Current theme
              </span>
            )}
          </div>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Last saved: {formatDate(theme.updatedAt)}
          </span>
          <div style={{ marginTop: 2 }}>
            <span style={{
              fontSize: 11, fontFamily: 'monospace', color: '#6b7280',
              backgroundColor: '#f3f4f6', padding: '1px 6px', borderRadius: 4,
            }}>
              code: {theme.themeCode || 'default'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 3-dot menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === theme._id ? null : theme._id); }}
            style={{
              width: 36, height: 36, border: '1px solid #d1d5db', borderRadius: 8,
              backgroundColor: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#6b7280">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>

          {openMenu === theme._id && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: 160, zIndex: 50,
              overflow: 'hidden',
            }}>
              <MenuButton onClick={() => { onDuplicate(); }}>Duplicate</MenuButton>
              <MenuButton onClick={() => { setOpenMenu(null); onRename(); }}>Rename</MenuButton>
              <MenuButton onClick={() => { setOpenMenu(null); onChangeCode(); }}>Change code folder</MenuButton>
              {!isLive && (
                <MenuButton onClick={() => { setOpenMenu(null); onDelete(); }} danger>Delete</MenuButton>
              )}
            </div>
          )}
        </div>

        {/* Publish button (draft only) */}
        {!isLive && onPublish && (
          <button
            onClick={onPublish}
            disabled={isLoading}
            style={{
              padding: '8px 16px', backgroundColor: '#fff', color: '#111827',
              border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
            }}
          >
            Publish
          </button>
        )}

        {/* Edit theme button */}
        <button
          onClick={onEdit}
          disabled={isLoading}
          style={{
            padding: '8px 16px', backgroundColor: '#111827', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
          }}
        >
          Edit theme
        </button>
      </div>
    </div>
  );
};

// Reusable menu button
const MenuButton = ({ children, onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      display: 'block', width: '100%', padding: '10px 16px',
      textAlign: 'left', border: 'none', backgroundColor: 'transparent',
      cursor: 'pointer', fontSize: 14, color: danger ? '#dc2626' : '#374151',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = danger ? '#fef2f2' : '#f9fafb'; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    {children}
  </button>
);

// Reusable modal
const Modal = ({ children, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  }}>
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: '#fff', borderRadius: 12,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        maxWidth: 480, width: '100%', padding: 24, margin: 16,
      }}
    >
      {children}
    </div>
  </div>
);

export default ThemesManager;
