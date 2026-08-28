import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reset scroll position on navigation.
 *
 * A single-page app keeps the scroll offset between routes by default, which
 * lands the user halfway down a page they have never seen. Hash links are
 * left alone so in-page anchors still work.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
