export const workSections = [
  {
    id: 'hero',
    label: 'Hero Section',
    description: 'Title and description at the top',
    fields: [
      { key: 'heroTitle', type: 'text', label: 'Title', hint: 'e.g. "Create with Perfection"' },
      { key: 'heroTitleItalic', type: 'text', label: 'Italic Word in Title', hint: 'Word to italicize' },
      { key: 'heroDescription', type: 'textarea', label: 'Description' },
    ]
  },
  {
    id: 'cta',
    label: 'CTA Section',
    description: 'Call-to-action at the bottom',
    fields: [
      { key: 'ctaHeading', type: 'text', label: 'Heading' },
      { key: 'ctaDescription1', type: 'text', label: 'Description Line 1' },
      { key: 'ctaDescription2', type: 'text', label: 'Description Line 2' },
      { key: 'ctaDescription3', type: 'text', label: 'Description Line 3' },
      { key: 'ctaButtonText', type: 'text', label: 'Button Text' },
      { key: 'ctaInstantText', type: 'text', label: 'Text Below Button' },
    ]
  },
];

export default workSections;
