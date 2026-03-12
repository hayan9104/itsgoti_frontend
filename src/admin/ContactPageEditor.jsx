import { useState, useEffect } from 'react';
import { pagesAPI, uploadAPI } from '../services/api';

const ContactPageEditor = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    // Hero Image
    heroImage: '',
    heroImageMobile: '',
    // Form Section
    formTitle: 'Tell us',
    formTitleItalic: 'more',
    // Form Labels
    nameLabel: 'Your Name',
    namePlaceholder: 'Your Name',
    emailLabel: 'Work Email',
    emailPlaceholder: 'example.svg.com',
    phoneLabel: 'Phone no.',
    phonePlaceholder: '+91 0000 000 000',
    messageLabel: 'How can we help?',
    messagePlaceholder: 'Describe your project',
    sourceLabel: 'How did you get to know about us?*',
    // Source Options
    sourceOptions: ['Social', 'Referral', 'Google', 'ChatGPT', 'Other'],
    // Submit Button
    submitButtonText: 'Submit',
    // Success Message
    successTitle: 'Thank you!',
    successMessage: "We've received your message and will get back to you soon.",
    successButtonText: 'Send another message',
  });

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const response = await pagesAPI.getOne('contact');
      if (response.data.data && response.data.data.content) {
        setFormData((prev) => ({
          ...prev,
          ...response.data.data.content,
        }));
      }
    } catch (error) {
      console.log('Using default content for contact page');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSourceOptionChange = (index, value) => {
    setFormData((prev) => {
      const newOptions = [...prev.sourceOptions];
      newOptions[index] = value;
      return { ...prev, sourceOptions: newOptions };
    });
  };

  const addSourceOption = () => {
    setFormData((prev) => ({
      ...prev,
      sourceOptions: [...prev.sourceOptions, ''],
    }));
  };

  const removeSourceOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      sourceOptions: prev.sourceOptions.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const response = await uploadAPI.single(uploadFormData);
      setFormData((prev) => ({
        ...prev,
        [fieldName]: response.data.data.path,
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await pagesAPI.update('contact', {
        name: 'contact',
        title: 'Contact Page',
        content: formData,
      });
      alert('Contact page updated successfully!');
      if (onSave) onSave();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving contact page:', error);
      alert('Error saving page. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '4px',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px',
  };

  const sectionStyle = {
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  };

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
  };

  const imagePreviewStyle = {
    width: '100%',
    maxWidth: '200px',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginTop: '8px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
      {/* Hero Image Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Hero Image (Left Side)</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Desktop Image */}
          <div>
            <label style={labelStyle}>Desktop Image</label>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              Recommended size: 800x800px or larger
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'heroImage')}
              style={{ marginTop: '4px' }}
            />
            {formData.heroImage ? (
              <div style={{ marginTop: '12px' }}>
                <img src={formData.heroImage} alt="Hero Desktop" style={imagePreviewStyle} />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, heroImage: '' }))}
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div
                style={{
                  marginTop: '12px',
                  width: '100%',
                  maxWidth: '200px',
                  height: '150px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: '14px',
                }}
              >
                No image
              </div>
            )}
          </div>

          {/* Mobile Image */}
          <div>
            <label style={labelStyle}>Mobile Image</label>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              Recommended size: 600x400px
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'heroImageMobile')}
              style={{ marginTop: '4px' }}
            />
            {formData.heroImageMobile ? (
              <div style={{ marginTop: '12px' }}>
                <img src={formData.heroImageMobile} alt="Hero Mobile" style={imagePreviewStyle} />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, heroImageMobile: '' }))}
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div
                style={{
                  marginTop: '12px',
                  width: '100%',
                  maxWidth: '200px',
                  height: '150px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: '14px',
                }}
              >
                No image
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Title Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Form Title</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Title (Normal)</label>
            <input
              type="text"
              name="formTitle"
              value={formData.formTitle}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Tell us"
            />
          </div>
          <div>
            <label style={labelStyle}>Title (Italic)</label>
            <input
              type="text"
              name="formTitleItalic"
              value={formData.formTitleItalic}
              onChange={handleChange}
              style={{ ...inputStyle, fontStyle: 'italic' }}
              placeholder="more"
            />
          </div>
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          Preview: {formData.formTitle} <em>{formData.formTitleItalic}</em>..
        </p>
      </div>

      {/* Form Fields Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Form Field Labels & Placeholders</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Name Label</label>
            <input
              type="text"
              name="nameLabel"
              value={formData.nameLabel}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Name Placeholder</label>
            <input
              type="text"
              name="namePlaceholder"
              value={formData.namePlaceholder}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Email Label</label>
            <input
              type="text"
              name="emailLabel"
              value={formData.emailLabel}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email Placeholder</label>
            <input
              type="text"
              name="emailPlaceholder"
              value={formData.emailPlaceholder}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Phone Label</label>
            <input
              type="text"
              name="phoneLabel"
              value={formData.phoneLabel}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone Placeholder</label>
            <input
              type="text"
              name="phonePlaceholder"
              value={formData.phonePlaceholder}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Message Label</label>
            <input
              type="text"
              name="messageLabel"
              value={formData.messageLabel}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Message Placeholder</label>
            <input
              type="text"
              name="messagePlaceholder"
              value={formData.messagePlaceholder}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Source Question Label</label>
          <input
            type="text"
            name="sourceLabel"
            value={formData.sourceLabel}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Source Options Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Source Options (Pill Buttons)</h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          These are the options users can select for "How did you get to know about us?"
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {formData.sourceOptions.map((option, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={option}
                onChange={(e) => handleSourceOptionChange(index, e.target.value)}
                style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                placeholder={`Option ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeSourceOption(index)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addSourceOption}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          + Add Option
        </button>
      </div>

      {/* Submit Button Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Submit Button</h3>

        <div>
          <label style={labelStyle}>Button Text</label>
          <input
            type="text"
            name="submitButtonText"
            value={formData.submitButtonText}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Submit"
          />
        </div>
      </div>

      {/* Success Message Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Success Message (After Form Submit)</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Success Title</label>
          <input
            type="text"
            name="successTitle"
            value={formData.successTitle}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Thank you!"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Success Message</label>
          <textarea
            name="successMessage"
            value={formData.successMessage}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            placeholder="We've received your message..."
          />
        </div>

        <div>
          <label style={labelStyle}>Button Text (Send Another)</label>
          <input
            type="text"
            name="successButtonText"
            value={formData.successButtonText}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Send another message"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '24px',
        position: 'sticky',
        bottom: 0,
        backgroundColor: '#fff',
        padding: '16px 0'
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
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
            backgroundColor: '#2563eb',
            color: '#fff',
            borderRadius: '6px',
            border: 'none',
            cursor: (saving || uploading) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: (saving || uploading) ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default ContactPageEditor;
