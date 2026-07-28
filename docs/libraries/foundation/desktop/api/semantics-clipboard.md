---
title: "@kiwa-lab/desktop semantics-clipboard の API 契約"
---

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics-clipboard</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>clearClipboard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L95) <code v-pre>packages/desktop/src/semantics/clipboard.ts</code>

```ts
export declare function clearClipboard(session: ClipboardSession): AxisStep<ClipboardState>;
```

#### <code v-pre>notifyClipboardChange</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L81) <code v-pre>packages/desktop/src/semantics/clipboard.ts</code>

```ts
export declare function notifyClipboardChange(session: ClipboardSession, externalContents: string): AxisStep<ClipboardState>;
```

#### <code v-pre>openClipboard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L40) <code v-pre>packages/desktop/src/semantics/clipboard.ts</code>

```ts
export declare function openClipboard(input: {
    target: DesktopTarget;
    clipboardId: string;
}): ClipboardSession;
```

#### <code v-pre>readClipboard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L72) <code v-pre>packages/desktop/src/semantics/clipboard.ts</code>

```ts
export declare function readClipboard(session: ClipboardSession): AxisStep<ClipboardState>;
```

#### <code v-pre>writeClipboard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L56) <code v-pre>packages/desktop/src/semantics/clipboard.ts</code>

```ts
export declare function writeClipboard(session: ClipboardSession, input: {
    contents: string;
    format: ClipboardFormat;
}): AxisStep<ClipboardState>;
```

### 型

#### <code v-pre>ClipboardFormat</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L9) <code v-pre>packages/desktop/src/semantics/clipboard.ts</code>

```ts
export type ClipboardFormat = 'text' | 'html' | 'image' | 'file-list';
```

#### <code v-pre>ClipboardSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L11) <code v-pre>packages/desktop/src/semantics/clipboard.ts</code>

```ts
export interface ClipboardSession {
    target: DesktopTarget;
    clipboardId: string;
    state: ClipboardState;
    contents: string | null;
    format: ClipboardFormat | null;
    changeCount: number;
    history: AxisStep<ClipboardState>[];
}
```

#### <code v-pre>ClipboardState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/clipboard.ts#L7) <code v-pre>packages/desktop/src/semantics/clipboard.ts</code>

Clipboard axis (v0.3) — write + read + change + clear の 4 step 遷移。 macOS NSPasteboard + Windows OpenClipboard + Linux gtk_clipboard を uniform 扱い。

```ts
export type ClipboardState = 'idle' | 'written' | 'read' | 'changed' | 'cleared';
```
