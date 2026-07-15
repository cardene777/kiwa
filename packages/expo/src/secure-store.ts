export interface SecureStoreOptions {
  initial?: Record<string, string>;
  failOn?: (key: string) => boolean;
}

export interface SecureStoreMock {
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
  listKeys: () => string[];
  clear: () => void;
}

/**
 * expo-secure-store (Keychain / Keystore backed) mock。 in-memory Map で
 * key-value 保管、 async signature を維持して production code と同 API で叩ける。
 */
export function mockSecureStore(options: SecureStoreOptions = {}): SecureStoreMock {
  const store = new Map<string, string>(Object.entries(options.initial ?? {}));
  const failOn = options.failOn;

  return {
    async setItemAsync(key: string, value: string): Promise<void> {
      if (failOn?.(key)) throw new Error(`SecureStore setItemAsync failed for key: ${key}`);
      store.set(key, value);
    },
    async getItemAsync(key: string): Promise<string | null> {
      if (failOn?.(key)) throw new Error(`SecureStore getItemAsync failed for key: ${key}`);
      return store.get(key) ?? null;
    },
    async deleteItemAsync(key: string): Promise<void> {
      if (failOn?.(key)) throw new Error(`SecureStore deleteItemAsync failed for key: ${key}`);
      store.delete(key);
    },
    listKeys() {
      return Array.from(store.keys());
    },
    clear() {
      store.clear();
    },
  };
}
