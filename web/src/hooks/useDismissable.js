import { useEffect } from 'react';

/**
 * Close a popover when focus or a pointer leaves it, or on Escape.
 *
 * Covers keyboard users as well as mouse users: tabbing out of the menu
 * closes it just like clicking away does.
 */
export function useDismissable(ref, isOpen, onDismiss) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) onDismiss();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') onDismiss();
    }

    function onFocusIn(event) {
      if (ref.current && !ref.current.contains(event.target)) onDismiss();
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [ref, isOpen, onDismiss]);
}
