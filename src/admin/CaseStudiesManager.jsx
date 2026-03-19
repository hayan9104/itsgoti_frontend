import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { caseStudiesAPI } from '../services/api';
import { CaseStudyEditor } from './caseStudyEditor';

// Case Studies List Component
const CaseStudiesList = ({ basePath = '/goti/admin/case-studies' }) => {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      const response = await caseStudiesAPI.getAll();
      setCaseStudies(response.data.data);
    } catch (error) {
      console.error('Error fetching case studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this case study?')) {
      try {
        await caseStudiesAPI.delete(id);
        fetchCaseStudies();
      } catch (error) {
        console.error('Error deleting case study:', error);
      }
    }
  };

  const handleTogglePublish = async (study) => {
    try {
      await caseStudiesAPI.update(study._id, { published: !study.published });
      fetchCaseStudies();
    } catch (error) {
      console.error('Error updating case study:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Case Studies</h1>
        <Link
          to={`${basePath}/new`}
          style={{ backgroundColor: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
        >
          Add New Case Study
        </Link>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Title
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Client
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Industry
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Status
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {caseStudies.map((study) => (
              <tr key={study._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {study.heroImage && (
                      <img
                        src={study.heroImage}
                        alt={study.title}
                        style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    )}
                    <span style={{ fontWeight: 500, color: '#111827' }}>{study.title}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: '#374151' }}>{study.client}</td>
                <td style={{ padding: '16px 24px', color: '#374151' }}>{study.industry || '-'}</td>
                <td style={{ padding: '16px 24px' }}>
                  <button
                    onClick={() => handleTogglePublish(study)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      backgroundColor: study.published ? '#dcfce7' : '#f3f4f6',
                      color: study.published ? '#166534' : '#374151',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {study.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <Link
                    to={`/case-studies/${study.slug}`}
                    target="_blank"
                    style={{ color: '#6b7280', textDecoration: 'none', marginRight: '12px' }}
                  >
                    View
                  </Link>
                  <Link
                    to={`${basePath}/edit/${study._id}`}
                    style={{ color: '#2563eb', textDecoration: 'none', marginRight: '12px' }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(study._id)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {caseStudies.length === 0 && (
          <p style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
            No case studies found. <Link to={`${basePath}/new`} style={{ color: '#2563eb' }}>Create your first one</Link>
          </p>
        )}
      </div>
    </div>
  );
};

// Main Manager Component
const CaseStudiesManager = ({ basePath = '/goti/admin/case-studies' }) => {
  return (
    <Routes>
      <Route path="/" element={<CaseStudiesList basePath={basePath} />} />
      <Route path="/new" element={<CaseStudyEditor isNew basePath={basePath} />} />
      <Route path="/edit/:id" element={<CaseStudyEditor basePath={basePath} />} />
    </Routes>
  );
};

export default CaseStudiesManager;
