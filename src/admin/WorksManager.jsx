import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { worksAPI, uploadAPI, pagesAPI } from '../services/api';

const WorksList = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      const response = await worksAPI.getAll();
      setWorks(response.data.data);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this work?')) {
      try {
        await worksAPI.delete(id);
        fetchWorks();
      } catch (error) {
        console.error('Error deleting work:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Works / Projects</h1>
        <Link
          to="/admin/works/new"
          style={{ backgroundColor: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
        >
          Add New Project
        </Link>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Image
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Title
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Tags
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
            {works.map((work) => (
              <tr key={work._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px 24px' }}>
                  {work.image ? (
                    <img
                      src={work.image}
                      alt={work.title}
                      style={{ height: '64px', width: '96px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  ) : (
                    <div style={{ height: '64px', width: '96px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No image</div>
                  )}
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 500, color: '#111827' }}>{work.title}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {work.tags?.map((tag, i) => (
                      <span
                        key={i}
                        style={{ padding: '2px 8px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '4px', fontSize: '12px' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      backgroundColor: work.published ? '#dcfce7' : '#f3f4f6',
                      color: work.published ? '#166534' : '#374151',
                    }}
                  >
                    {work.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <Link
                    to={`/admin/works/edit/${work._id}`}
                    style={{ color: '#2563eb', textDecoration: 'none', marginRight: '12px' }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(work._id)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {works.length === 0 && (
          <p style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
            No projects found. Add your first project!
          </p>
        )}
      </div>
    </div>
  );
};

const WorkForm = ({ isEdit }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [imagePreview, setImagePreview] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [serviceTypesInput, setServiceTypesInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      image: '',
      tags: [],
      category: '',
      client: '',
      link: '',
      serviceTypes: [],
      published: true,
      featured: false,
    },
  });

  // Fetch categories from page content
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await pagesAPI.getOne('work');
      const content = response.data.data?.content || {};
      const cats = content.categories || ['Lifestyle', 'Branding', 'Fashion and Apparels', 'Fitness and Nutritions'];
      // Handle both array and string formats
      const parsedCats = Array.isArray(cats) ? cats : cats.split(',').map(c => c.trim()).filter(c => c);
      setCategories(parsedCats);
    } catch (error) {
      // Use default categories if page not configured
      setCategories(['Lifestyle', 'Branding', 'Fashion and Apparels', 'Fitness and Nutritions']);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      alert('Category already exists');
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];

    try {
      // Save to page content
      await pagesAPI.update('work', { content: { categories: updatedCategories } });
      setCategories(updatedCategories);
      setNewCategory('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. Please try again.');
    }
  };

  const handleDeleteCategory = async (categoryToDelete) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryToDelete}" category?`)) return;

    const updatedCategories = categories.filter(cat => cat !== categoryToDelete);

    try {
      await pagesAPI.update('work', { content: { categories: updatedCategories } });
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category. Please try again.');
    }
  };

  useEffect(() => {
    if (isEdit && id) {
      fetchWork();
    }
  }, [isEdit, id]);

  const fetchWork = async () => {
    try {
      const response = await worksAPI.getOne(id);
      const work = response.data.data;
      reset(work);
      setImagePreview(work.image);
      setTagsInput(work.tags?.join(', ') || '');
      setServiceTypesInput(work.serviceTypes?.join(', ') || '');
    } catch (error) {
      console.error('Error fetching work:', error);
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Process tags and serviceTypes from comma-separated strings
      const processedData = {
        ...data,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        serviceTypes: serviceTypesInput
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
      };

      if (isEdit) {
        await worksAPI.update(id, processedData);
      } else {
        await worksAPI.create(processedData);
      }
      navigate('/admin/works');
    } catch (error) {
      console.error('Error saving work:', error);
      const errorMessage = error.response?.data?.message || 'Error saving project. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await uploadAPI.single(formData);
        const imagePath = response.data.data.path;
        setValue('image', imagePath);
        setImagePreview(imagePath);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image. Please try again.');
      }
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link to="/admin/works" style={{ color: '#6b7280', display: 'flex' }}>
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
          {isEdit ? 'Edit Project' : 'Add New Project'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '32px', maxWidth: '768px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Project Title *</label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              style={inputStyle}
              placeholder="e.g., Rumble"
            />
            {errors.title && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description *</label>
            <textarea
              rows={4}
              {...register('description', { required: 'Description is required' })}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Lorem ipsum dolor sit amet consectetur..."
            ></textarea>
            {errors.description && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>{errors.description.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label style={labelStyle}>Project Image</label>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ ...inputStyle, padding: '8px 12px' }}
                />
                <input type="hidden" {...register('image')} />
              </div>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ height: '96px', width: '144px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags (shown on card)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              style={inputStyle}
              placeholder="Lifestyle, Fashion (comma separated)"
            />
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              These tags appear on the project card image
            </p>
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category (for filtering)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <select
                {...register('category')}
                style={{ ...inputStyle, cursor: 'pointer', flex: 1 }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: showAddCategory ? '#6b7280' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {showAddCategory ? 'Close' : 'Manage'}
              </button>
            </div>
            {showAddCategory && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                {/* Add new category */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category name"
                    style={{ ...inputStyle, flex: 1, backgroundColor: '#fff' }}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Existing categories list */}
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Existing Categories:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.length === 0 ? (
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>No categories yet</span>
                  ) : (
                    categories.map((cat) => (
                      <div
                        key={cat}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          backgroundColor: '#fff',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#dc2626',
                          }}
                          title="Delete category"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Service Types */}
          <div>
            <label style={labelStyle}>Service Types</label>
            <input
              type="text"
              value={serviceTypesInput}
              onChange={(e) => setServiceTypesInput(e.target.value)}
              style={inputStyle}
              placeholder="Website, Landing Pages, Applications (comma separated)"
            />
          </div>

          {/* Client */}
          <div>
            <label style={labelStyle}>Client Name</label>
            <input
              type="text"
              {...register('client')}
              style={inputStyle}
              placeholder="Client company name"
            />
          </div>

          {/* Link */}
          <div>
            <label style={labelStyle}>Project Link</label>
            <input
              type="url"
              {...register('link')}
              style={inputStyle}
              placeholder="https://example.com"
            />
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                {...register('published')}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Published</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                {...register('featured')}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Featured</span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
            </button>
            <Link
              to="/admin/works"
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

const WorksManager = () => {
  return (
    <Routes>
      <Route path="/" element={<WorksList />} />
      <Route path="/new" element={<WorkForm />} />
      <Route path="/edit/:id" element={<WorkForm isEdit />} />
    </Routes>
  );
};

export default WorksManager;
