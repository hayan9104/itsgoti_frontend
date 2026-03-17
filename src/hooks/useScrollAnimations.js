import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * Hook to apply scroll-triggered animations to elements
 * @param {boolean} enabled - Whether animations are enabled
 */
const useScrollAnimations = (enabled = true) => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!enabled || hasInitialized.current) return;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      initializeAnimations();
      hasInitialized.current = true;
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [enabled]);

  const initializeAnimations = () => {
    // Fade up animation for sections
    gsap.utils.toArray('.animate-fade-up').forEach((element) => {
      gsap.fromTo(element,
        {
          opacity: 0,
          y: 60,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            end: 'top 50%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Fade in animation
    gsap.utils.toArray('.animate-fade-in').forEach((element) => {
      gsap.fromTo(element,
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Slide from left
    gsap.utils.toArray('.animate-slide-left').forEach((element) => {
      gsap.fromTo(element,
        {
          opacity: 0,
          x: -80,
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Slide from right
    gsap.utils.toArray('.animate-slide-right').forEach((element) => {
      gsap.fromTo(element,
        {
          opacity: 0,
          x: 80,
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Scale up animation
    gsap.utils.toArray('.animate-scale-up').forEach((element) => {
      gsap.fromTo(element,
        {
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Stagger children animation
    gsap.utils.toArray('.animate-stagger-children').forEach((container) => {
      const children = container.children;
      gsap.fromTo(children,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Parallax effect
    gsap.utils.toArray('.animate-parallax').forEach((element) => {
      gsap.to(element, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // Text reveal animation (words)
    gsap.utils.toArray('.animate-text-reveal').forEach((element) => {
      gsap.fromTo(element,
        {
          opacity: 0,
          y: 100,
          skewY: 7,
        },
        {
          opacity: 1,
          y: 0,
          skewY: 0,
          duration: 1.2,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Refresh ScrollTrigger after all animations are set up
    ScrollTrigger.refresh();
  };
};

export default useScrollAnimations;
