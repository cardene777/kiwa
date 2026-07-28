---
title: "@kiwa-lab/macos-app accessibility の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/macos-app</code> <code v-pre>accessibility</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>captureAccessibilityTree</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L34) <code v-pre>packages/macos-app/src/accessibility.ts</code>

SwiftUI / AppKit view tree を macOS accessibility API (AXUIElement) が返す tree に mapping。 tree walk 済み snapshot を返し、 user assert (label 存在 / role 一致 / total node 数) を可能にする。 実 AX API は起動せず view attributes から機械的に role を 推定する。

```ts
export declare function captureAccessibilityTree(env: MacAppEnv): AccessibilityTree;
```

### 型

#### <code v-pre>AccessibilityNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L13) <code v-pre>packages/macos-app/src/accessibility.ts</code>

```ts
export interface AccessibilityNode {
    id: string;
    role: AccessibilityRole;
    label: string | undefined;
    value: string | undefined;
    enabled: boolean;
    children: AccessibilityNode[];
}
```

#### <code v-pre>AccessibilityRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L3) <code v-pre>packages/macos-app/src/accessibility.ts</code>

```ts
export type AccessibilityRole = 'AXWindow' | 'AXGroup' | 'AXStaticText' | 'AXButton' | 'AXTextField' | 'AXCheckBox' | 'AXImage' | 'AXUnknown';
```

#### <code v-pre>AccessibilityTree</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L22) <code v-pre>packages/macos-app/src/accessibility.ts</code>

```ts
export interface AccessibilityTree {
    root: AccessibilityNode;
    totalNodes: number;
    capturedAt: number;
}
```
