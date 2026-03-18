import { useCallback, useEffect, useMemo, useState } from 'react';

export type QueryKey = readonly unknown[];

interface CacheEntry<T> {
  data: T;
  updatedAt: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();
const listeners = new Map<string, Set<() => void>>();

const keyToString = (queryKey: QueryKey) => JSON.stringify(queryKey);

const notify = (key: string) => {
  listeners.get(key)?.forEach((listener) => listener());
};

export const invalidateQuery = (queryKey: QueryKey) => {
  const key = keyToString(queryKey);
  queryCache.delete(key);
  notify(key);
};

export const invalidateQueries = (partialKey: QueryKey) => {
  const prefix = JSON.stringify(partialKey).slice(0, -1);
  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
      notify(key);
    }
  }
};

interface UseApiQueryOptions<T> {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
  retryDelayMs?: number;
  select?: (value: T) => T;
}

export function useApiQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: UseApiQueryOptions<T> = {},
) {
  const {
    enabled = true,
    staleTime = 15_000,
    retry = 1,
    retryDelayMs = 400,
    select,
  } = options;

  const key = useMemo(() => keyToString(queryKey), [queryKey]);
  const cached = queryCache.get(key) as CacheEntry<T> | undefined;

  const [data, setData] = useState<T | undefined>(() => cached?.data);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && !cached);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsFetching(true);
    if (!queryCache.has(key)) {
      setIsLoading(true);
    }

    let attempt = 0;
    while (attempt <= retry) {
      try {
        const result = await queryFn();
        const nextData = select ? select(result) : result;
        queryCache.set(key, { data: nextData, updatedAt: Date.now() });
        setData(nextData);
        setError(null);
        break;
      } catch (err) {
        attempt += 1;
        if (attempt > retry) {
          setError(err as Error);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
      }
    }

    setIsFetching(false);
    setIsLoading(false);
  }, [enabled, key, queryFn, retry, retryDelayMs, select]);

  useEffect(() => {
    if (!enabled) return;

    const maybeCached = queryCache.get(key) as CacheEntry<T> | undefined;
    if (maybeCached && Date.now() - maybeCached.updatedAt < staleTime) {
      setData(maybeCached.data);
      setIsLoading(false);
      return;
    }

    void execute();
  }, [enabled, execute, key, staleTime]);

  useEffect(() => {
    const subscriber = () => {
      void execute();
    };
    const set = listeners.get(key) ?? new Set<() => void>();
    set.add(subscriber);
    listeners.set(key, set);

    return () => {
      const existing = listeners.get(key);
      existing?.delete(subscriber);
      if (!existing?.size) {
        listeners.delete(key);
      }
    };
  }, [execute, key]);

  const refetch = useCallback(async () => {
    invalidateQuery(queryKey);
    await execute();
  }, [execute, queryKey]);

  return { data, isLoading, isFetching, error, refetch };
}

interface MutationOptions<TPayload, TResult> {
  onMutate?: (payload: TPayload) => void;
  onSuccess?: (result: TResult, payload: TPayload) => void;
  onError?: (error: Error, payload: TPayload) => void;
  onSettled?: (payload: TPayload) => void;
}

export function useApiMutation<TPayload, TResult>(
  mutationFn: (payload: TPayload) => Promise<TResult>,
  options: MutationOptions<TPayload, TResult> = {},
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = useCallback(async (payload: TPayload) => {
    setIsLoading(true);
    setError(null);
    options.onMutate?.(payload);

    try {
      const result = await mutationFn(payload);
      options.onSuccess?.(result, payload);
      return result;
    } catch (err) {
      const normalized = err as Error;
      setError(normalized);
      options.onError?.(normalized, payload);
      throw normalized;
    } finally {
      options.onSettled?.(payload);
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  return { mutateAsync, isLoading, error };
}
