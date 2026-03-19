import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { worksAPI, uploadAPI, pagesAPI, caseStudiesAPI } from '../services/api';

const WorksList = ({ basePath = '/goti/admin/works' }) => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [saving, setSaving] = useState(false);

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

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(index);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();

    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Reorder the array
    const newWorks = [...works];
    const draggedWork = newWorks[draggedItem];
    newWorks.splice(draggedItem, 1);
    newWorks.splice(dropIndex, 0, draggedWork);

    setWorks(newWorks);
    setDraggedItem(null);
    setDragOverItem(null);

    // Save new order to database
    try {
      setSaving(true);
      const orderedIds = newWorks.map(work => work._id);
      await worksAPI.reorder(orderedIds);
    } catch (error) {
      console.error('Error saving order:', error);
      // Refresh to get correct order if save failed
      fetchWorks();
    } finally {
      setSaving(false);
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
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Works / Projects</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Drag rows to reorder projects. Changes save automatically.
            {saving && <span style={{ color: '#2563eb', marginLeft: '8px' }}>Saving...</span>}
          </p>
        </div>
        <Link
          to={`${basePath}/new`}
          style={{ backgroundColor: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
        >
          Add New Project
        </Link>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', width: '50px' }}>
                #
              </th>
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
            {works.map((work, index) => (
              <tr
                key={work._id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'grab',
                  backgroundColor: dragOverItem === index ? '#eff6ff' : 'transparent',
                  borderTop: dragOverItem === index ? '2px solid #2563eb' : 'none',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#9ca3af',
                  }}>
                    {/* Drag Handle Icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="6" r="1.5" />
                      <circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" />
                      <circle cx="15" cy="18" r="1.5" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{index + 1}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {work.image ? (
                    <img
                      src={work.image}
                      alt={work.title}
                      style={{ height: '64px', width: '96px', objectFit: 'cover', borderRadius: '4px' }}
                      draggable={false}
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
                    to={`${basePath}/edit/${work._id}`}
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

const WorkForm = ({ isEdit, basePath = '/goti/admin/works' }) => {
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
  const [caseStudies, setCaseStudies] = useState([]);
  const [caseStudySearch, setCaseStudySearch] = useState('');
  const [caseStudyDropdownOpen, setCaseStudyDropdownOpen] = useState(false);
  const caseStudyDropdownRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
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
      caseStudySlug: '',
      serviceTypes: [],
      published: true,
      featured: false,
    },
  });

  // Fetch categories from page content
  useEffect(() => {
    fetchCategories();
    fetchCaseStudies();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (caseStudyDropdownRef.current && !caseStudyDropdownRef.current.contains(event.target)) {
        setCaseStudyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCaseStudies = async () => {
    try {
      const response = await caseStudiesAPI.getAll();
      setCaseStudies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching case studies:', error);
    }
  };

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
    // Validate tags
    const parsedTags = tagsInput.split(',').map((t) => t.trim()).filter((t) => t);
    if (parsedTags.length === 0) {
      setError('tags', { type: 'manual', message: 'Please fill this field' });
      return;
    }
    clearErrors('tags');

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
      navigate(basePath);
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
        const imagePath = response.data.path || response.data.url;
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

  // Preview card data from form
  const previewData = {
    title: watch('title') || 'Project Title',
    description: watch('description') || 'Project description will appear here. Start typing to see the preview update in real-time.',
    image: imagePreview || '/placeholder.jpg',
    tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : ['Tag 1', 'Tag 2'],
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link to={basePath} style={{ color: '#6b7280', display: 'flex' }}>
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

      {/* Two column layout: Form + Preview */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Left: Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '32px', flex: '1', maxWidth: '600px' }}
        >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Project Title <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="text"
              {...register('title', { required: 'Please fill this field' })}
              style={{ ...inputStyle, borderColor: errors.title ? '#dc2626' : '#d1d5db' }}
              placeholder="e.g., Rumble"
            />
            {errors.title && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description <span style={{ color: '#dc2626' }}>*</span></label>
            <textarea
              rows={4}
              {...register('description', { required: 'Please fill this field' })}
              style={{ ...inputStyle, resize: 'vertical', borderColor: errors.description ? '#dc2626' : '#d1d5db' }}
              placeholder="Lorem ipsum dolor sit amet consectetur..."
            ></textarea>
            {errors.description && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>{errors.description.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label style={labelStyle}>Project Image <span style={{ color: '#dc2626' }}>*</span></label>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ ...inputStyle, padding: '8px 12px', borderColor: errors.image ? '#dc2626' : '#d1d5db' }}
                />
                <input type="hidden" {...register('image', { required: 'Please upload an image' })} />
                {errors.image && (
                  <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>{errors.image.message}</p>
                )}
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
            <label style={labelStyle}>Tags (shown on card) <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => {
                setTagsInput(e.target.value);
                if (e.target.value.trim()) clearErrors('tags');
              }}
              style={{ ...inputStyle, borderColor: errors.tags ? '#dc2626' : '#d1d5db' }}
              placeholder="Lifestyle, Fashion (comma separated)"
            />
            {errors.tags && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>{errors.tags.message}</p>
            )}
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
              These tags appear on the project card image
            </p>
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category (for filtering) <span style={{ color: '#dc2626' }}>*</span></label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <select
                {...register('category', { required: 'Please select a category' })}
                style={{ ...inputStyle, cursor: 'pointer', flex: 1, borderColor: errors.category ? '#dc2626' : '#d1d5db' }}
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
            {errors.category && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>{errors.category.message}</p>
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

          {/* Case Study Link */}
          <div style={{ position: 'relative' }} ref={caseStudyDropdownRef}>
            <label style={labelStyle}>
              Link to Case Study <span style={{ color: '#dc2626' }}>*</span>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400, marginLeft: '8px' }}>
                (When clicked, opens this case study)
              </span>
            </label>
            <input type="hidden" {...register('caseStudySlug', { required: 'Please select a case study' })} />
            <div
              onClick={() => setCaseStudyDropdownOpen(!caseStudyDropdownOpen)}
              style={{
                ...inputStyle,
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderColor: errors.caseStudySlug ? '#dc2626' : '#d1d5db',
              }}
            >
              <span style={{ color: watch('caseStudySlug') ? '#111827' : '#9ca3af' }}>
                {watch('caseStudySlug')
                  ? caseStudies.find(cs => cs.slug === watch('caseStudySlug'))?.title || watch('caseStudySlug')
                  : 'No case study linked'}
              </span>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>▼</span>
            </div>

            {caseStudyDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  marginTop: '4px',
                  maxHeight: '280px',
                  overflow: 'hidden',
                }}
              >
                {/* Search Input */}
                <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  <input
                    type="text"
                    placeholder="Search case studies..."
                    value={caseStudySearch}
                    onChange={(e) => setCaseStudySearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      ...inputStyle,
                      marginBottom: 0,
                      padding: '8px 12px',
                      fontSize: '13px',
                    }}
                    autoFocus
                  />
                </div>

                {/* Options */}
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <div
                    onClick={() => {
                      setValue('caseStudySlug', '');
                      setCaseStudyDropdownOpen(false);
                      setCaseStudySearch('');
                    }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      backgroundColor: !watch('caseStudySlug') ? '#eff6ff' : 'transparent',
                      borderLeft: !watch('caseStudySlug') ? '3px solid #2563eb' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = !watch('caseStudySlug') ? '#eff6ff' : 'transparent'}
                  >
                    <span style={{ color: '#6b7280' }}>No case study linked</span>
                  </div>

                  {caseStudies
                    .filter(cs =>
                      cs.title.toLowerCase().includes(caseStudySearch.toLowerCase()) ||
                      cs.slug.toLowerCase().includes(caseStudySearch.toLowerCase())
                    )
                    .map((cs) => (
                      <div
                        key={cs._id}
                        onClick={() => {
                          setValue('caseStudySlug', cs.slug);
                          setCaseStudyDropdownOpen(false);
                          setCaseStudySearch('');
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          backgroundColor: watch('caseStudySlug') === cs.slug ? '#eff6ff' : 'transparent',
                          borderLeft: watch('caseStudySlug') === cs.slug ? '3px solid #2563eb' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = watch('caseStudySlug') === cs.slug ? '#eff6ff' : 'transparent'}
                      >
                        <div style={{ fontWeight: 500, color: '#111827' }}>{cs.title}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>/case-studies/{cs.slug}</div>
                      </div>
                    ))
                  }

                  {caseStudies.filter(cs =>
                    cs.title.toLowerCase().includes(caseStudySearch.toLowerCase()) ||
                    cs.slug.toLowerCase().includes(caseStudySearch.toLowerCase())
                  ).length === 0 && caseStudySearch && (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                      No case studies found
                    </div>
                  )}
                </div>
              </div>
            )}

            {watch('caseStudySlug') && (
              <p style={{ fontSize: '12px', color: '#059669', marginTop: '6px' }}>
                ✓ Project will open: /case-studies/{watch('caseStudySlug')}
              </p>
            )}
            {errors.caseStudySlug && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginTop: '4px' }}>{errors.caseStudySlug.message}</p>
            )}
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
              to={basePath}
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

        {/* Right: Live Preview */}
        <div style={{
          width: '400px',
          flexShrink: 0,
          position: 'sticky',
          top: '100px',
          alignSelf: 'flex-start',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '20px',
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#6b7280',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Live Preview
            </h3>

            {/* Preview Card */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fafafa',
            }}>
              {/* Image */}
              <div style={{
                position: 'relative',
                height: '200px',
                backgroundColor: '#e5e7eb',
                overflow: 'hidden',
              }}>
                {previewData.image && previewData.image !== '/placeholder.jpg' ? (
                  <img
                    src={previewData.image}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: '14px',
                  }}>
                    Upload image to preview
                  </div>
                )}

                {/* Tags on Image */}
                {previewData.tags.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                  }}>
                    {previewData.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#fff',
                          borderRadius: '100px',
                          fontSize: '12px',
                          fontWeight: 400,
                          color: '#000',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '16px' }}>
                {/* Title */}
                <h4 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '20px',
                  fontWeight: 400,
                  color: '#0F0F0F',
                  marginBottom: '8px',
                  lineHeight: '1.3',
                }}>
                  {previewData.title}
                </h4>

                {/* Description */}
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#0F0F0F',
                  lineHeight: '1.5',
                  marginBottom: '0',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {previewData.description}
                </p>
              </div>
            </div>

            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginTop: '12px',
              textAlign: 'center',
            }}>
              This is how your project card will appear
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorksManager = ({ basePath = '/goti/admin/works' }) => {
  return (
    <Routes>
      <Route path="/" element={<WorksList basePath={basePath} />} />
      <Route path="/new" element={<WorkForm basePath={basePath} />} />
      <Route path="/edit/:id" element={<WorkForm isEdit basePath={basePath} />} />
    </Routes>
  );
};

export default WorksManager;
