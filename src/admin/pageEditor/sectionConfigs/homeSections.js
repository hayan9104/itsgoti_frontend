export const homeSections = [
  {
    id: 'hero',
    label: 'Hero Section',
    description: 'Main hero with animated image, title, and CTA buttons',
    fields: [
      { key: 'heroImage', type: 'image', label: 'Hero Inline Image (pill shape in title)' },
      { key: 'heroDescription', type: 'textarea', label: 'Description' },
      { key: 'heroButton1Text', type: 'text', label: 'Button 1 Text' },
      { key: 'heroButton2Text', type: 'text', label: 'Button 2 Text' },
      { key: 'heroInstantText', type: 'text', label: 'Instant Response Text' },
    ]
  },
  {
    id: 'partners',
    label: 'Partner Brands',
    description: 'Logo showcase of partner brands',
    fields: [
      { key: 'partnerTitle', type: 'textarea', label: 'Partner Section Title' },
    ]
  },
  {
    id: 'experience',
    label: 'Experience Section',
    description: 'You\'ve already experienced it section',
    fields: [
      { key: 'experienceTitle1', type: 'text', label: 'Title Part 1 (Italic)' },
      { key: 'experienceTitle2', type: 'text', label: 'Title Part 2' },
      { key: 'experienceTitle3', type: 'text', label: 'Title Part 3 (Italic)' },
      { key: 'experienceTitle4', type: 'text', label: 'Title Part 4' },
      { key: 'experienceDescription', type: 'textarea', label: 'Description' },
    ]
  },
  {
    id: 'wantMore',
    label: 'Want To See More',
    description: 'CTA section to view all case studies',
    fields: [
      { key: 'wantMoreTitle', type: 'text', label: 'Title' },
      { key: 'wantMoreButtonText', type: 'text', label: 'Button Text' },
    ]
  },
  {
    id: 'realNumbers',
    label: 'Real Numbers',
    description: 'Statistics and metrics section',
    fields: [
      { key: 'realNumbersTitle', type: 'text', label: 'Title (Italic)' },
      { key: 'realNumbersTitleNormal', type: 'text', label: 'Title (Normal)' },
      { key: 'stat1Value', type: 'text', label: 'Stat 1 Value' },
      { key: 'stat1Label', type: 'text', label: 'Stat 1 Label' },
      { key: 'stat2Value', type: 'text', label: 'Stat 2 Value' },
      { key: 'stat2Label', type: 'text', label: 'Stat 2 Label' },
      { key: 'stat3Value', type: 'text', label: 'Stat 3 Value' },
      { key: 'stat3Label', type: 'text', label: 'Stat 3 Label' },
      { key: 'stat4Value', type: 'text', label: 'Stat 4 Value' },
      { key: 'stat4Label', type: 'text', label: 'Stat 4 Label' },
      { key: 'stat5Value', type: 'text', label: 'Stat 5 Value' },
      { key: 'stat5Label', type: 'text', label: 'Stat 5 Label' },
      { key: 'stat5Image', type: 'image', label: 'Stat 5 Image' },
    ]
  },
  {
    id: 'services',
    label: 'Services Section',
    description: 'Research, Development, and Designing services',
    fields: [
      { key: 'servicesTitle', type: 'text', label: 'Title (Italic)' },
      { key: 'servicesTitleNormal', type: 'text', label: 'Title (Normal)' },
      { key: 'service1Title', type: 'text', label: 'Service 1 Title' },
      { key: 'service1Description', type: 'textarea', label: 'Service 1 Description' },
      { key: 'service1Image', type: 'image', label: 'Service 1 Image' },
      { key: 'service2Title', type: 'text', label: 'Service 2 Title' },
      { key: 'service2Description', type: 'textarea', label: 'Service 2 Description' },
      { key: 'service2Image', type: 'image', label: 'Service 2 Image' },
      { key: 'service3Title', type: 'text', label: 'Service 3 Title' },
      { key: 'service3Description', type: 'textarea', label: 'Service 3 Description' },
      { key: 'service3Image', type: 'image', label: 'Service 3 Image' },
      { key: 'ctaMidButtonText', type: 'text', label: 'CTA Button Text' },
      { key: 'ctaMidInstantText', type: 'text', label: 'CTA Instant Text' },
    ]
  },
  {
    id: 'brands',
    label: 'Brands Section',
    description: 'Brands don\'t grow by accident accordion',
    fields: [
      { key: 'brandsTitle', type: 'text', label: 'Title Start' },
      { key: 'brandsTitleItalic', type: 'text', label: 'Title (Italic)' },
      { key: 'brandsTitleEnd', type: 'text', label: 'Title End' },
      { key: 'brandsDescription', type: 'textarea', label: 'Description' },
      { key: 'accordion1Title', type: 'text', label: 'Accordion 1 Title' },
      { key: 'accordion1Items', type: 'text', label: 'Accordion 1 Items (comma-separated)' },
      { key: 'accordion2Title', type: 'text', label: 'Accordion 2 Title' },
      { key: 'accordion2Items', type: 'text', label: 'Accordion 2 Items (comma-separated)' },
      { key: 'accordion3Title', type: 'text', label: 'Accordion 3 Title' },
      { key: 'accordion3Items', type: 'text', label: 'Accordion 3 Items (comma-separated)' },
      { key: 'accordion4Title', type: 'text', label: 'Accordion 4 Title' },
      { key: 'accordion4Items', type: 'text', label: 'Accordion 4 Items (comma-separated)' },
    ]
  },
  {
    id: 'cta',
    label: 'CTA Section',
    description: 'Bottom call-to-action section',
    fields: [
      { key: 'ctaHeading', type: 'text', label: 'Heading' },
      { key: 'ctaDescription1', type: 'text', label: 'Description Line 1' },
      { key: 'ctaDescription2', type: 'text', label: 'Description Line 2' },
      { key: 'ctaDescription3', type: 'text', label: 'Description Line 3' },
      { key: 'ctaButtonText', type: 'text', label: 'Button Text' },
      { key: 'ctaInstantText', type: 'text', label: 'Instant Response Text' },
    ]
  },
  {
    id: 'faq',
    label: 'FAQ Section',
    description: 'Frequently asked questions',
    fields: [
      { key: 'faqTitle', type: 'text', label: 'Title (Italic)' },
      { key: 'faqTitleNormal', type: 'text', label: 'Title (Normal)' },
      { key: 'faq1Question', type: 'text', label: 'FAQ 1 Question' },
      { key: 'faq1Answer', type: 'textarea', label: 'FAQ 1 Answer' },
      { key: 'faq2Question', type: 'text', label: 'FAQ 2 Question' },
      { key: 'faq2Answer', type: 'textarea', label: 'FAQ 2 Answer' },
      { key: 'faq3Question', type: 'text', label: 'FAQ 3 Question' },
      { key: 'faq3Answer', type: 'textarea', label: 'FAQ 3 Answer' },
      { key: 'faq4Question', type: 'text', label: 'FAQ 4 Question' },
      { key: 'faq4Answer', type: 'textarea', label: 'FAQ 4 Answer' },
      { key: 'faq5Question', type: 'text', label: 'FAQ 5 Question' },
      { key: 'faq5Answer', type: 'textarea', label: 'FAQ 5 Answer' },
      { key: 'faqContactText', type: 'text', label: 'Contact Text' },
      { key: 'faqContactLink', type: 'text', label: 'Contact Link Text' },
    ]
  },
];

export default homeSections;
