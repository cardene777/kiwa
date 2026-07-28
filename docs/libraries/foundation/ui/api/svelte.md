---
title: "@kiwa-lab/ui svelte の API 契約"
---

# <code v-pre>@kiwa-lab/ui</code> <code v-pre>svelte</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupSvelteComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L42) <code v-pre>packages/ui/src/svelte.ts</code>

```ts
export declare function setupSvelteComponentEnv(opts: SetupSvelteComponentEnvOptions): Promise<SvelteTestEnvUi>;
```

### 型

#### <code v-pre>SetupSvelteComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L9) <code v-pre>packages/ui/src/svelte.ts</code>

```ts
export interface SetupSvelteComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: SvelteComponentLike;
    props?: Record<string, unknown>;
}
```

#### <code v-pre>SvelteContainerLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L15) <code v-pre>packages/ui/src/svelte.ts</code>

```ts
export interface SvelteContainerLike {
    container: HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
}
```

#### <code v-pre>SvelteTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L21) <code v-pre>packages/ui/src/svelte.ts</code>

```ts
export interface SvelteTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'svelte';
    result: SvelteContainerLike;
    markup: string;
}
```
