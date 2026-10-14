import { useCallback, useEffect, useRef, useState } from 'react';
import { apiMessage } from '../api/client.js';

/**
 * Thin data-fetching hook: useApi(fetcher, { deps, immediate }).
 * Returns { data, loading, error, reload, setData }.
 */
export function useApi(fetcher, { deps = [], immediate = true, onSuccess } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(...args);
      if (mounted.current) {
        setData(result);
        onSuccess?.(result);
      }
      return result;
    } catch (err) {
      if (mounted.current) setError(apiMessage(err));
      throw err;
    } finally {
      if (mounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (immediate) run().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: run, setData };
}

export default useApi;
