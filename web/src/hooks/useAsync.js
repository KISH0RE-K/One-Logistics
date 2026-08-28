import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Run an async request and track loading / error / data for it.
 *
 * Every screen that loads from the API uses this so that loading and error
 * states are handled the same way everywhere - no screen is ever left blank
 * while a request is in flight.
 */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);

  const mounted = useRef(true);
  const callbackRef = useRef(fn);
  callbackRef.current = fn;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callbackRef.current(...args);
      if (mounted.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(err);
      throw err;
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!immediate) return;
    run().catch(() => {
      /* error is already captured in state and rendered by the screen */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, isLoading, run, setData, reload: run };
}
