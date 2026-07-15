export interface FileInfo {
  exists: boolean;
  uri: string;
  size?: number;
  isDirectory?: boolean;
  modificationTime?: number;
}

export interface FileSystemOptions {
  initial?: Record<string, string>;
  nowFn?: () => number;
}

export interface FileSystemMock {
  documentDirectory: string;
  cacheDirectory: string;
  readAsStringAsync: (uri: string) => Promise<string>;
  writeAsStringAsync: (uri: string, content: string) => Promise<void>;
  getInfoAsync: (uri: string) => Promise<FileInfo>;
  deleteAsync: (uri: string) => Promise<void>;
  listUris: () => string[];
  clear: () => void;
}

/**
 * expo-file-system の read / write / info / delete mock。 in-memory Map で uri → content
 * 保管、 実 file I/O なしで file 経路の test を書ける。
 */
export function mockFileSystem(options: FileSystemOptions = {}): FileSystemMock {
  const files = new Map<string, string>(Object.entries(options.initial ?? {}));
  const modTimes = new Map<string, number>();
  const nowFn = options.nowFn ?? (() => 1_700_000_000_000);

  for (const uri of files.keys()) modTimes.set(uri, nowFn());

  return {
    documentDirectory: 'file:///mock/document/',
    cacheDirectory: 'file:///mock/cache/',
    async readAsStringAsync(uri: string): Promise<string> {
      const content = files.get(uri);
      if (content === undefined) throw new Error(`File not found: ${uri}`);
      return content;
    },
    async writeAsStringAsync(uri: string, content: string): Promise<void> {
      files.set(uri, content);
      modTimes.set(uri, nowFn());
    },
    async getInfoAsync(uri: string): Promise<FileInfo> {
      const exists = files.has(uri);
      const info: FileInfo = { exists, uri };
      if (exists) {
        const content = files.get(uri)!;
        info.size = content.length;
        info.isDirectory = false;
        const modTime = modTimes.get(uri);
        if (modTime !== undefined) info.modificationTime = modTime;
      }
      return info;
    },
    async deleteAsync(uri: string): Promise<void> {
      files.delete(uri);
      modTimes.delete(uri);
    },
    listUris() {
      return Array.from(files.keys());
    },
    clear() {
      files.clear();
      modTimes.clear();
    },
  };
}
