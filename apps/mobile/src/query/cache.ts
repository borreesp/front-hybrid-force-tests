type CacheKey = string;

const data = new Map<CacheKey, unknown>();
const error = new Map<CacheKey, unknown>();
const updatedAt = new Map<CacheKey, number>();
const inflight = new Map<CacheKey, Promise<unknown>>();

export function get<T>(key: CacheKey): T | undefined {
  return data.get(key) as T | undefined;
}

export function set(key: CacheKey, value: unknown) {
  data.set(key, value);
  updatedAt.set(key, Date.now());
  error.delete(key);
}

export function getUpdatedAt(key: CacheKey) {
  return updatedAt.get(key);
}

export function getError(key: CacheKey) {
  return error.get(key);
}

export function setError(key: CacheKey, value: unknown) {
  error.set(key, value);
  updatedAt.set(key, Date.now());
}

export function clear(key: CacheKey) {
  data.delete(key);
  error.delete(key);
  updatedAt.delete(key);
  inflight.delete(key);
}

export function clearMany(prefixOrKeys: string | string[]) {
  if (Array.isArray(prefixOrKeys)) {
    prefixOrKeys.forEach((key) => clear(key));
    return;
  }
  const prefix = prefixOrKeys;
  const keys = new Set<CacheKey>([
    ...data.keys(),
    ...error.keys(),
    ...updatedAt.keys(),
    ...inflight.keys()
  ]);
  keys.forEach((key) => {
    if (key.startsWith(prefix)) {
      clear(key);
    }
  });
}

export function getInflight(key: CacheKey) {
  return inflight.get(key);
}

export function setInflight(key: CacheKey, promise: Promise<unknown>) {
  inflight.set(key, promise);
}

export function clearInflight(key: CacheKey) {
  inflight.delete(key);
}
