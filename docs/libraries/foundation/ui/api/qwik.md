---
title: "@kiwa-lab/ui qwik の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ui</code> <code v-pre>qwik</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupQwikComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L52) <code v-pre>packages/ui/src/qwik.ts</code>

```ts
export declare function setupQwikComponentEnv(opts: SetupQwikComponentEnvOptions): Promise<QwikTestEnvUi>;
```

### 型

#### <code v-pre>QwikContainerLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L19) <code v-pre>packages/ui/src/qwik.ts</code>

```ts
export interface QwikContainerLike {
    container: HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
}
```

#### <code v-pre>QwikTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L25) <code v-pre>packages/ui/src/qwik.ts</code>

```ts
export interface QwikTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'qwik';
    result: QwikContainerLike;
    markup: string;
}
```

#### <code v-pre>SetupQwikComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L14) <code v-pre>packages/ui/src/qwik.ts</code>

```ts
export interface SetupQwikComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: QwikComponentLike;
}
```
