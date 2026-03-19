import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseStudiesAPI, worksAPI } from '../../services/api';
import { caseStudySections, getDefaultCaseStudyData } from '../pageEditor/sectionConfigs/caseStudySections';

const CaseStudyEditorContext = createContext(null);

export const useCaseStudyEditor = () => {
  const context = useContext(CaseStudyEditorContext);
  if (!context) {
    throw new Error('useCaseStudyEditor must be used within CaseStudyEditorProvider');
  }
  return context;
};

export const CaseStudyEditorProvider = ({ children, isNew = false, basePath = '/goti/admin/case-studies' }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(getDefaultCaseStudyData());
  const [allWorks, setAllWorks] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [iframeSlug, setIframeSlug] = useState(null);

  const iframeRef = useRef(null);

  // Fetch all works for related projects selector
  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await worksAPI.getAll();
        setAllWorks(response.data.data || []);
      } catch (err) {
        console.error('Error fetching works:', err);
      }
    };
    fetchWorks();
  }, []);

  // Fetch case study data if editing
  useEffect(() => {
    if (!isNew && id) {
      const fetchCaseStudy = async () => {
        setIsLoading(true);
        try {
          const response = await caseStudiesAPI.getOne(id);
          const data = response.data.data;
          setFormData({ ...getDefaultCaseStudyData(), ...data });
          if (data.slug && !iframeSlug) {
            setIframeSlug(data.slug);
          }
          setError(null);
        } catch (err) {
          console.error('Error fetching case study:', err);
          setError('Failed to load case study');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCaseStudy();
    }
  }, [id, isNew]);

  // Send updates to iframe
  useEffect(() => {
    const sendUpdate = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'EDITOR_UPDATE',
          payload: {
            section: selectedSection,
            data: formData,
          }
        }, window.location.origin);
      }
    };
    const timeoutId = setTimeout(sendUpdate, 50);
    return () => clearTimeout(timeoutId);
  }, [formData, selectedSection]);

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Update a single field
  const updateField = useCallback((key, value) => {
    setFormData(prev => {
      const updated = { ...prev };

      // Handle nested keys (e.g., 'typography.fontFamily')
      if (key.includes('.')) {
        const keys = key.split('.');
        let obj = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      } else {
        updated[key] = value;

        // Auto-generate slug from title if creating new
        if (key === 'title' && isNew) {
          updated.slug = generateSlug(value);
        }
      }

      return updated;
    });
    setHasChanges(true);
  }, [isNew]);

  // Select a section for editing
  const selectSection = useCallback((sectionId) => {
    setSelectedSection(sectionId);
  }, []);

  // Clear section selection (go back to list)
  const clearSection = useCallback(() => {
    setSelectedSection(null);
  }, []);

  // Save the case study
  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      if (isNew) {
        const response = await caseStudiesAPI.create(formData);
        const newId = response.data.data._id;
        const newSlug = response.data.data.slug;
        setIframeSlug(newSlug);
        setHasChanges(false);
        // Navigate to edit page after creation
        navigate(`${basePath}/edit/${newId}`, { replace: true });
      } else {
        await caseStudiesAPI.update(id, formData);
        setHasChanges(false);
        // Refresh iframe
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        }
      }
      return true;
    } catch (err) {
      console.error('Error saving case study:', err);
      alert('Failed to save case study');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, isNew, id, navigate, basePath]);

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionId) => {
    const visibilityKey = `${sectionId}Visible`;
    const currentValue = formData[visibilityKey] !== false;
    updateField(visibilityKey, !currentValue);
  }, [formData, updateField]);

  // Check if section is visible
  const isSectionVisible = useCallback((sectionId) => {
    const visibilityKey = `${sectionId}Visible`;
    return formData[visibilityKey] !== false;
  }, [formData]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'EDITOR_INIT',
          payload: {
            section: selectedSection,
            data: formData,
          }
        }, window.location.origin);
      }
    }, 100);
  }, [formData, selectedSection]);

  const value = {
    // State
    formData,
    allWorks,
    selectedSection,
    isLoading,
    isSaving,
    error,
    hasChanges,
    isNew,
    iframeSlug,
    iframeRef,
    basePath,
    sections: caseStudySections,

    // Actions
    updateField,
    selectSection,
    clearSection,
    save,
    toggleSectionVisibility,
    isSectionVisible,
    handleIframeLoad,
    setFormData,
  };

  return (
    <CaseStudyEditorContext.Provider value={value}>
      {children}
    </CaseStudyEditorContext.Provider>
  );
};
