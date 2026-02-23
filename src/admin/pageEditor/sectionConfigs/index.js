import { aboutSections } from './aboutSections';
import { workSections } from './workSections';
import { contactSections } from './contactSections';
import { homeSections } from './homeSections';
import { approachSections } from './approachSections';
import { footerSections } from './footerSections';
import { landingSections } from './landingSections';

// Map page names to their section configurations
const sectionConfigs = {
  'about': aboutSections,
  'work': workSections,
  'contact': contactSections,
  'home': homeSections,
  'approach': approachSections,
  'footer': footerSections,
  'landing': landingSections,
};

export const getSectionsForPage = (pageName) => {
  return sectionConfigs[pageName] || [];
};

export const getSectionById = (pageName, sectionId) => {
  const sections = getSectionsForPage(pageName);
  return sections.find(s => s.id === sectionId);
};

export { aboutSections, workSections, contactSections, homeSections, approachSections, footerSections, landingSections };
