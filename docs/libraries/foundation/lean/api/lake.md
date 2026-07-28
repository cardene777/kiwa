---
title: "@kiwa-lab/lean lake の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>lake</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lake.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>generateLakeProject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lake.ts#L48) <code v-pre>packages/lean/src/lake.ts</code>

```ts
export declare function generateLakeProject(config: LakeProjectConfig): LakeProjectFiles;
```

### 型

#### <code v-pre>LakeProjectConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lake.ts#L16) <code v-pre>packages/lean/src/lake.ts</code>

```ts
export interface LakeProjectConfig {
    /** Package name (kebab-case), becomes the Lake package name. */
    packageName: string;
    /** Root Lean namespace (PascalCase), becomes the library and its directory. */
    rootNamespace: string;
    /** Lean toolchain version — pinned so specs are reproducible. */
    leanToolchain?: string;
    /**
     * Module basenames placed under `<rootNamespace>/`, without the extension.
     *
     * The glob already brings them into the build, so this only decides whether
     * `import <rootNamespace>` alone reaches them. Naming them makes the root
     * module a table of contents rather than an empty file.
     */
    modules?: readonly string[];
}
```

#### <code v-pre>LakeProjectFiles</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lake.ts#L33) <code v-pre>packages/lean/src/lake.ts</code>

```ts
export interface LakeProjectFiles {
    files: Record<string, string>;
}
```
