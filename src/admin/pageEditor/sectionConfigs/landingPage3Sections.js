export const landingPage3Sections = [
  {
    id: 'header',
    label: 'Header',
    description: 'Blue header bar with logo',
    fields: [
      { key: 'logoImage', type: 'image', label: 'Logo Image', hint: 'Upload logo image. If uploaded, it will be shown instead of text.' },
      { key: 'logoText', type: 'text', label: 'Logo Text (Fallback)', hint: 'Used only if no logo image is uploaded. e.g. "GOTI"' },
    ]
  },
  {
    id: 'hero',
    label: 'Hero Section',
    description: 'Main headline, checkmarks, CTA button',
    fields: [
      { key: 'heroTitle', type: 'text', label: 'Hero Title', hint: 'e.g. "Your Shopify Website Design Agency"' },
      { key: 'heroSubtitle', type: 'text', label: 'Hero Subtitle', hint: 'e.g. "We specialise in Shopify design and development"' },
      { key: 'heroDescription', type: 'textarea', label: 'Hero Description', hint: 'Main tagline below subtitle' },
      { key: 'heroButtonText', type: 'text', label: 'CTA Button Text', hint: 'e.g. "GET A WEB DESIGN QUOTE"' },
      { key: 'checkmark1', type: 'text', label: 'Checkmark 1', hint: 'e.g. "10-Days Satisfaction Guarantee"' },
      { key: 'checkmark2', type: 'text', label: 'Checkmark 2', hint: 'e.g. "Launch your E-commerce in week"' },
      { key: 'checkmark3', type: 'text', label: 'Checkmark 3', hint: 'e.g. "2-3 weeks average delivery"' },
    ]
  },
  {
    id: 'phoneCarousel',
    label: 'Phone Carousel',
    description: 'Phone mockups showcase',
    fields: [
      { key: 'portfolioImages', type: 'imageArray', label: 'Phone Screen Images', maxItems: 5, hint: 'Upload phone screen images (3 recommended)' },
    ]
  },
  {
    id: 'problem',
    label: 'Problem Section',
    description: '"Understand Why" card with pain points',
    fields: [
      { key: 'problemTitle', type: 'textarea', label: 'Problem Statement', hint: 'e.g. "Most Shopify stores are built to look good—not to convert..."' },
      { key: 'understandWhyTitle', type: 'text', label: 'Card Title', hint: 'e.g. "Understand Why"' },
      { key: 'painPoints', type: 'painPointsArray', label: 'Pain Points', maxItems: 8, hint: 'Add pain points with highlighted text and description' },
      { key: 'understandWhyConclusion', type: 'text', label: 'Conclusion Text', hint: 'e.g. "= Weeks of lost sales"' },
      { key: 'betterWayText', type: 'text', label: 'Better Way Text', hint: 'e.g. "There\'s a better way"' },
    ]
  },
  {
    id: 'solution',
    label: 'Solution Section',
    description: 'Title with service icons grid',
    fields: [
      { key: 'solutionTitle', type: 'text', label: 'Section Title', hint: 'e.g. "Design a Shopify store that actually sells."' },
      { key: 'services', type: 'servicesArray', label: 'Services', maxItems: 6, hint: 'Add services with icon and label' },
    ]
  },
  {
    id: 'features',
    label: 'Features Groups',
    description: 'Auto-rotating feature groups with checkpoints',
    fields: [
      { key: 'featureGroups', type: 'featuresGroupArray', label: 'Feature Groups', maxGroups: 10, hint: 'Add groups of features. Each group auto-rotates based on the timer setting.' },
    ]
  },
  {
    id: 'caseStudies',
    label: 'Case Studies',
    description: 'Client success stories with metrics',
    fields: [
      { key: 'caseStudies', type: 'caseStudiesArray', label: 'Case Studies', maxItems: 5, hint: 'Add multiple case studies with metrics' },
    ]
  },
  {
    id: 'clients',
    label: 'Clients Marquee',
    description: '⚠️ Client logos are fetched from Landing Page 2. Edit them in Landing Page 2 settings.',
    fields: [
      { key: '_info', type: 'text', label: 'ℹ️ Note', hint: 'This section displays client logos from Landing Page 2. To add/edit logos, go to Landing Page 2 editor.' },
    ]
  },
  {
    id: 'pricing',
    label: 'Pricing Section',
    description: 'Two pricing cards - Growth & Starter',
    fields: [
      // Header
      { key: 'pricingTitle', type: 'text', label: 'Pricing Title', hint: 'e.g. "Stuck at 7 figures/year?"' },
      { key: 'pricingSubtitle', type: 'text', label: 'Pricing Subtitle', hint: 'e.g. "Not for long"' },
      { key: 'pricingDescription', type: 'textarea', label: 'Pricing Description' },
      // Plan 1 - Green Card
      { key: 'plan1Price', type: 'text', label: 'Plan 1 Price', hint: 'e.g. "$XX / MONTH"' },
      { key: 'plan1Subtitle', type: 'text', label: 'Plan 1 Subtitle', hint: 'e.g. "Everything you need to scale faster."' },
      { key: 'plan1BusinessTitle', type: 'text', label: 'Plan 1 Business Title', hint: 'e.g. "If your business"' },
      { key: 'plan1Criteria', type: 'textarea', label: 'Plan 1 Criteria (one per line)', hint: 'Business criteria for this plan' },
      { key: 'plan1MeansTitle', type: 'text', label: 'Plan 1 "What This Means" Title' },
      { key: 'plan1MeansDescription', type: 'textarea', label: 'Plan 1 "What This Means" Description' },
      { key: 'plan1Conclusion', type: 'text', label: 'Plan 1 Conclusion', hint: 'Bold text at bottom' },
      { key: 'plan1ButtonText', type: 'text', label: 'Plan 1 Button Text', hint: 'e.g. "GET STARTED"' },
      // Plan 2 - White Card
      { key: 'plan2Price', type: 'text', label: 'Plan 2 Price', hint: 'e.g. "$XX / MONTH"' },
      { key: 'plan2Subtitle', type: 'text', label: 'Plan 2 Subtitle' },
      { key: 'plan2BusinessTitle', type: 'text', label: 'Plan 2 Business Title' },
      { key: 'plan2Criteria', type: 'textarea', label: 'Plan 2 Criteria (one per line)' },
      { key: 'plan2MeansTitle', type: 'text', label: 'Plan 2 "What This Means" Title' },
      { key: 'plan2MeansDescription', type: 'textarea', label: 'Plan 2 "What This Means" Description' },
      { key: 'plan2Conclusion', type: 'text', label: 'Plan 2 Conclusion' },
    ]
  },
  {
    id: 'contact',
    label: 'Contact Form',
    description: 'Lead capture form with title',
    fields: [
      { key: 'contactTitle', type: 'text', label: 'Contact Title', hint: 'e.g. "Have More Question?"' },
      { key: 'contactHighlight', type: 'text', label: 'Contact Highlight', hint: 'e.g. "Book A Call" (circled text)' },
      { key: 'contactDescription', type: 'textarea', label: 'Contact Description' },
      { key: 'formPlaceholder1', type: 'text', label: 'Company Name Placeholder', hint: 'e.g. "COMPANY NAME"' },
      { key: 'formPlaceholder2', type: 'text', label: 'Contact Number Placeholder', hint: 'e.g. "CONTACT NUMBER"' },
      { key: 'formPlaceholder3', type: 'text', label: 'Service Placeholder', hint: 'e.g. "WHAT SERVICE YOU ARE LOOKING FOR?"' },
      { key: 'submitButtonText', type: 'text', label: 'Submit Button Text', hint: 'e.g. "SUBMIT"' },
      { key: 'whatsappText', type: 'text', label: 'WhatsApp Text', hint: 'e.g. "Need instant response? Let\'s connect on WhatsApp"' },
    ]
  },
  {
    id: 'stickyCta',
    label: 'Sticky CTA Bar & WhatsApp',
    description: 'Bottom CTA bar with queue counter and WhatsApp settings',
    fields: [
      { key: 'queueCount', type: 'text', label: 'Queue Count', hint: 'e.g. "05"' },
      { key: 'queueText', type: 'text', label: 'Queue Text', hint: 'e.g. "Projects sessions in the queue"' },
      { key: 'whatsappNumber', type: 'whatsappNumber', label: 'WhatsApp Business Number', hint: 'Enter your WhatsApp number with country code. This will be used for all WhatsApp buttons on this page.' },
      { key: 'whatsappDefaultMessage', type: 'text', label: 'Default WhatsApp Message', hint: 'Pre-filled message when user clicks WhatsApp. e.g. "Hi, I\'m interested in web design services"' },
    ]
  },
  {
    id: 'footer',
    label: 'Footer',
    description: 'Dark footer with social links',
    fields: [
      { key: 'instagramLink', type: 'text', label: 'Instagram URL' },
      { key: 'facebookLink', type: 'text', label: 'Facebook URL' },
      { key: 'linkedinLink', type: 'text', label: 'LinkedIn URL' },
      { key: 'copyrightText', type: 'text', label: 'Copyright Text', hint: 'e.g. "Copyright 2025 GOTI.DESIGN. All rights reserved."' },
      { key: 'siteUseText', type: 'text', label: 'Site Use Link Text', hint: 'e.g. "Site Use"' },
      { key: 'siteUseLink', type: 'text', label: 'Site Use URL' },
    ]
  },
];
