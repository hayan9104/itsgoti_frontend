import { useEffect, useState } from 'react';

// Single source of truth for the "is this a phone-sized viewport" question.
// 768px matches our CSS breakpoint in team-mobile.css so the JS and CSS layers stay aligned.
//
// We use matchMedia (rather than tracking resize events) so subscribers get notified
// only when the viewport actually crosses the threshold — cheap, no debounce needed.
const MOBILE_QUERY = '(max-width: 768px)';

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    // Modern browsers expose addEventListener on MediaQueryList; older Safari uses the legacy API.
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return isMobile;
}
