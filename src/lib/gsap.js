// Common GSAP configuration for the entire project
// Import this file instead of importing gsap directly in pages

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins (safe to call multiple times)
gsap.registerPlugin(ScrollTrigger);

// Default animation settings
gsap.defaults({
  ease: 'power2.out',
  duration: 0.6,
});

// ScrollTrigger defaults
ScrollTrigger.defaults({
  toggleActions: 'play none none reverse',
});

// Export everything needed
export { gsap, ScrollTrigger };

// Helper function to create scroll-triggered animations
export const createScrollAnimation = (element, animation, triggerOptions = {}) => {
  return gsap.to(element, {
    ...animation,
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
      end: 'bottom 20%',
      ...triggerOptions,
    },
  });
};

// Helper for fade-in animations
export const fadeIn = (element, options = {}) => {
  return gsap.fromTo(
    element,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ...options,
    }
  );
};

// Helper for stagger animations
export const staggerFadeIn = (elements, options = {}) => {
  return gsap.fromTo(
    elements,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      ...options,
    }
  );
};

// Cleanup helper for useEffect
export const cleanupScrollTriggers = () => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
};
