import { useCallback, useEffect, useRef, useState } from "react";

import {
  clear,
  get,
  getError,
  getInflight,
  getUpdatedAt,
  set,
  setError,
  setInflight,
  clearInflight
} from "./cache";

type QueryOptions<T> = {
  enabled?: boolean;
  ttlMs?: number;
  initialData?: T;
  onError?: (err: unknown) => void;
};

const DEFAULT_TTL_MS = 30_000;

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: QueryOptions<T> = {}
) {
  const { enabled = true, ttlMs = DEFAULT_TTL_MS, initialData, onError } = options;
  const [data, setData] = useState<T | undefined>(() => {
    const cached = get<T>(key);
    if (cached !== undefined) return cached;
    return initialData;
  });
  const [error, setErrorState] = useState<unknown>(() => getError(key));
  const [loading, setLoading] = useState<boolean>(enabled && data === undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSet = useCallback((fn: () => void) => {
    if (mountedRef.current) {
      fn();
    }
  }, []);

  const execute = useCallback(
    async (force: boolean) => {
      if (!enabled) return undefined;
      const cached = get<T>(key);
      const cachedError = getError(key);
      const updated = getUpdatedAt(key);
      const stale =
        force ||
        ttlMs === 0 ||
        updated === undefined ||
        Date.now() - updated > ttlMs;

      if (!stale) {
        if (cached !== undefined) {
          safeSet(() => {
            setData(cached);
            setErrorState(cachedError ?? null);
            setLoading(false);
          });
          return cached;
        }
        if (cachedError) {
          safeSet(() => {
            setErrorState(cachedError);
            setLoading(false);
          });
          return undefined;
        }
      }

      safeSet(() => {
        setLoading(true);
        setErrorState(null);
      });

      const existing = getInflight(key);
      if (existing) {
        try {
          const result = await existing;
          const next = get<T>(key) ?? (result as T);
          safeSet(() => {
            if (next !== undefined) setData(next);
            setErrorState(getError(key) ?? null);
            setLoading(false);
          });
          return next;
        } catch (err) {
          safeSet(() => {
            setErrorState(err);
            setLoading(false);
          });
          onError?.(err);
          throw err;
        }
      }

      const promise = fetcher();
      setInflight(key, promise);
      try {
        const result = await promise;
        set(key, result);
        safeSet(() => {
          setData(result);
          setErrorState(null);
          setLoading(false);
        });
        return result;
      } catch (err) {
        setError(key, err);
        safeSet(() => {
          setErrorState(err);
          setLoading(false);
        });
        onError?.(err);
        throw err;
      } finally {
        clearInflight(key);
      }
    },
    [enabled, fetcher, key, onError, safeSet, ttlMs]
  );

  useEffect(() => {
    if (!enabled) return;
    if (initialData !== undefined && get(key) === undefined) {
      set(key, initialData);
    }
    execute(false);
  }, [enabled, execute, initialData, key]);

  const refetch = useCallback((force = true) => execute(force), [execute]);

  const invalidate = useCallback(() => {
    clear(key);
    safeSet(() => {
      setData(initialData);
      setErrorState(null);
    });
  }, [initialData, key, safeSet]);

  return { data, loading, error, refetch, invalidate };
}
