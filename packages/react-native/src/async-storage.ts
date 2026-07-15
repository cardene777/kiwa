export type AsyncStorageInitial = Record<string, string>;

export interface AsyncStorageMock {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  multiGet: (keys: string[]) => Promise<Array<[string, string | null]>>;
  multiSet: (pairs: Array<[string, string]>) => Promise<void>;
}

/**
 * @react-native-async-storage/async-storage 互換 mock。 実 native module を差替えても
 * 同 signature で呼べる。 in-memory Map で backing、 test 決定的。
 */
export function mockAsyncStorage(initial: AsyncStorageInitial = {}): AsyncStorageMock {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
    async clear() {
      store.clear();
    },
    async getAllKeys() {
      return [...store.keys()];
    },
    async multiGet(keys) {
      return keys.map((k) => [k, store.get(k) ?? null] as [string, string | null]);
    },
    async multiSet(pairs) {
      for (const [k, v] of pairs) store.set(k, v);
    },
  };
}
