const EditableSection = ({
  sectionId,
  children,
  isEditorMode,
  isSelected,
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
    outline: isSelected ? '3px solid #2563eb' : 'none',
    outlineOffset: '-3px',
    transition: 'outline 0.2s ease',
  } : {};

  return (
    <section
      data-section-id={sectionId}
      onClick={handleClick}
      style={{ ...baseStyles, ...editorStyles }}
      onMouseEnter={(e) => {
        if (isEditorMode && !isSelected) {
          e.currentTarget.style.outline = '2px dashed #93c5fd';
          e.currentTarget.style.outlineOffset = '-2px';
        }
      }}
      onMouseLeave={(e) => {
        if (isEditorMode && !isSelected) {
          e.currentTarget.style.outline = 'none';
        }
      }}
    >
      {/* Section Label Badge - only in editor mode */}
      {isEditorMode && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: isSelected ? '#2563eb' : 'rgba(31, 41, 55, 0.85)',
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
        }}>
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
          {label || sectionId}
        </div>
      )}
      {children}
    </section>
  );
};

export default EditableSection;
