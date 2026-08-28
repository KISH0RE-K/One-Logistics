import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query from JavaScript.
 * Used only where layout genuinely differs in behaviour (not just in styling)
 * - CSS handles everything that can be handled in CSS.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Below the tablet breakpoint the app switches to its mobile layout. */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}
