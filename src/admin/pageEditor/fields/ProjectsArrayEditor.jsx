import { useState, useEffect } from 'react';
import { worksAPI } from '../../../services/api';

const ProjectsArrayEditor = ({ field, value = [], onChange }) => {
  const [allWorks, setAllWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      const response = await worksAPI.getAll();
      setAllWorks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get project data from value array
  const getProjectData = (projectId) => {
    const items = value || [];
    // Support both old format (array of IDs) and new format (array of objects)
    const item = items.find(i =>
      typeof i === 'string' ? i === projectId : i.id === projectId
    );
    if (!item) return null;
    if (typeof item === 'string') return { id: item, customDescription: '' };
    return item;
  };

  const isProjectSelected = (projectId) => {
    return getProjectData(projectId) !== null;
  };

  const handleToggle = (projectId) => {
    const currentItems = value || [];
    const isSelected = isProjectSelected(projectId);

    if (isSelected) {
      // Remove project
      const newItems = currentItems.filter(item =>
        typeof item === 'string' ? item !== projectId : item.id !== projectId
      );
      onChange(newItems);
    } else {
      // Add project with empty custom description
      const newItems = [...currentItems, { id: projectId, customDescription: '' }];
      onChange(newItems);
    }
  };

  const handleDescriptionChange = (projectId, description) => {
    const currentItems = value || [];
    const newItems = currentItems.map(item => {
      const itemId = typeof item === 'string' ? item : item.id;
      if (itemId === projectId) {
        return { id: projectId, customDescription: description };
      }
      return typeof item === 'string' ? { id: item, customDescription: '' } : item;
    });
    onChange(newItems);
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };

  const selectedCount = (value || []).length;

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Loading projects...
      </div>
    );
  }

  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '8px',
      }}>
        {field.label}
        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
          ({selectedCount} selected)
        </span>
      </label>

      {field.hint && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          {field.hint}
        </p>
      )}

      {allWorks.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px' }}>
          No projects found. Add projects in the Works section first.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
          {allWorks.map((work) => {
            const isSelected = isProjectSelected(work._id);
            const projectData = getProjectData(work._id);
            return (
              <div
                key={work._id}
                style={{
                  backgroundColor: isSelected ? '#eff6ff' : '#f9fafb',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(work._id)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      accentColor: '#3b82f6',
                    }}
                  />
                  <div style={{
                    width: '60px',
                    height: '45px',
                    flexShrink: 0,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: '#e5e7eb',
                  }}>
                    {work.image && (
                      <img
                        src={getImageUrl(work.image)}
                        alt={work.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: '4px',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {work.title}
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {work.description?.substring(0, 50)}...
                    </p>
                  </div>
                </label>

                {/* Custom Description Input - Only show when selected */}
                {isSelected && (
                  <div style={{
                    padding: '0 14px 14px 14px',
                    marginTop: '-4px',
                  }}>
                    <input
                      type="text"
                      placeholder="Short description for home page (leave empty to use default)"
                      value={projectData?.customDescription || ''}
                      onChange={(e) => handleDescriptionChange(work._id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px', marginBottom: 0 }}>
                      Leave empty to use default description
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectsArrayEditor;
