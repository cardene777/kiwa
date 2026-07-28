---
title: "@kiwa-lab/ui vue の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ui</code> <code v-pre>vue</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupVueComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L53) <code v-pre>packages/ui/src/vue.ts</code>

```ts
export declare function setupVueComponentEnv(opts: SetupVueComponentEnvOptions): Promise<VueTestEnvUi>;
```

### 型

#### <code v-pre>SetupVueComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L9) <code v-pre>packages/ui/src/vue.ts</code>

```ts
export interface SetupVueComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: VueComponentLike;
    props?: Record<string, unknown>;
    slots?: Record<string, unknown>;
}
```

#### <code v-pre>VueTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L33) <code v-pre>packages/ui/src/vue.ts</code>

```ts
export interface VueTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'vue';
    wrapper: VueWrapperLike;
    markup: string;
}
```

#### <code v-pre>VueWrapperLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L24) <code v-pre>packages/ui/src/vue.ts</code>

```ts
export interface VueWrapperLike {
    html: () => string;
    find: (selector: string) => VueDomWrapperLike;
    findAll: (selector: string) => VueDomWrapperLike[];
    trigger: (eventName: string) => Promise<void>;
    setValue?: (value: unknown) => Promise<void>;
    unmount: () => void;
}
```
