import { useState, useEffect, useRef } from 'react';
import { clientLogosAPI, uploadAPI } from '../services/api';

const AVAILABLE_PAGES = [
  { id: 'home', label: 'Home Page', color: '#2563eb' },
  { id: 'about', label: 'About Page', color: '#7c3aed' },
  { id: 'landing', label: 'Landing Page 1', color: '#059669' },
  { id: 'landing-page-2', label: 'Landing Page 2', color: '#d97706' },
  { id: 'landing-page-3', label: 'Landing Page 3', color: '#dc2626' },
];

const ClientLogosManager = () => {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLogo, setEditingLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [selectedLogos, setSelectedLogos] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [filterPage, setFilterPage] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    showOnPages: [],
    active: true,
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      setLoading(true);
      const res = await clientLogosAPI.getAll();
      setLogos(res.data.data || []);
    } catch (error) {
      console.error('Error fetching logos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadAPI.single(formData);
      setFormData(prev => ({ ...prev, logo: res.data.url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.logo) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingLogo) {
        await clientLogosAPI.update(editingLogo._id, formData);
      } else {
        await clientLogosAPI.create(formData);
      }
      await fetchLogos();
      closeModal();
    } catch (error) {
      console.error('Error saving logo:', error);
      alert('Failed to save logo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this logo?')) return;

    try {
      await clientLogosAPI.delete(id);
      await fetchLogos();
    } catch (error) {
      console.error('Error deleting logo:', error);
      alert('Failed to delete logo');
    }
  };

  const handleToggleActive = async (logo) => {
    try {
      await clientLogosAPI.update(logo._id, { active: !logo.active });
      await fetchLogos();
    } catch (error) {
      console.error('Error toggling logo:', error);
    }
  };

  const handlePageToggle = (pageId) => {
    setFormData(prev => {
      const newPages = prev.showOnPages.includes(pageId)
        ? prev.showOnPages.filter(p => p !== pageId)
        : [...prev.showOnPages, pageId];
      return { ...prev, showOnPages: newPages };
    });
  };

  const openAddModal = () => {
    setEditingLogo(null);
    setFormData({ name: '', logo: '', showOnPages: [], active: true });
    setShowModal(true);
  };

  const openEditModal = (logo) => {
    setEditingLogo(logo);
    setFormData({
      name: logo.name,
      logo: logo.logo,
      showOnPages: logo.showOnPages || [],
      active: logo.active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLogo(null);
    setFormData({ name: '', logo: '', showOnPages: [], active: true });
  };

  // Drag & Drop
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newLogos = [...logos];
    const draggedLogo = newLogos[draggedIndex];
    newLogos.splice(draggedIndex, 1);
    newLogos.splice(index, 0, draggedLogo);
    setLogos(newLogos);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      try {
        await clientLogosAPI.reorder(logos.map(l => l._id));
      } catch (error) {
        console.error('Error reordering:', error);
        await fetchLogos();
      }
    }
    setDraggedIndex(null);
  };

  // Bulk selection
  const toggleSelectLogo = (id) => {
    setSelectedLogos(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedLogos.length === filteredLogos.length) {
      setSelectedLogos([]);
    } else {
      setSelectedLogos(filteredLogos.map(l => l._id));
    }
  };

  const handleBulkAssign = async (pages, action) => {
    try {
      await clientLogosAPI.bulkAssign(selectedLogos, pages, action);
      await fetchLogos();
      setSelectedLogos([]);
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error bulk assigning:', error);
      alert('Failed to update page assignments');
    }
  };

  // Filter logos
  const filteredLogos = filterPage === 'all'
    ? logos
    : logos.filter(l => l.showOnPages?.includes(filterPage));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <div style={{ color: '#6b7280' }}>Loading client logos...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Client Logos</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            Manage client logos displayed across all pages
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Logo
        </button>
      </div>

      {/* Filter & Bulk Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Filter by page:</label>
          <select
            value={filterPage}
            onChange={(e) => setFilterPage(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: 14,
            }}
          >
            <option value="all">All Pages</option>
            {AVAILABLE_PAGES.map(page => (
              <option key={page.id} value={page.id}>{page.label}</option>
            ))}
          </select>
        </div>

        {selectedLogos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              {selectedLogos.length} selected
            </span>
            <button
              onClick={() => setShowBulkModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Assign Pages
            </button>
            <button
              onClick={() => setSelectedLogos([])}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Logos Grid */}
      {filteredLogos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          backgroundColor: '#f9fafb',
          borderRadius: 12,
          border: '2px dashed #d1d5db',
        }}>
          <svg width="48" height="48" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ margin: '0 auto 16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 16 }}>No client logos yet</p>
          <button
            onClick={openAddModal}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Add Your First Logo
          </button>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={selectedLogos.length === filteredLogos.length && filteredLogos.length > 0}
              onChange={selectAll}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, color: '#6b7280' }}>Select All</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {filteredLogos.map((logo, index) => (
              <div
                key={logo._id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: selectedLogos.includes(logo._id) ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  overflow: 'hidden',
                  opacity: logo.active ? 1 : 0.6,
                  cursor: 'grab',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Logo Image */}
                <div style={{
                  height: 120,
                  backgroundColor: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  position: 'relative',
                }}>
                  {/* Checkbox */}
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <input
                      type="checkbox"
                      checked={selectedLogos.includes(logo._id)}
                      onChange={() => toggleSelectLogo(logo._id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </div>

                  {/* Active Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleActive(logo); }}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: logo.active ? '#22c55e' : '#e5e7eb',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: logo.active ? 21 : 3,
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }} />
                  </button>

                  <img
                    src={logo.logo}
                    alt={logo.name}
                    style={{
                      maxWidth: '80%',
                      maxHeight: '80%',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                {/* Logo Info */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                      {logo.name}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => openEditModal(logo)}
                        style={{
                          padding: 6,
                          backgroundColor: '#eff6ff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(logo._id)}
                        style={{
                          padding: 6,
                          backgroundColor: '#fef2f2',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Page Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {logo.showOnPages && logo.showOnPages.length > 0 ? (
                      logo.showOnPages.map(pageId => {
                        const page = AVAILABLE_PAGES.find(p => p.id === pageId);
                        return page ? (
                          <span
                            key={pageId}
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 4,
                              backgroundColor: `${page.color}15`,
                              color: page.color,
                              fontWeight: 500,
                            }}
                          >
                            {page.label}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                        No pages assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
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
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            margin: 16,
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>
                  {editingLogo ? 'Edit Client Logo' : 'Add New Client Logo'}
                </h2>
              </div>

              <div style={{ padding: 24 }}>
                {/* Logo Upload */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                    Logo Image *
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: 12,
                      padding: 24,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#f9fafb',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {formData.logo ? (
                      <div>
                        <img
                          src={formData.logo}
                          alt="Preview"
                          style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain', marginBottom: 12 }}
                        />
                        <p style={{ fontSize: 13, color: '#6b7280' }}>Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <svg width="40" height="40" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                          {uploading ? 'Uploading...' : 'Click to upload logo'}
                        </p>
                        <p style={{ fontSize: 12, color: '#9ca3af' }}>PNG, JPG, SVG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Client Name */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Amazon, Nike, etc."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                      fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Show on Pages */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 12 }}>
                    Show on Pages
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {AVAILABLE_PAGES.map(page => (
                      <label
                        key={page.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: formData.showOnPages.includes(page.id)
                            ? `2px solid ${page.color}`
                            : '1px solid #e5e7eb',
                          backgroundColor: formData.showOnPages.includes(page.id)
                            ? `${page.color}08`
                            : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.showOnPages.includes(page.id)}
                          onChange={() => handlePageToggle(page.id)}
                          style={{ width: 18, height: 18, accentColor: page.color }}
                        />
                        <span style={{
                          fontSize: 14,
                          fontWeight: formData.showOnPages.includes(page.id) ? 500 : 400,
                          color: formData.showOnPages.includes(page.id) ? page.color : '#374151',
                        }}>
                          {page.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Active Toggle */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14, color: '#374151' }}>Active (visible on website)</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: 24,
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
              }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: saving ? '#93c5fd' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {saving ? 'Saving...' : editingLogo ? 'Save Changes' : 'Add Logo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkModal && (
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
            maxWidth: 450,
            width: '100%',
            margin: 16,
          }}>
            <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                Assign Pages to {selectedLogos.length} Logo{selectedLogos.length > 1 ? 's' : ''}
              </h2>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Select pages to assign to the selected logos:
              </p>

              {AVAILABLE_PAGES.map(page => (
                <button
                  key={page.id}
                  onClick={() => handleBulkAssign([page.id], 'add')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '14px 16px',
                    marginBottom: 8,
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${page.color}10`;
                    e.currentTarget.style.borderColor = page.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    {page.label}
                  </span>
                  <span style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    backgroundColor: page.color,
                    color: '#fff',
                    borderRadius: 4,
                    fontWeight: 500,
                  }}>
                    Add
                  </span>
                </button>
              ))}

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => handleBulkAssign(AVAILABLE_PAGES.map(p => p.id), 'replace')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginBottom: 8,
                  }}
                >
                  Add to All Pages
                </button>
                <button
                  onClick={() => handleBulkAssign([], 'replace')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Remove from All Pages
                </button>
              </div>
            </div>

            <div style={{
              padding: 24,
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowBulkModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientLogosManager;
