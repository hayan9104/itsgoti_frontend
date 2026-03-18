import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Note: ScrollTrigger is registered once in main.jsx

/**
 * Hook to initialize Lenis smooth scrolling and GSAP ScrollTrigger
 * @param {boolean} enabled - Whether smooth scrolling is enabled
 */
const useSmoothScroll = (enabled = true) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Cleanup
    return () => {
      lenis.destroy();
      lenisRef.current = null;
      gsap.ticker.remove(lenis.raf);
    };
  }, [enabled]);

  return lenisRef;
};

export default useSmoothScroll;
