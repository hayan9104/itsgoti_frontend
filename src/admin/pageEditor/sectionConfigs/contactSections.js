export const contactSections = [
  {
    id: 'hero',
    label: 'Hero Section',
    description: 'Hero image on the left side',
    fields: [
      { key: 'heroImage', type: 'image', label: 'Hero Image (Desktop)' },
      { key: 'heroImageMobile', type: 'image', label: 'Hero Image (Mobile)' },
    ]
  },
  {
    id: 'form',
    label: 'Form Section',
    description: 'Form title and labels',
    fields: [
      { key: 'formTitle', type: 'text', label: 'Form Title' },
      { key: 'formTitleItalic', type: 'text', label: 'Italic Word in Title' },
      { key: 'nameLabel', type: 'text', label: 'Name Field Label' },
      { key: 'namePlaceholder', type: 'text', label: 'Name Placeholder' },
      { key: 'emailLabel', type: 'text', label: 'Email Field Label' },
      { key: 'emailPlaceholder', type: 'text', label: 'Email Placeholder' },
      { key: 'phoneLabel', type: 'text', label: 'Phone Field Label' },
      { key: 'phonePlaceholder', type: 'text', label: 'Phone Placeholder' },
      { key: 'messageLabel', type: 'text', label: 'Message Field Label' },
      { key: 'messagePlaceholder', type: 'text', label: 'Message Placeholder' },
      { key: 'sourceLabel', type: 'text', label: 'Source Field Label' },
      { key: 'sourceOptions', type: 'textarea', label: 'Source Options', hint: 'Enter each option on a new line' },
      { key: 'submitButtonText', type: 'text', label: 'Submit Button Text' },
    ]
  },
  {
    id: 'success',
    label: 'Success Message',
    description: 'Message shown after form submission',
    fields: [
      { key: 'successTitle', type: 'text', label: 'Success Title' },
      { key: 'successMessage', type: 'textarea', label: 'Success Message' },
      { key: 'successButtonText', type: 'text', label: 'Button Text' },
    ]
  },
];

export default contactSections;
