---
title: "@kiwa-lab/expo file-system の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/expo</code> <code v-pre>file-system</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>mockFileSystem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L29) <code v-pre>packages/expo/src/file-system.ts</code>

expo-file-system の read / write / info / delete mock。 in-memory Map で uri → content 保管、 実 file I/O なしで file 経路の test を書ける。

```ts
export declare function mockFileSystem(options?: FileSystemOptions): FileSystemMock;
```

### 型

#### <code v-pre>FileInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L1) <code v-pre>packages/expo/src/file-system.ts</code>

```ts
export interface FileInfo {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
}
```

#### <code v-pre>FileSystemMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L14) <code v-pre>packages/expo/src/file-system.ts</code>

```ts
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
```

#### <code v-pre>FileSystemOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L9) <code v-pre>packages/expo/src/file-system.ts</code>

```ts
export interface FileSystemOptions {
    initial?: Record<string, string>;
    nowFn?: () => number;
}
```
