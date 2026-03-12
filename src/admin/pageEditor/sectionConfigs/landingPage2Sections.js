export const landingPage2Sections = [
  {
    id: 'header',
    label: 'Header',
    description: 'Logo and branding',
    fields: [
      { key: 'logoText', type: 'text', label: 'Logo Text', hint: 'e.g. "goti"' },
      { key: 'logoImage', type: 'image', label: 'Logo Image (Optional)', hint: 'Upload logo if you prefer image over text' },
    ]
  },
  {
    id: 'hero',
    label: 'Hero Section',
    description: 'Main headline and portfolio showcase',
    fields: [
      { key: 'heroTitle', type: 'text', label: 'Hero Title', hint: 'e.g. "Your Shopify Website Design Agency"' },
      { key: 'heroDescription', type: 'textarea', label: 'Description', hint: 'Main tagline with key selling points' },
      { key: 'heroButtonText', type: 'text', label: 'Button Text', hint: 'e.g. "See Price"' },
      { key: 'portfolioImages', type: 'imageArray', label: 'Portfolio Images', maxItems: 6, hint: 'Showcase images (5-6 recommended)' },
    ]
  },
  {
    id: 'guarantees',
    label: 'Guarantees Section',
    description: '3 key guarantees/promises',
    fields: [
      { key: 'guarantee1Icon', type: 'image', label: 'Guarantee 1 Icon (44x44px)', hint: 'Upload icon for first guarantee' },
      { key: 'guarantee1Title', type: 'text', label: 'Guarantee 1 Title (Blue)', hint: 'e.g. "10-Day Satisfaction Guarantee"' },
      { key: 'guarantee1Text', type: 'text', label: 'Guarantee 1 Description (Black)', hint: 'Supporting text after title' },
      { key: 'guarantee2Icon', type: 'image', label: 'Guarantee 2 Icon (44x44px)', hint: 'Upload icon for second guarantee' },
      { key: 'guarantee2Title', type: 'text', label: 'Guarantee 2 Title (Black)', hint: 'e.g. "Launch your E-commerce business in weeks,"' },
      { key: 'guarantee2Highlight', type: 'text', label: 'Guarantee 2 Highlight (Blue)', hint: 'Blue highlighted text, e.g. "not months."' },
      { key: 'guarantee3Icon', type: 'image', label: 'Guarantee 3 Icon (44x44px)', hint: 'Upload icon for third guarantee' },
      { key: 'guarantee3Title', type: 'text', label: 'Guarantee 3 Title (Blue)', hint: 'e.g. "Unlimited revisions"' },
      { key: 'guarantee3Text', type: 'text', label: 'Guarantee 3 Description (Black)', hint: 'Supporting text after title' },
    ]
  },
  {
    id: 'clients',
    label: 'Clients Section',
    description: 'Client logos with marquee animation',
    fields: [
      { key: 'clientsTitle', type: 'text', label: 'Section Title', hint: 'e.g. "Our Shopify Clients"' },
      { key: 'clientLogos', type: 'imageArray', label: 'Client Logos (Marquee)', maxItems: 15, hint: 'Upload multiple logos for marquee animation (recommended: 6-12 logos)' },
    ]
  },
  {
    id: 'pricing',
    label: 'Pricing Plans Section',
    description: 'Two pricing tiers',
    fields: [
      { key: 'pricingTitle', type: 'text', label: 'Section Title', hint: 'e.g. "Shopify Design Plans."' },
      { key: 'pricingSubtitle', type: 'text', label: 'Section Subtitle', hint: 'e.g. "Choose a plan that\'s right for you..."' },
      // Plan 1 - Popular
      { key: 'plan1Label', type: 'text', label: 'Plan 1 Label', hint: 'e.g. "Popular Plan"' },
      { key: 'plan1Price', type: 'text', label: 'Plan 1 Price', hint: 'e.g. "₹00,000/-"' },
      { key: 'plan1Subtitle', type: 'text', label: 'Plan 1 Subtitle', hint: 'e.g. "One request at a time. Pause or cancel anytime."' },
      { key: 'plan1Features', type: 'textarea', label: 'Plan 1 Features (one per line)', hint: 'Each feature on a new line' },
      // Plan 2
      { key: 'plan2Price', type: 'text', label: 'Plan 2 Price', hint: 'e.g. "₹00,000/-"' },
      { key: 'plan2Subtitle', type: 'text', label: 'Plan 2 Subtitle', hint: 'e.g. "Two requests at a time. Pause or cancel anytime."' },
      { key: 'plan2Features', type: 'textarea', label: 'Plan 2 Features (one per line)', hint: 'Each feature on a new line' },
    ]
  },
  {
    id: 'callNow',
    label: 'Call Now CTA Section',
    description: 'Mid-page call to action',
    fields: [
      { key: 'ctaTitle', type: 'text', label: 'CTA Title', hint: 'e.g. "Not sure what\'s right for you? Let\'s figure it out together."' },
      { key: 'ctaDescription', type: 'textarea', label: 'CTA Description' },
      { key: 'ctaButtonText', type: 'text', label: 'CTA Button Text', hint: 'e.g. "Call Now"' },
      { key: 'ctaPhoneNumber', type: 'text', label: 'Phone Number', hint: 'e.g. "+919876543210"' },
    ]
  },
  {
    id: 'contactForm',
    label: 'Contact Form Section',
    description: 'Lead capture form with logo/badge',
    fields: [
      { key: 'formTitle', type: 'text', label: 'Form Title', hint: 'e.g. "Let\'s Build Your Shopify Store — The Right Way."' },
      { key: 'formDescription', type: 'textarea', label: 'Form Description' },
      { key: 'formLogo', type: 'image', label: 'Form Logo/Badge Image', hint: 'Upload logo to display at top of form (replaces Shopify Partners badge)' },
      { key: 'formButtonText', type: 'text', label: 'Submit Button Text', hint: 'e.g. "Book A Call"' },
      { key: 'formResponseText', type: 'text', label: 'Response Text', hint: 'e.g. "*Get Instant Response*"' },
      { key: 'formNamePlaceholder', type: 'text', label: 'Name Field Placeholder', hint: 'e.g. "Your name"' },
      { key: 'formEmailPlaceholder', type: 'text', label: 'Email Field Placeholder', hint: 'e.g. "Your email"' },
      { key: 'formPhonePlaceholder', type: 'text', label: 'Phone Field Placeholder', hint: 'e.g. "Your contact number"' },
      { key: 'successTitle', type: 'text', label: 'Success Message Title', hint: 'e.g. "Thank you!"' },
      { key: 'successMessage', type: 'text', label: 'Success Message', hint: 'e.g. "We\'ll get back to you within 24 hours."' },
    ]
  },
  {
    id: 'footer',
    label: 'Footer Section',
    description: 'Simple footer with thank you message',
    fields: [
      { key: 'footerText', type: 'text', label: 'Footer Text', hint: 'e.g. "Thanks for visiting"' },
      { key: 'copyrightText', type: 'text', label: 'Copyright Text', hint: 'e.g. "© Goti 2025. All rights reserved."' },
    ]
  },
];
