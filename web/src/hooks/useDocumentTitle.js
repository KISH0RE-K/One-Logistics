import { useEffect } from 'react';

const SUFFIX = 'One Logistics Experience';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SUFFIX}` : SUFFIX;
  }, [title]);
}
