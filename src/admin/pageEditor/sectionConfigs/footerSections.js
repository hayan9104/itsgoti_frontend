export const footerSections = [
  {
    id: 'sayHello',
    label: 'Say Hello Section',
    description: 'Main CTA area at the top of footer',
    fields: [
      { key: 'sayHelloTitle', type: 'text', label: 'Title', hint: 'e.g. "SAY HELLO!"' },
      { key: 'buttonText', type: 'text', label: 'Button Text', hint: 'e.g. "Schedule Call"' },
      { key: 'instantResponseText', type: 'text', label: 'Text Below Button', hint: 'e.g. "Get instant response"' },
    ]
  },
  {
    id: 'writeToUs',
    label: 'Write to Us',
    description: 'Contact email addresses',
    fields: [
      { key: 'businessEmailLabel', type: 'text', label: 'Business Label', hint: 'e.g. "For Business"' },
      { key: 'businessEmail', type: 'text', label: 'Business Email', hint: 'e.g. "sayhello@goti.design"' },
      { key: 'jobsEmailLabel', type: 'text', label: 'Jobs Label', hint: 'e.g. "For Jobs"' },
      { key: 'jobsEmail', type: 'text', label: 'Jobs Email', hint: 'e.g. "people@goti.design"' },
    ]
  },
  {
    id: 'locations',
    label: 'Locations',
    description: 'Office locations',
    fields: [
      { key: 'location1Label', type: 'text', label: 'Location 1 Label', hint: 'e.g. "Location"' },
      { key: 'location1Address', type: 'textarea', label: 'Location 1 Address' },
      { key: 'location2Label', type: 'text', label: 'Location 2 Label', hint: 'e.g. "Location"' },
      { key: 'location2Address', type: 'textarea', label: 'Location 2 Address' },
    ]
  },
  {
    id: 'social',
    label: 'Social & Legal',
    description: 'Social links and copyright',
    fields: [
      { key: 'linkedinUrl', type: 'text', label: 'LinkedIn URL' },
      { key: 'instagramUrl', type: 'text', label: 'Instagram URL' },
      { key: 'copyrightText', type: 'text', label: 'Copyright Text', hint: 'e.g. "©2026 GOTI.DESIGN. ALL RIGHTS RESERVED"' },
    ]
  },
];

export default footerSections;
