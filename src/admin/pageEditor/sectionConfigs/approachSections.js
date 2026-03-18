export const approachSections = [
  {
    id: 'hero',
    label: 'Hero Section',
    description: 'Main hero with coral background and decorative ovals',
    fields: [
      { key: 'heroTitle', type: 'text', label: 'Title (Normal)' },
      { key: 'heroTitleItalic', type: 'text', label: 'Title (Italic)' },
      { key: 'heroTitleContinue', type: 'text', label: 'Title (Continue)' },
      { key: 'heroDescription', type: 'textarea', label: 'Description' },
      { key: 'heroBackgroundImage', type: 'image', label: 'Background Texture Image' },
      { key: 'heroLogoImage', type: 'image', label: 'Logo Image' },
      { key: 'heroLogoTitle', type: 'text', label: 'Logo Title' },
      { key: 'heroLogoSubtitle1', type: 'text', label: 'Logo Subtitle 1' },
      { key: 'heroLogoSubtitle2', type: 'text', label: 'Logo Subtitle 2' },
    ]
  },
  {
    id: 'process',
    label: 'Process Section',
    description: 'Our process title',
    fields: [
      { key: 'processTitle', type: 'text', label: 'Title (Italic)' },
      { key: 'processTitleNormal', type: 'text', label: 'Title (Normal)' },
      { key: 'processTitleItalic', type: 'text', label: 'Title End (Italic)' },
    ]
  },
  {
    id: 'steps',
    label: 'Process Steps',
    description: 'Four process steps with alternating layout',
    fields: [
      // Step 1
      { key: 'step1Number', type: 'text', label: 'Step 1 Number' },
      { key: 'step1Title', type: 'text', label: 'Step 1 Title' },
      { key: 'step1Desc1', type: 'textarea', label: 'Step 1 Description (Paragraph 1)' },
      { key: 'step1Desc2', type: 'textarea', label: 'Step 1 Description (Paragraph 2)' },
      { key: 'step1Image', type: 'image', label: 'Step 1 Image' },
      // Step 2
      { key: 'step2Number', type: 'text', label: 'Step 2 Number' },
      { key: 'step2Title', type: 'text', label: 'Step 2 Title' },
      { key: 'step2Desc', type: 'textarea', label: 'Step 2 Description' },
      { key: 'step2Image', type: 'image', label: 'Step 2 Image' },
      // Step 3
      { key: 'step3Number', type: 'text', label: 'Step 3 Number' },
      { key: 'step3Title', type: 'text', label: 'Step 3 Title' },
      { key: 'step3Desc', type: 'textarea', label: 'Step 3 Description' },
      { key: 'step3Image', type: 'image', label: 'Step 3 Image' },
      // Step 4
      { key: 'step4Number', type: 'text', label: 'Step 4 Number' },
      { key: 'step4Title', type: 'text', label: 'Step 4 Title' },
      { key: 'step4Desc', type: 'textarea', label: 'Step 4 Description' },
      { key: 'step4Image', type: 'image', label: 'Step 4 Image' },
    ]
  },
  {
    id: 'kpi',
    label: 'KPI Section',
    description: 'KPI-driven experiences with logo circles',
    fields: [
      { key: 'kpiTitle', type: 'text', label: 'Title (Start)' },
      { key: 'kpiTitleItalic', type: 'text', label: 'Title (Italic)' },
      { key: 'kpiTitleEnd', type: 'text', label: 'Title (End)' },
      { key: 'kpiLogos', type: 'imageArray', label: 'Logo Circles', maxItems: 4 },
    ]
  },
  {
    id: 'beforeAfter',
    label: 'Before/After Section',
    description: 'Interactive before/after image slider',
    fields: [
      { key: 'beforeImage', type: 'image', label: 'Before Image' },
      { key: 'afterImage', type: 'image', label: 'After Image' },
    ]
  },
  {
    id: 'cta',
    label: 'CTA Section',
    description: 'Ready to start a project call to action',
    fields: [
      { key: 'ctaTitle', type: 'text', label: 'CTA Title' },
      { key: 'ctaDescription', type: 'textarea', label: 'CTA Description' },
      { key: 'ctaButtonText', type: 'text', label: 'Button Text' },
    ]
  },
];

export default approachSections;
