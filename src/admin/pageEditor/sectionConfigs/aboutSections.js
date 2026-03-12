export const aboutSections = [
  {
    id: 'hero',
    label: 'Hero Section',
    description: 'Main hero area with title and images',
    fields: [
      { key: 'heroTitle1', type: 'text', label: 'Title Part 1' },
      { key: 'heroTitle1Italic', type: 'text', label: 'Title Part 1 (Italic)' },
      { key: 'heroTitle2', type: 'text', label: 'Title Part 2' },
      { key: 'heroTitle2Italic', type: 'text', label: 'Title Part 2 (Italic)' },
      { key: 'heroImage1', type: 'image', label: 'Hero Image 1 (Desktop)', hint: 'Large image' },
      { key: 'heroImage2', type: 'image', label: 'Hero Image 2 (Desktop)', hint: 'Small image' },
      { key: 'heroImage1Mobile', type: 'image', label: 'Hero Image 1 (Mobile)' },
      { key: 'heroImage2Mobile', type: 'image', label: 'Hero Image 2 (Mobile)' },
      { key: 'designBoxSubtitle', type: 'text', label: 'Design Box Subtitle' },
      { key: 'designBoxLine1', type: 'text', label: 'Design Box Line 1' },
      { key: 'designBoxLine2', type: 'text', label: 'Design Box Line 2' },
      { key: 'designBoxLine3', type: 'text', label: 'Design Box Line 3' },
      { key: 'designBoxLinkText', type: 'text', label: 'Design Box Link Text' },
    ]
  },
  {
    id: 'youDontNeed',
    label: '"You Don\'t Need" Section',
    description: 'Team description with avatars (logos are fetched from Home Page > Partner Brands)',
    fields: [
      { key: 'sectionTitle', type: 'text', label: 'Section Title' },
      { key: 'sectionSubtitle', type: 'text', label: 'Section Subtitle' },
      { key: 'sectionDescription', type: 'textarea', label: 'Description' },
      { key: 'sectionAvatars', type: 'imageArray', label: 'Team Avatars', maxItems: 4, hint: 'Circular profile images', useObjectFormat: true },
    ]
  },
  {
    id: 'tenMinds',
    label: '10 Minds Section',
    description: 'Scroll-animated section',
    fields: [
      { key: 'mindsTitle', type: 'text', label: 'Section Title' },
      { key: 'mindsImages', type: 'imageArray', label: 'Scroll Images', maxItems: 3, hint: 'Images that change on scroll', useObjectFormat: true },
    ]
  },
  {
    id: 'testimonialHeading',
    label: 'Testimonial Heading',
    description: 'Intro text and client label (used on About & Case Study pages)',
    fields: [
      { key: 'testimonialTextItalic', type: 'text', label: 'Intro Text (Italic Word)', hint: 'e.g. "GOTI"' },
      { key: 'testimonialTextNormal', type: 'textarea', label: 'Intro Text (Rest)', hint: 'Description after italic word' },
      { key: 'clientLabelItalic', type: 'text', label: 'Client Label (Italic)', hint: 'e.g. "Look"' },
      { key: 'clientLabelNormal', type: 'text', label: 'Client Label (Normal)', hint: 'e.g. "what our client said.."' },
    ]
  },
  {
    id: 'cta',
    label: 'CTA Section',
    description: 'Call-to-action with button',
    fields: [
      { key: 'ctaTitle', type: 'text', label: 'Title' },
      { key: 'ctaDescription', type: 'textarea', label: 'Description' },
      { key: 'ctaButtonText', type: 'text', label: 'Button Text' },
      { key: 'ctaSubText', type: 'text', label: 'Text Below Button', hint: 'e.g. "Get instant response"' },
    ]
  },
];

export default aboutSections;
