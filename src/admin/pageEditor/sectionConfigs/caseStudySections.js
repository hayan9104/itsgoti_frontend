// Case Study Section Configurations
// Each section defines what fields can be edited and how they're displayed

export const caseStudySections = [
  {
    id: 'hero',
    label: 'Hero & Basic Info',
    description: 'Title, client, logo, banner, and tags',
    fields: [
      { key: 'title', type: 'text', label: 'Title', required: true, placeholder: 'Case Study Title' },
      { key: 'client', type: 'text', label: 'Client', required: true, placeholder: 'Client Name' },
      { key: 'clientLogo', type: 'dualImage', label: 'Client Logo', desktopKey: 'clientLogo', mobileKey: 'clientLogoMobile' },
      { key: 'bannerImage', type: 'dualImage', label: 'Banner Image', desktopKey: 'bannerImage', mobileKey: 'bannerImageMobile' },
      { key: 'industry', type: 'text', label: 'Industry', placeholder: 'e.g. Automotive' },
      { key: 'platform', type: 'text', label: 'Platform', placeholder: 'e.g. Mobile App' },
      { key: 'duration', type: 'text', label: 'Duration', placeholder: 'e.g. 6 months' },
      { key: 'projectFocus', type: 'stringArray', label: 'Project Focus', placeholder: 'e.g. UX Design' },
      { key: 'services', type: 'stringArray', label: 'Services', placeholder: 'e.g. Branding' },
      { key: 'technologies', type: 'stringArray', label: 'Technologies', placeholder: 'e.g. React' },
    ]
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    description: 'Collaboration story text',
    fields: [
      { key: 'collaborationTitle', type: 'text', label: 'Section Title', placeholder: 'The Collaboration' },
      { key: 'collaborationText', type: 'textarea', label: 'Collaboration Text', rows: 5, placeholder: 'Describe the collaboration...' },
    ]
  },
  {
    id: 'challenge',
    label: 'Challenge & Solution',
    description: 'Problem statement, solution, and results',
    fields: [
      { key: 'challenge', type: 'textarea', label: 'Challenge', required: true, rows: 4, placeholder: 'Describe the challenge...' },
      { key: 'solution', type: 'textarea', label: 'Solution', required: true, rows: 4, placeholder: 'Describe the solution...' },
      { key: 'results', type: 'textarea', label: 'Results', rows: 4, placeholder: 'Describe the results...' },
    ]
  },
  {
    id: 'process',
    label: 'Process Steps',
    description: 'Step-by-step process breakdown',
    fields: [
      { key: 'processSteps', type: 'processSteps', label: 'Process Steps' },
    ]
  },
  {
    id: 'opportunities',
    label: 'Opportunities Discovered',
    description: 'Key opportunities found during the project',
    fields: [
      { key: 'opportunities', type: 'opportunities', label: 'Opportunities' },
    ]
  },
  {
    id: 'experience',
    label: 'Experience',
    description: 'Experience showcase images and quote',
    fields: [
      { key: 'experienceTitle', type: 'text', label: 'Section Title', placeholder: 'The Experience We Created' },
      { key: 'experienceImages', type: 'dualImageArray', label: 'Experience Images', desktopKey: 'experienceImages', mobileKey: 'experienceImagesMobile' },
      { key: 'experienceQuote', type: 'textarea', label: 'Quote', rows: 3, placeholder: 'Add an inspiring quote...' },
    ]
  },
  {
    id: 'gallery',
    label: 'Gallery Images',
    description: 'Additional project screenshots',
    fields: [
      { key: 'images', type: 'dualImageArray', label: 'Gallery Images', desktopKey: 'images', mobileKey: 'imagesMobile' },
    ]
  },
  {
    id: 'colors',
    label: 'Color Palette',
    description: 'Project color scheme',
    fields: [
      { key: 'colorPalette', type: 'colorPalette', label: 'Colors' },
    ]
  },
  {
    id: 'typography',
    label: 'Typography',
    description: 'Font family and preview',
    fields: [
      { key: 'typography.fontFamily', type: 'text', label: 'Font Family', placeholder: 'e.g. Plus Jakarta Sans' },
      { key: 'typography.fontImage', type: 'dualImage', label: 'Font Preview Image', desktopKey: 'typography.fontImage', mobileKey: 'typography.fontImageMobile' },
    ]
  },
  {
    id: 'metrics',
    label: 'Metrics & Results',
    description: 'Key performance metrics',
    fields: [
      { key: 'metrics', type: 'metrics', label: 'Metrics' },
    ]
  },
  {
    id: 'related',
    label: 'Related Projects',
    description: 'Link to related work',
    fields: [
      { key: 'relatedWorks', type: 'relatedWorks', label: 'Related Projects' },
    ]
  },
  {
    id: 'settings',
    label: 'Publishing Settings',
    description: 'Publish status and display order',
    fields: [
      { key: 'published', type: 'checkbox', label: 'Published' },
      { key: 'order', type: 'number', label: 'Display Order', placeholder: '0' },
    ]
  },
];

export const getDefaultCaseStudyData = () => ({
  title: '',
  slug: '',
  client: '',
  clientLogo: '',
  clientLogoMobile: '',
  industry: '',
  platform: '',
  duration: '',
  projectFocus: [],
  services: [],
  heroImage: '',
  heroImageMobile: '',
  bannerImage: '',
  bannerImageMobile: '',
  collaborationTitle: 'The Collaboration',
  collaborationText: '',
  challenge: '',
  solution: '',
  results: '',
  processSteps: [],
  opportunities: [],
  experienceTitle: 'The Experience We Created',
  experienceImages: [],
  experienceImagesMobile: [],
  experienceQuote: '',
  colorPalette: [],
  typography: { fontFamily: '', fontImage: '', fontImageMobile: '', characterSet: '' },
  metrics: [],
  images: [],
  imagesMobile: [],
  technologies: [],
  relatedWorks: [],
  published: false,
  order: 0,
  // Section visibility defaults (all visible by default)
  heroVisible: true,
  collaborationVisible: true,
  challengeVisible: true,
  processVisible: true,
  opportunitiesVisible: true,
  experienceVisible: true,
  galleryVisible: true,
  colorsVisible: true,
  typographyVisible: true,
  metricsVisible: true,
  relatedVisible: true,
  settingsVisible: true,
});
