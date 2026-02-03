/**
 * Storage abstraction - must be implemented by platform
 */
export interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

let storageImpl: IStorage | null = null;

export function setStorageImpl(impl: IStorage) {
  storageImpl = impl;
}

export function getStorage(): IStorage {
  if (!storageImpl) {
    throw new Error("Storage implementation not set. Call setStorageImpl() first.");
  }
  return storageImpl;
}
