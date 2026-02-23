import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pagesAPI, caseStudiesAPI } from '../services/api';

const CaseStudyPageEditor = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caseStudies, setCaseStudies] = useState([]);
  const [formData, setFormData] = useState({
    seoTitle: 'Case Studies | It\'s Goti',
    seoDescription: 'Explore our case studies showcasing successful projects and client collaborations.',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pageResponse, caseStudiesResponse] = await Promise.all([
        pagesAPI.getOne('case-study').catch(() => null),
        caseStudiesAPI.getAll(),
      ]);

      if (pageResponse?.data?.data?.content) {
        setFormData(pageResponse.data.data.content);
      }
      setCaseStudies(caseStudiesResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pagesAPI.update('case-study', { content: formData });
      onSave && onSave();
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '32px' }}>Loading...</div>;
  }

  const publishedCount = caseStudies.filter(cs => cs.published).length;
  const draftCount = caseStudies.filter(cs => !cs.published).length;

  return (
    <div>
      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#166534' }}>{publishedCount}</p>
          <p style={{ fontSize: '14px', color: '#166534' }}>Published</p>
        </div>
        <div style={{
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#92400e' }}>{draftCount}</p>
          <p style={{ fontSize: '14px', color: '#92400e' }}>Drafts</p>
        </div>
        <div style={{
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#1d4ed8' }}>{caseStudies.length}</p>
          <p style={{ fontSize: '14px', color: '#1d4ed8' }}>Total</p>
        </div>
      </div>

      {/* SEO Settings */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          SEO Settings
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
            SEO Title
          </label>
          <input
            type="text"
            name="seoTitle"
            value={formData.seoTitle || ''}
            onChange={handleChange}
            placeholder="Page title for search engines"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
            SEO Description
          </label>
          <textarea
            name="seoDescription"
            value={formData.seoDescription || ''}
            onChange={handleChange}
            placeholder="Page description for search engines"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* Recent Case Studies */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            Recent Case Studies
          </h3>
          <Link
            to="/admin/case-studies"
            onClick={onClose}
            style={{
              fontSize: '14px',
              color: '#2563eb',
              textDecoration: 'none',
            }}
          >
            View All &rarr;
          </Link>
        </div>

        {caseStudies.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '16px' }}>
            No case studies yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {caseStudies.slice(0, 5).map((cs) => (
              <div
                key={cs._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {cs.heroImage && (
                    <img
                      src={cs.heroImage}
                      alt={cs.title}
                      style={{
                        width: '40px',
                        height: '30px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                  <div>
                    <p style={{ fontWeight: 500, color: '#111827', fontSize: '14px' }}>
                      {cs.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>
                      {cs.client}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: cs.published ? '#dcfce7' : '#f3f4f6',
                  color: cs.published ? '#166534' : '#6b7280',
                }}>
                  {cs.published ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage Case Studies Link */}
      <div style={{
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '24px',
      }}>
        <p style={{ color: '#1d4ed8', marginBottom: '12px', fontSize: '14px' }}>
          Case studies are managed individually with full content editing.
        </p>
        <Link
          to="/admin/case-studies"
          onClick={onClose}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Manage Case Studies
        </Link>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb',
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default CaseStudyPageEditor;
