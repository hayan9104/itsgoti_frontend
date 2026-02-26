const EditableSection = ({
  sectionId,
  children,
  isEditorMode,
  isSelected,
  isHidden = false,
  label,
  style = {}
}) => {
  const handleClick = (e) => {
    if (!isEditorMode) return;

    e.stopPropagation();

    // Send message to parent (admin panel)
    window.parent.postMessage({
      type: 'SECTION_CLICKED',
      sectionId: sectionId
    }, window.location.origin);
  };

  // Base styles - keep position from style prop if provided, otherwise use relative
  const baseStyles = {
    position: 'relative',
    ...style,
  };

  // Editor mode styles
  const editorStyles = isEditorMode ? {
    cursor: 'pointer',
    outline: isSelected ? '3px solid #2563eb' : isHidden ? '2px dashed #ef4444' : 'none',
    outlineOffset: '-3px',
    transition: 'outline 0.2s ease, filter 0.3s ease, opacity 0.3s ease',
  } : {};

  // Hidden section styles (blur effect in editor mode)
  const hiddenStyles = isEditorMode && isHidden ? {
    filter: 'blur(3px)',
    opacity: 0.5,
  } : {};

  return (
    <section
      data-section-id={sectionId}
      onClick={handleClick}
      style={{ ...baseStyles, ...editorStyles, ...hiddenStyles }}
      onMouseEnter={(e) => {
        if (isEditorMode && !isSelected) {
          e.currentTarget.style.outline = isHidden ? '2px dashed #ef4444' : '2px dashed #93c5fd';
          e.currentTarget.style.outlineOffset = '-2px';
        }
      }}
      onMouseLeave={(e) => {
        if (isEditorMode && !isSelected) {
          e.currentTarget.style.outline = isHidden ? '2px dashed #ef4444' : 'none';
        }
      }}
    >
      {/* Section Label Badge - only in editor mode */}
      {isEditorMode && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: isHidden ? '#ef4444' : isSelected ? '#2563eb' : 'rgba(31, 41, 55, 0.85)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          zIndex: 100,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          filter: 'none', // Remove blur from badge
        }}>
          {isHidden ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : isSelected ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : null}
          {label || sectionId}
          {isHidden && <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.9 }}>(HIDDEN)</span>}
        </div>
      )}
      {children}
    </section>
  );
};

export default EditableSection;
