---
title: "@kiwa-lab/ui lit の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ui</code> <code v-pre>lit</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupLitComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L44) <code v-pre>packages/ui/src/lit.ts</code>

```ts
export declare function setupLitComponentEnv(opts: SetupLitComponentEnvOptions): Promise<LitTestEnvUi>;
```

### 型

#### <code v-pre>LitElementHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L15) <code v-pre>packages/ui/src/lit.ts</code>

```ts
export interface LitElementHandle {
    element: HTMLElement;
    shadowRoot: ShadowRoot | null;
    /** Query inside light DOM. */
    querySelector: <T extends Element = Element>(selector: string) => T | null;
    /** Query inside shadow DOM if present, otherwise light DOM. */
    shadowQuerySelector: <T extends Element = Element>(selector: string) => T | null;
}
```

#### <code v-pre>LitTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L24) <code v-pre>packages/ui/src/lit.ts</code>

```ts
export interface LitTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'lit';
    handle: LitElementHandle;
    markup: string;
}
```

#### <code v-pre>SetupLitComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L10) <code v-pre>packages/ui/src/lit.ts</code>

```ts
export interface SetupLitComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    template: LitTemplateLike;
}
```
