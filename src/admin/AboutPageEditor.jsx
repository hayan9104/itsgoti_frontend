import { useState, useEffect } from 'react';
import { pagesAPI, uploadAPI } from '../services/api';

const AboutPageEditor = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroDesktopOpen, setHeroDesktopOpen] = useState(false);
  const [heroMobileOpen, setHeroMobileOpen] = useState(false);
  const [logosDesktopOpen, setLogosDesktopOpen] = useState(false);
  const [logosMobileOpen, setLogosMobileOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Hero Section
    heroTitle1: 'What matters',
    heroTitle1Italic: 'tomorrow,',
    heroTitle2: 'We design',
    heroTitle2Italic: 'today.',
    // Desktop Hero Images
    heroImage1: '',
    heroImage2: '',
    // Mobile Hero Images
    heroImage1Mobile: '',
    heroImage2Mobile: '',
    // Design Box
    designBoxSubtitle: "Design isn't decoration.",
    designBoxLine1: "It's clarity,",
    designBoxLine2: "It's leverage,",
    designBoxLine3: "It's momentum.",
    designBoxLink: 'Explore Our Work',
    // You don't need section
    sectionTitle: 'You don\'t need "70+" people.',
    sectionSubtitle: 'You need elite energy.',
    sectionDescription: 'We are UX/UI agency helping ambitious companies and visionary entrepreneurs bring the next design revolution.',
    sectionAvatars: [
      { id: 1, image: '' },
      { id: 2, image: '' },
      { id: 3, image: '' },
      { id: 4, image: '' },
    ],
    logos: [
      { name: 'TOMATTIC', id: 1, image: '' },
      { name: 'TheStoryple', id: 2, image: '' },
      { name: 'SPEECH', id: 3, image: '' },
      { name: 'gusto', id: 4, image: '' },
      { name: 'attentive', id: 5, image: '' },
      { name: 'SONY', id: 6, image: '' },
      { name: 'Square', id: 7, image: '' },
      { name: 'AdMob', id: 8, image: '' },
      { name: 'drips', id: 9, image: '' },
      { name: 'Dropbox', id: 10, image: '' },
    ],
    logosMobile: [
      { name: 'TOMATTIC', id: 1, image: '' },
      { name: 'TheStoryple', id: 2, image: '' },
      { name: 'SPEECH', id: 3, image: '' },
      { name: 'gusto', id: 4, image: '' },
      { name: 'attentive', id: 5, image: '' },
      { name: 'SONY', id: 6, image: '' },
    ],
    // 10 Minds section
    mindsTitle: '10 Minds. Built Different.',
    mindsImage: '',
    mindsImages: [
      { id: 1, image: '' },
      { id: 2, image: '' },
      { id: 3, image: '' },
    ],
    mindsDescription: 'GOTI is a name that sparks curiosity and stays with you. Beyond its simplicity, it represents strategy, unity, and bold movement in everything we build.',
    mindsClientLabel: 'Look what our client said..',
    // Stats
    stats: [
      { value: '+90%', label: 'Success Rate' },
      { value: '+14%', label: 'Growth' },
      { value: '+50', label: 'Projects' },
    ],
    // Testimonial
    testimonialTextItalic: 'GOTI',
    testimonialTextNormal: 'is a name that sparks curiosity and stays with you. Beyond its simplicity, it represents strategy, unity, and bold movement in everything we build.',
    clientLabelItalic: 'Look',
    clientLabelNormal: 'what our client said..',
    testimonialQuote1: 'Lorem ipsum dolor sit amet consectetur. Ullamcorper amet arcu quis elementum. Convallis purus mauris at in.',
    testimonialQuote2: 'Pretium pharetra aliquam consequat duis ac risus vitae sollicitudin pharetra.',
    testimonialAuthor: 'Joyce Mia',
    testimonialRole: 'Founder',
    testimonialImage: '',
    // CTA Section
    ctaTitle: 'Ready to start a project?',
    ctaDescription: 'We combine strategy, design, and performance to create experiences that convert.',
    ctaButtonText: 'Schedule Call',
  });

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const response = await pagesAPI.getOne('about');
      if (response.data.data && response.data.data.content) {
        setFormData((prev) => ({
          ...prev,
          ...response.data.data.content,
        }));
      }
    } catch (error) {
      console.log('Using default content for about page');
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

  const handleStatChange = (index, field, value) => {
    setFormData((prev) => {
      const newStats = [...prev.stats];
      newStats[index] = { ...newStats[index], [field]: value };
      return { ...prev, stats: newStats };
    });
  };

  const handleLogoChange = (index, field, value) => {
    setFormData((prev) => {
      const newLogos = [...prev.logos];
      newLogos[index] = { ...newLogos[index], [field]: value };
      return { ...prev, logos: newLogos };
    });
  };

  const handleLogoImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const response = await uploadAPI.single(uploadFormData);
      setFormData((prev) => {
        const newLogos = [...prev.logos];
        newLogos[index] = { ...newLogos[index], image: response.data.data.path };
        return { ...prev, logos: newLogos };
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoMobileChange = (index, field, value) => {
    setFormData((prev) => {
      const newLogos = [...(prev.logosMobile || [])];
      newLogos[index] = { ...newLogos[index], [field]: value };
      return { ...prev, logosMobile: newLogos };
    });
  };

  const handleLogoMobileImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const response = await uploadAPI.single(uploadFormData);
      setFormData((prev) => {
        const newLogos = [...(prev.logosMobile || [])];
        newLogos[index] = { ...newLogos[index], image: response.data.data.path };
        return { ...prev, logosMobile: newLogos };
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Add new desktop logo
  const addDesktopLogo = () => {
    setFormData((prev) => {
      const newId = prev.logos.length > 0 ? Math.max(...prev.logos.map(l => l.id)) + 1 : 1;
      return {
        ...prev,
        logos: [...prev.logos, { name: '', id: newId, image: '' }]
      };
    });
  };

  // Remove desktop logo
  const removeDesktopLogo = (index) => {
    setFormData((prev) => {
      const newLogos = prev.logos.filter((_, i) => i !== index);
      return { ...prev, logos: newLogos };
    });
  };

  // Add new mobile logo
  const addMobileLogo = () => {
    setFormData((prev) => {
      const mobileLogos = prev.logosMobile || [];
      const newId = mobileLogos.length > 0 ? Math.max(...mobileLogos.map(l => l.id)) + 1 : 1;
      return {
        ...prev,
        logosMobile: [...mobileLogos, { name: '', id: newId, image: '' }]
      };
    });
  };

  // Remove mobile logo
  const removeMobileLogo = (index) => {
    setFormData((prev) => {
      const newLogos = (prev.logosMobile || []).filter((_, i) => i !== index);
      return { ...prev, logosMobile: newLogos };
    });
  };

  const handleAvatarImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const response = await uploadAPI.single(uploadFormData);
      setFormData((prev) => {
        const newAvatars = [...(prev.sectionAvatars || [])];
        newAvatars[index] = { ...newAvatars[index], image: response.data.data.path };
        return { ...prev, sectionAvatars: newAvatars };
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = (index, value) => {
    setFormData((prev) => {
      const newAvatars = [...(prev.sectionAvatars || [])];
      newAvatars[index] = { ...newAvatars[index], image: value };
      return { ...prev, sectionAvatars: newAvatars };
    });
  };

  const handleMindsImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const response = await uploadAPI.single(uploadFormData);
      setFormData((prev) => {
        const newImages = [...(prev.mindsImages || [])];
        newImages[index] = { ...newImages[index], image: response.data.data.path };
        return { ...prev, mindsImages: newImages };
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleMindsImageChange = (index, value) => {
    setFormData((prev) => {
      const newImages = [...(prev.mindsImages || [])];
      newImages[index] = { ...newImages[index], image: value };
      return { ...prev, mindsImages: newImages };
    });
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const response = await uploadAPI.single(uploadFormData);
      // Upload API returns { success: true, data: { filename, path } }
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
      await pagesAPI.update('about', {
        name: 'about',
        title: formData.heroTitle1,
        content: formData,
      });
      alert('About page updated successfully!');
      if (onSave) onSave();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving about page:', error);
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
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginTop: '8px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
      {/* Hero Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Hero Section</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Title Part 1</label>
            <input
              type="text"
              name="heroTitle1"
              value={formData.heroTitle1}
              onChange={handleChange}
              style={inputStyle}
              placeholder="What matters"
            />
          </div>
          <div>
            <label style={labelStyle}>Title Part 1 Italic</label>
            <input
              type="text"
              name="heroTitle1Italic"
              value={formData.heroTitle1Italic}
              onChange={handleChange}
              style={{ ...inputStyle, fontStyle: 'italic' }}
              placeholder="tomorrow,"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div>
            <label style={labelStyle}>Title Part 2</label>
            <input
              type="text"
              name="heroTitle2"
              value={formData.heroTitle2}
              onChange={handleChange}
              style={inputStyle}
              placeholder="We design"
            />
          </div>
          <div>
            <label style={labelStyle}>Title Part 2 Italic</label>
            <input
              type="text"
              name="heroTitle2Italic"
              value={formData.heroTitle2Italic}
              onChange={handleChange}
              style={{ ...inputStyle, fontStyle: 'italic' }}
              placeholder="today."
            />
          </div>
        </div>

        {/* Desktop Images Dropdown */}
        <div style={{ marginTop: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setHeroDesktopOpen(!heroDesktopOpen)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <span>🖥️ Desktop Images</span>
            <span>{heroDesktopOpen ? '▲' : '▼'}</span>
          </button>
          {heroDesktopOpen && (
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Hero Image 1 (Large)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'heroImage1')}
                  style={{ marginTop: '4px' }}
                />
                {formData.heroImage1 && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e5e7eb', borderRadius: '8px' }}>
                    <img src={formData.heroImage1} alt="Hero 1" style={imagePreviewStyle} />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, heroImage1: '' }))}
                      style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Hero Image 2 (Small)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'heroImage2')}
                  style={{ marginTop: '4px' }}
                />
                {formData.heroImage2 && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e5e7eb', borderRadius: '8px' }}>
                    <img src={formData.heroImage2} alt="Hero 2" style={imagePreviewStyle} />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, heroImage2: '' }))}
                      style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Images Dropdown */}
        <div style={{ marginTop: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setHeroMobileOpen(!heroMobileOpen)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <span>📱 Mobile Images</span>
            <span>{heroMobileOpen ? '▲' : '▼'}</span>
          </button>
          {heroMobileOpen && (
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Hero Image 1 Mobile (348x273)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'heroImage1Mobile')}
                  style={{ marginTop: '4px' }}
                />
                {formData.heroImage1Mobile && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e5e7eb', borderRadius: '8px' }}>
                    <img src={formData.heroImage1Mobile} alt="Hero 1 Mobile" style={imagePreviewStyle} />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, heroImage1Mobile: '' }))}
                      style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Hero Image 2 Mobile (430x274)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'heroImage2Mobile')}
                  style={{ marginTop: '4px' }}
                />
                {formData.heroImage2Mobile && (
                  <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e5e7eb', borderRadius: '8px' }}>
                    <img src={formData.heroImage2Mobile} alt="Hero 2 Mobile" style={imagePreviewStyle} />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, heroImage2Mobile: '' }))}
                      style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Design Box Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Design Box (Black Card)</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Subtitle</label>
          <input
            type="text"
            name="designBoxSubtitle"
            value={formData.designBoxSubtitle}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Design isn't decoration."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Line 1</label>
            <input
              type="text"
              name="designBoxLine1"
              value={formData.designBoxLine1}
              onChange={handleChange}
              style={inputStyle}
              placeholder="It's clarity,"
            />
          </div>
          <div>
            <label style={labelStyle}>Line 2</label>
            <input
              type="text"
              name="designBoxLine2"
              value={formData.designBoxLine2}
              onChange={handleChange}
              style={inputStyle}
              placeholder="It's leverage,"
            />
          </div>
          <div>
            <label style={labelStyle}>Line 3</label>
            <input
              type="text"
              name="designBoxLine3"
              value={formData.designBoxLine3}
              onChange={handleChange}
              style={inputStyle}
              placeholder="It's momentum."
            />
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Link Text</label>
          <input
            type="text"
            name="designBoxLink"
            value={formData.designBoxLink}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Explore Our Work"
          />
        </div>
      </div>

      {/* You don't need section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>"You Don't Need" Section</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Section Title</label>
            <input
              type="text"
              name="sectionTitle"
              value={formData.sectionTitle}
              onChange={handleChange}
              style={inputStyle}
              placeholder='You don&apos;t need "70+" people.'
            />
          </div>
          <div>
            <label style={labelStyle}>Section Subtitle</label>
            <input
              type="text"
              name="sectionSubtitle"
              value={formData.sectionSubtitle}
              onChange={handleChange}
              style={inputStyle}
              placeholder="You need elite energy."
            />
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Section Description</label>
          <textarea
            name="sectionDescription"
            value={formData.sectionDescription}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            placeholder="We are UX/UI agency helping ambitious companies..."
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Avatar Images (shown next to subtitle)</label>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Upload 4 avatar images. If no image uploaded, a gray placeholder will show.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {(formData.sectionAvatars || []).map((avatar, index) => (
              <div key={avatar.id} style={{ textAlign: 'center' }}>
                {avatar.image ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={avatar.image}
                      alt={`Avatar ${index + 1}`}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAvatarChange(index, '')}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '10px',
                        lineHeight: '1',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#6b7280',
                    }}
                  >
                    {index + 1}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarImageUpload(e, index)}
                  style={{ width: '48px', fontSize: '8px', marginTop: '4px' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Client Logos</label>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Upload logo images. If no image is uploaded, the name will be displayed as text.</p>

          {/* Desktop Logos Dropdown */}
          <div style={{ marginTop: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setLogosDesktopOpen(!logosDesktopOpen)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <span>🖥️ Desktop Logos ({formData.logos.length} logos)</span>
              <span>{logosDesktopOpen ? '▲' : '▼'}</span>
            </button>
            {logosDesktopOpen && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {formData.logos.map((logo, index) => (
                    <div key={logo.id} style={{ padding: '12px', backgroundColor: '#e5e7eb', borderRadius: '8px', position: 'relative' }}>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeDesktopLogo(index)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          lineHeight: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', paddingRight: '24px' }}>
                        <input
                          type="text"
                          value={logo.name}
                          onChange={(e) => handleLogoChange(index, 'name', e.target.value)}
                          style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                          placeholder={`Logo ${index + 1} name`}
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoImageUpload(e, index)}
                        style={{ fontSize: '12px' }}
                      />
                      {logo.image && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={logo.image} alt={logo.name} style={{ height: '24px', width: 'auto' }} />
                          <button
                            type="button"
                            onClick={() => handleLogoChange(index, 'image', '')}
                            style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Add Desktop Logo Button */}
                <button
                  type="button"
                  onClick={addDesktopLogo}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  + Add Logo
                </button>
              </div>
            )}
          </div>

          {/* Mobile Logos Dropdown */}
          <div style={{ marginTop: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setLogosMobileOpen(!logosMobileOpen)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <span>📱 Mobile Logos ({(formData.logosMobile || []).length} logos)</span>
              <span>{logosMobileOpen ? '▲' : '▼'}</span>
            </button>
            {logosMobileOpen && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {(formData.logosMobile || []).map((logo, index) => (
                    <div key={logo.id} style={{ padding: '12px', backgroundColor: '#e5e7eb', borderRadius: '8px', position: 'relative' }}>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeMobileLogo(index)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          lineHeight: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', paddingRight: '24px' }}>
                        <input
                          type="text"
                          value={logo.name}
                          onChange={(e) => handleLogoMobileChange(index, 'name', e.target.value)}
                          style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                          placeholder={`Logo ${index + 1} name`}
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoMobileImageUpload(e, index)}
                        style={{ fontSize: '12px' }}
                      />
                      {logo.image && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={logo.image} alt={logo.name} style={{ height: '24px', width: 'auto' }} />
                          <button
                            type="button"
                            onClick={() => handleLogoMobileChange(index, 'image', '')}
                            style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Add Mobile Logo Button */}
                <button
                  type="button"
                  onClick={addMobileLogo}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  + Add Logo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 10 Minds Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>10 Minds Section</h3>

        <div>
          <label style={labelStyle}>Section Title</label>
          <input
            type="text"
            name="mindsTitle"
            value={formData.mindsTitle}
            onChange={handleChange}
            style={inputStyle}
            placeholder="10 Minds. Built Different."
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Scroll Images (Images change as user scrolls)</label>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Upload 3 images that will transition as the user scrolls through this section.</p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            {(formData.mindsImages || []).map((img, index) => (
              <div key={img.id} style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>Image {index + 1}</p>
                {img.image ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={img.image}
                      alt={`Scroll ${index + 1}`}
                      style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleMindsImageChange(index, '')}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '120px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      fontSize: '12px',
                    }}
                  >
                    No image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMindsImageUpload(e, index)}
                  style={{ fontSize: '10px', marginTop: '8px', width: '100%' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Description</label>
          <textarea
            name="mindsDescription"
            value={formData.mindsDescription}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            placeholder="GOTI is a name that sparks curiosity..."
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Stats</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '8px' }}>
            {formData.stats.map((stat, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                  style={{ ...inputStyle, marginTop: 0, width: '60px' }}
                  placeholder="+90%"
                />
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                  style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                  placeholder="Success Rate"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Testimonial Section</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Description Text</label>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>First word in italic, rest normal</p>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px' }}>
            <input
              type="text"
              name="testimonialTextItalic"
              value={formData.testimonialTextItalic}
              onChange={handleChange}
              style={{ ...inputStyle, fontStyle: 'italic' }}
              placeholder="GOTI"
            />
            <textarea
              name="testimonialTextNormal"
              value={formData.testimonialTextNormal}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              placeholder="is a name that sparks curiosity..."
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Client Label</label>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>First word in italic, rest normal</p>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px' }}>
            <input
              type="text"
              name="clientLabelItalic"
              value={formData.clientLabelItalic}
              onChange={handleChange}
              style={{ ...inputStyle, fontStyle: 'italic' }}
              placeholder="Look"
            />
            <input
              type="text"
              name="clientLabelNormal"
              value={formData.clientLabelNormal}
              onChange={handleChange}
              style={inputStyle}
              placeholder="what our client said.."
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Testimonial Quote - Paragraph 1 (3 lines)</label>
          <textarea
            name="testimonialQuote1"
            value={formData.testimonialQuote1}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            placeholder="Lorem ipsum dolor sit amet consectetur. Ullamcorper amet arcu quis elementum. Convallis purus mauris at in."
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Testimonial Quote - Paragraph 2 (2 lines)</label>
          <textarea
            name="testimonialQuote2"
            value={formData.testimonialQuote2}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            placeholder="Pretium pharetra aliquam consequat duis ac risus vitae sollicitudin pharetra."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Author Name</label>
            <input
              type="text"
              name="testimonialAuthor"
              value={formData.testimonialAuthor}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Joyce Mia"
            />
          </div>
          <div>
            <label style={labelStyle}>Author Role</label>
            <input
              type="text"
              name="testimonialRole"
              value={formData.testimonialRole}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Founder"
            />
          </div>
          <div>
            <label style={labelStyle}>Author Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'testimonialImage')}
              style={{ marginTop: '4px' }}
            />
            {formData.testimonialImage && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e5e7eb', borderRadius: '8px' }}>
                <img src={formData.testimonialImage} alt="Author" style={{ ...imagePreviewStyle, width: '50px', height: '50px', borderRadius: '50%' }} />
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', wordBreak: 'break-all' }}>{formData.testimonialImage}</p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, testimonialImage: '' }))}
                  style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>CTA Section (Orange Bar)</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              name="ctaTitle"
              value={formData.ctaTitle}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Ready to start a project?"
            />
          </div>
          <div>
            <label style={labelStyle}>Button Text</label>
            <input
              type="text"
              name="ctaButtonText"
              value={formData.ctaButtonText}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Schedule Call"
            />
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <label style={labelStyle}>Description</label>
          <textarea
            name="ctaDescription"
            value={formData.ctaDescription}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            placeholder="We combine strategy, design, and performance..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', position: 'sticky', bottom: 0, backgroundColor: '#fff', padding: '16px 0' }}>
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

export default AboutPageEditor;
